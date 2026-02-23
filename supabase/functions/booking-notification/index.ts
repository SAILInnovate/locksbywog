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

        // Prepare the actual date formatting - fallback to start_datetime if available, otherwise use date/time fields directly
        let dateStr = booking.date || booking.start_datetime;
        let timeStr = booking.time;
        let dateFormatted = dateStr;
        let timeFormatted = timeStr;

        if (dateStr) {
            try {
                const d = new Date(dateStr);
                if (!isNaN(d.getTime())) {
                    dateFormatted = d.toLocaleDateString('en-GB', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                    });
                }
            } catch (e) { }
        }

        if (booking.start_datetime && !timeStr) {
            try {
                timeFormatted = new Date(booking.start_datetime).toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } catch (e) { }
        }

        // Make the IG link clean - remove @ if they added it
        const cleanIG = booking.instagram.replace('@', '');
        const igLink = `https://instagram.com/${cleanIG}`;

        // Make the phone link clean for tel:
        const cleanPhone = booking.phone.replace(/[^0-9+]/g, '');

        const emailHtml = `
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

        const data = await resend.emails.send({
            from: "LocksByWog System <bookings@your-verified-domain.com>", // Replace with your verified Resend domain
            to: ["lovelymorales2110@gmail.com"],
            subject: `New Booking! ${booking.name} - ${dateFormatted} at ${timeFormatted}`,
            html: emailHtml,
        });

        return new Response(JSON.stringify({ success: true, data }), {
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
