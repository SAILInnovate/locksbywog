import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "npm:stripe@^12.0.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
    apiVersion: "2023-10-16",
});

serve(async (req) => {
    // Handle CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
            },
        });
    }

    try {
        const { booking_id, name, email, return_url, service_name, total_price } = await req.json();

        if (!booking_id || !return_url || !total_price) {
            throw new Error("Missing required parameters");
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "gbp",
                        product_data: {
                            name: `${service_name || "Locks By Wog Booking"}`,
                            description: "Full payment to secure your slot.",
                        },
                        unit_amount: Math.round(Number(total_price) * 100), // convert to pence
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${return_url}?booking_success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${return_url}?booking_cancelled=true`,
            customer_email: email,
            client_reference_id: booking_id, // Important to tie back to the booking
        });

        return new Response(JSON.stringify({ url: session.url }), {
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            status: 200,
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            status: 400,
        });
    }
});
