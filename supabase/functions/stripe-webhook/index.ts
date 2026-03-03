import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "npm:stripe@^12.0.0";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@3.2.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
  apiVersion: "2023-10-16",
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
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

      const { data: booking, error: fetchError } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .single();

      if (fetchError || !booking) {
        throw new Error(`Failed to fetch booking ${bookingId}: ${fetchError?.message}`);
      }

      if (booking.deposit_paid) {
        console.log(`Booking ${bookingId} already marked as paid. Skipping update and emails.`);
        return new Response(JSON.stringify({ received: true, message: "Already paid" }), { status: 200 });
      }

      const { error: updateError } = await supabase
        .from("bookings")
        .update({
          deposit_paid: true,
          status: "confirmed",
          stripe_session_id: session.id,
          stripe_payment_intent: session.payment_intent as string,
        })
        .eq("id", bookingId);

      if (updateError) {
        throw new Error(`Failed to update booking ${bookingId}: ${updateError.message}`);
      }

      console.log(`Successfully confirmed booking ${bookingId}`);

      // Send Emails
      let dateFormatted = "Unknown Date";
      let timeFormatted = "Unknown Time";

      if (booking.start_datetime) {
        try {
          const d = new Date(booking.start_datetime);
          if (!isNaN(d.getTime())) {
            dateFormatted = d.toLocaleDateString('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            });
            timeFormatted = d.toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit'
            });
          }
        } catch (e) { }
      }

      const cleanIG = (booking.instagram || "").replace('@', '');
      const igLink = `https://instagram.com/${cleanIG}`;
      const cleanPhone = (booking.phone || "").replace(/[^0-9+]/g, '');

      const wogEmailHtml = `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; max-width: 600px; margin: 0 auto; padding: 20px; color: #111111;">
                
                <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 24px;">Alright Wog, you've got a new booking! &nbsp;🎉</h2>
                
                <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
                  Someone's just locked in a slot and paid their deposit. Here are the full details below so you can hit them up straight away.
                </p>

                <div style="background-color: #f4f4f4; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                  <ul style="list-style: none; padding: 0; margin: 0; font-size: 15px; line-height: 1.8;">
                    <li><strong>Customer:</strong> ${booking.name}</li>
                    <li><strong>Instagram:</strong> @${cleanIG}</li>
                    <li><strong>Phone:</strong> ${booking.phone}</li>
                    <li style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e0e0e0;"><strong>Date:</strong> ${dateFormatted}</li>
                    <li><strong>Time:</strong> ${timeFormatted}</li>
                    <li><strong>Deposit Paid:</strong> £${booking.deposit_amount}</li>
                  </ul>
                  
                  ${booking.notes ? `
                  <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e0e0e0; font-size: 14px;">
                    <strong>Notes from customer:</strong><br/>
                    <span style="color: #444; font-style: italic;">${booking.notes}</span>
                  </div>
                  ` : ''}
                </div>

                <h3 style="font-size: 18px; margin-bottom: 12px;">Get in touch right now:</h3>
                
                <div style="display: flex; gap: 12px; margin-bottom: 30px;">
                  <a href="${igLink}" style="background-color: #111111; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">
                    DM on Instagram
                  </a>
                  
                  <a href="tel:${cleanPhone}" style="background-color: #0B6B4F; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block; margin-left:10px;">
                     Call / Text
                  </a>
                </div>

                <p style="font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 15px;">
                  This is an automated notification from your LocksByWog booking system.
                </p>
              </div>
            `;

      await resend.emails.send({
        from: "LocksByWog Bookings <bookings@blocq.co.uk>",
        to: ["locksbywog2110@gmail.com"],
        subject: `🚨 NEW BOOKING 🚨: ${booking.name} on ${dateFormatted} at ${timeFormatted}`,
        html: wogEmailHtml,
      });

      console.log(`Successfully sent notification email for booking ${bookingId}`);
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }
});
