import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@3.2.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  try {
    const payload = await req.json();

    // We expect this to be triggered by a Supabase Database Webhook on the 'bookings' table
    // It captures the NEW record inserted or updated
    const booking = payload.record;

    // Optional: Fetch service details from the DB if necessary, 
    // but the basics (like time, name, instagram, phone) are on the booking.

    // Safety check just in case
    if (!booking || !booking.name) {
      return new Response(JSON.stringify({ error: "No booking data found in webhook payload." }), {
        headers: { "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Only send notification if deposit/payment is paid OR if it's a specific bypassed booking
    if (!booking.deposit_paid) {
      console.log("Payment not made yet, skipping email notification.");
      return new Response(JSON.stringify({ message: "Payment not made yet, skipping email." }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Prevent duplicate emails on subsequent updates if deposit/payment was already paid
    if (payload.old_record && payload.old_record.deposit_paid) {
      console.log("Payment was already made previously, skipping email to prevent duplicates.");
      return new Response(JSON.stringify({ message: "Already paid previously, skipping." }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Prepare the actual date formatting - fallback to start_datetime if available, otherwise use date/time fields directly
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

    // Make the IG link clean - remove @ if they added it
    const cleanIG = (booking.instagram || "").replace('@', '');
    const igLink = `https://instagram.com/${cleanIG}`;

    // Make the phone link clean for tel:
    const cleanPhone = (booking.phone || "").replace(/[^0-9+]/g, '');

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; max-width: 600px; margin: 0 auto; padding: 20px; color: #111111;">
        
        <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 24px;">Alright Wog, you've got a new booking! &nbsp;🎉</h2>
        
        <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
          Someone's just locked in a slot and paid. Here are the full details below so you can hit them up straight away.
        </p>

        <div style="background-color: #f4f4f4; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <ul style="list-style: none; padding: 0; margin: 0; font-size: 15px; line-height: 1.8;">
            <li><strong>Customer:</strong> ${booking.name}</li>
            <li><strong>Instagram:</strong> @${cleanIG}</li>
            <li><strong>Phone:</strong> ${booking.phone}</li>
            <li style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e0e0e0;"><strong>Date:</strong> ${dateFormatted}</li>
            <li><strong>Time:</strong> ${timeFormatted}</li>
            <li><strong>Deposit Paid:</strong> £${Number(booking.deposit_amount).toFixed(2)}</li>
            <li><strong>Balance Due:</strong> £${(Number(booking.total_price) - Number(booking.deposit_amount)).toFixed(2)}</li>
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

    const wogData = await resend.emails.send({
      from: "LocsByWog Bookings <bookings@blocq.co.uk>",
      to: ["locksbywog2110@gmail.com"],
      subject: `🚨 NEW BOOKING 🚨: ${booking.name} on ${dateFormatted} at ${timeFormatted}`,
      html: emailHtml,
    });

    // --- SEND EMAIL TO CUSTOMER ---
    const remainingBalance = booking.total_price - booking.deposit_amount;

    const customerEmailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; max-width: 600px; margin: 0 auto; padding: 20px; color: #111111;">
        
        <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 24px;">Your booking is confirmed! &nbsp;🎉</h2>
        
          Hey ${booking.name},<br/><br/>
          Your payment has been successfully processed, and your slot is officially locked in.
        </p>

        <div style="background-color: #f4f4f4; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <h3 style="margin-top:0; margin-bottom: 15px;">Your Booking Details:</h3>
          <ul style="list-style: none; padding: 0; margin: 0; font-size: 15px; line-height: 1.8;">
            <li><strong>Date:</strong> ${dateFormatted}</li>
            <li><strong>Time:</strong> ${timeFormatted}</li>
            <li><strong>Location:</strong> Salford, Manchester (M6 6DQ)</li>
            <li style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e0e0e0;"><strong>Total Price:</strong> £${Number(booking.total_price).toFixed(2)}</li>
            <li><strong>Deposit Paid:</strong> £${Number(booking.deposit_amount).toFixed(2)}</li>
            <li style="font-size: 16px; margin-top: 5px; color: #0B6B4F;"><strong>Remaining Balance:</strong> £${(Number(booking.total_price) - Number(booking.deposit_amount)).toFixed(2)}</li>
          </ul>
          <p style="font-size: 12px; color: #666; margin-top: 15px; font-style: italic;">
            * Remaining balance is to be paid on the day of your appointment.
          </p>
        </div>
        
        </div>

        <p style="font-size: 14px; line-height: 1.5; margin-bottom: 30px;">
          I'll be in touch with you directly on Instagram (@${cleanIG}) or via text to confirm the exact address before your appointment.
        </p>
        
        <p style="font-size: 15px; font-weight: bold;">
          See you soon,<br/>
          Locs By Wog
        </p>
      </div>
    `;

    const customerData = await resend.emails.send({
      from: "LocsByWog <bookings@blocq.co.uk>",
      to: [booking.email],
      subject: `Booking Confirmed - Locs By Wog`,
      html: customerEmailHtml,
    });

    return new Response(JSON.stringify({ success: true, wogData, customerData }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error sending email webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
