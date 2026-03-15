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
        const { booking_id, name, email, return_url, service_name, total_price, deposit_amount, processing_fee } = await req.json();

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

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items,
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
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            status: 400,
        });
    }
});
