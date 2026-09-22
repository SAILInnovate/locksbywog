import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "npm:stripe@^12.0.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
    // Embedded Checkout (ui_mode) was made generally available in the
    // 2024-06-20 API version; the previous pin of 2023-10-16 predates it and
    // would reject the parameter.
    apiVersion: "2024-06-20",
});

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        status,
    });
}

/**
 * Appends query params without re-encoding the base URL.
 *
 * The previous version always appended "?" to a return_url that already
 * contained a query string, which produced "...?a=1&b=2?booking_success=true".
 * That corrupted the last parameter and relied on booking_success happening to
 * appear first. Using URL.searchParams instead is not an option here because it
 * would percent-encode the literal {CHECKOUT_SESSION_ID} placeholder that
 * Stripe substitutes.
 */
function appendParams(base: string, extra: string): string {
    return `${base}${base.includes("?") ? "&" : "?"}${extra}`;
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: CORS_HEADERS });
    }

    try {
        const {
            booking_id,
            name,
            email,
            return_url,
            service_name,
            total_price,
            deposit_amount,
            processing_fee,
            ui_mode,
        } = await req.json();

        if (!booking_id || !return_url) {
            throw new Error("Missing required parameters");
        }

        const line_items = [];

        if (deposit_amount !== undefined && processing_fee !== undefined) {
            line_items.push({
                price_data: {
                    currency: "gbp",
                    product_data: {
                        name: `Booking Deposit - ${service_name || "Service"}`,
                        description: "Non-refundable deposit to secure your slot. This amount will be deducted from your total service price.",
                    },
                    unit_amount: Math.round(Number(deposit_amount) * 100),
                },
                quantity: 1,
            });
            line_items.push({
                price_data: {
                    currency: "gbp",
                    product_data: {
                        name: "Processing Fee",
                        description: "Non-refundable booking processing fee.",
                    },
                    unit_amount: Math.round(Number(processing_fee) * 100),
                },
                quantity: 1,
            });
        } else {
            line_items.push({
                price_data: {
                    currency: "gbp",
                    product_data: {
                        name: `${service_name || "Locks By Wog Booking"}`,
                        description: "Payment to secure your slot.",
                    },
                    unit_amount: Math.round(Number(total_price) * 100),
                },
                quantity: 1,
            });
        }

        // Embedded mode: the payment form renders inside the site's own modal,
        // so the customer never leaves the page. Returns a client secret
        // instead of a redirect URL.
        if (ui_mode === "embedded") {
            try {
                const session = await stripe.checkout.sessions.create({
                    ui_mode: "embedded",
                    // payment_method_types is deliberately omitted here. Embedded
                    // Checkout uses dynamic payment methods, which brings in
                    // Apple Pay / Google Pay and Link alongside cards - fewer
                    // taps and no card entry for most mobile customers.
                    line_items,
                    mode: "payment",
                    // Used only if the bank requires a redirect for
                    // authentication; a plain card payment completes in place.
                    return_url,
                    customer_email: email,
                    client_reference_id: booking_id,
                });

                if (session.client_secret) {
                    return json({ client_secret: session.client_secret });
                }

                console.error("Embedded session returned no client_secret, falling back to hosted.");
            } catch (embeddedError: any) {
                // Never let a problem with embedded checkout break payments.
                // Fall through and create a hosted session instead, which is
                // the behaviour this function had before embedded support.
                console.error(
                    `Embedded checkout unavailable, falling back to hosted: ${embeddedError?.message}`
                );
            }
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items,
            mode: "payment",
            success_url: appendParams(
                return_url,
                "booking_success=true&session_id={CHECKOUT_SESSION_ID}"
            ),
            cancel_url: appendParams(return_url, "booking_cancelled=true"),
            customer_email: email,
            client_reference_id: booking_id, // Important to tie back to the booking
        });

        return json({ url: session.url });
    } catch (error: any) {
        return json({ error: error.message }, 400);
    }
});
