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

    // --- EMAIL LOGIC MOVED TO STRIPE WEBHOOK ---
    // Both stylist and customer emails are now handled directly by the stripe-webhook function
    // to ensure reliability and avoid duplicate notifications.

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Email logic moved to stripe-webhook. This function is now a placeholder." 
    }), {
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
