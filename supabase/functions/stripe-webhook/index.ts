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

      // Detect if it's a late night booking (10pm - 5am)
      let isLate = false;
      if (booking.start_datetime) {
        const d = new Date(booking.start_datetime);
        const hour = d.getUTCHours(); // Using UTC to be safe, but local hour check might be needed depending on DB storage
        isLate = hour >= 22 || hour < 5;
      }

      const cleanIG = (booking.instagram || "").replace('@', '');
      const igLink = `https://instagram.com/${cleanIG}`;
      const cleanPhone = (booking.phone || "").replace(/[^0-9+]/g, '');

      const wogEmailHtml = `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; max-width: 600px; margin: 0 auto; padding: 20px; color: #111111;">
                
                <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 24px;">Alright Wog, you've got a new booking! &nbsp;🎉 ${isLate ? '<span style="background-color: #c3ff00; color: #000; padding: 2px 8px; border-radius: 4px; font-size: 12px; vertical-align: middle; margin-left: 10px;">LATE RATE</span>' : ''}</h2>
                
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
                    <li><strong>Deposit Paid:</strong> £${Number(booking.deposit_amount).toFixed(2)}</li>
                    <li><strong>Balance Due:</strong> £${(Number(booking.total_price) - Number(booking.deposit_amount)).toFixed(2)} ${isLate ? '<span style="color: #0B6B4F; font-weight: bold;">(Includes Late Rate)</span>' : ''}</li>
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
        from: "LocksByWog <bookings@blocq.co.uk>",
        to: ["locksbywog2110@gmail.com"],
        subject: `${isLate ? '🌙 ' : ''}NEW BOOKING: ${booking.name} on ${dateFormatted} at ${timeFormatted}`,
        html: wogEmailHtml,
      });

      console.log(`Successfully sent stylist notification email for booking ${bookingId}`);

      // --- SEND EMAIL TO CUSTOMER ---
      const depositAmount = Number(booking.deposit_amount);
      const totalPrice = Number(booking.total_price);
      const remainingBalance = totalPrice - depositAmount;

      const customerEmailHtml = `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; max-width: 600px; margin: 0 auto; padding: 20px; color: #111111;">
                
                <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 24px;">Your booking is confirmed! &nbsp;🎉</h2>
                
                <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
                  Hey ${booking.name},<br/><br/>
                  Your payment has been successfully processed, and your slot is officially locked in.
                </p>
        
                <div style="background-color: #f4f4f4; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                  <h3 style="margin-top:0; margin-bottom: 15px;">Your Booking Details:</h3>
                  <ul style="list-style: none; padding: 0; margin: 0; font-size: 15px; line-height: 1.8;">
                    <li><strong>Date:</strong> ${dateFormatted}</li>
                    <li><strong>Time:</strong> ${timeFormatted}</li>
                    <li><strong>Location:</strong> Salford, Manchester (M6 6DQ)</li>
                    <li style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e0e0e0;"><strong>Total Price:</strong> £${totalPrice.toFixed(2)} ${isLate ? '<span style="font-size: 11px; background-color: #c3ff00; color: #000; padding: 1px 6px; border-radius: 3px; font-weight: bold; margin-left: 5px;">LATE RATE APPLIED</span>' : ''}</li>
                    <li><strong>Amount Paid (Deposit):</strong> £${depositAmount.toFixed(2)}</li>
                    <li style="font-size: 16px; margin-top: 5px; color: #0B6B4F;"><strong>Remaining Balance:</strong> £${remainingBalance.toFixed(2)}</li>
                  </ul>
                  <p style="font-size: 12px; color: #666; margin-top: 15px; font-style: italic;">
                    * The remaining balance is to be paid on the day of your appointment.
                  </p>
                </div>
        
                <p style="font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
                  <strong>Late Arrival Policy:</strong> Please arrive on time. There is a <strong>£10 late fee</strong> if you are more than 15 minutes late to your appointment.
                </p>
                
                <p style="font-size: 15px; font-weight: bold;">
                  See you soon,<br/>
                  Locks By Wog
                </p>
                
                <p style="font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 15px; margin-top: 20px;">
                  This is a non-refundable booking deposit. If you need to reschedule, please contact us at least 48 hours in advance.
                </p>
              </div>
            `;

      await resend.emails.send({
        from: "LocksByWog <bookings@blocq.co.uk>",
        to: [booking.email],
        subject: `Booking Confirmed - Locks By Wog`,
        html: customerEmailHtml,
      });

      console.log(`Successfully sent customer confirmation email for booking ${bookingId}`);
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }
});
