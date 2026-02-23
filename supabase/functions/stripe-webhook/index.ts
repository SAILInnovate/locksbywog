import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "npm:stripe@^12.0.0";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
    apiVersion: "2023-10-16",
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

serve(async (req) => {
    // Only accept POST requests
    if (req.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
    }

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
        return new Response("No signature found", { status: 400 });
    }

    const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!endpointSecret) {
        console.error("STRIPE_WEBHOOK_SECRET is not set.");
        return new Response("Webhook secret not configured", { status: 500 });
    }

    try {
        const bodyText = await req.text();
        const event = await stripe.webhooks.constructEventAsync(
            bodyText,
            signature,
            endpointSecret,
            undefined,
            cryptoProvider
        );

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") as string,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string
        );

        if (event.type === "checkout.session.completed") {
            const session = event.data.object as Stripe.Checkout.Session;

            const bookingId = session.client_reference_id;
            if (!bookingId) {
                throw new Error("No client_reference_id found in session");
            }

            const { error } = await supabase
                .from("bookings")
                .update({
                    deposit_paid: true,
                    status: "confirmed",
                    stripe_session_id: session.id,
                    stripe_payment_intent: session.payment_intent as string,
                })
                .eq("id", bookingId);

            if (error) {
                throw new Error(`Failed to update booking ${bookingId}: ${error.message}`);
            }

            console.log(`Successfully confirmed booking ${bookingId}`);
        }

        return new Response(JSON.stringify({ received: true }), { status: 200 });
    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        return new Response(JSON.stringify({ error: err.message }), { status: 400 });
    }
});
