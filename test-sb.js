import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabase = createClient(
  "https://dbjgmnaguvmgxkrikcww.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiamdtbmFndXZtZ3hrcmlrY3d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3OTk5MDgsImV4cCI6MjA4NzM3NTkwOH0.-CK4Hwl5PBhbZ5gpnfWEuZ_DFj3BtK4nz3Z_aQKUEw0"
);

async function run() {
  const { data: services } = await supabase.from('services').select('*').limit(1);
  console.log("Services:", services);

  if (services && services.length > 0) {
    console.log("Attempting insert...");
    const { data, error } = await supabase.from('bookings').insert([{
      service_id: services[0].id,
      name: "Test",
      email: "test@test.com",
      instagram: "@test",
      phone: "123",
      start_datetime: new Date().toISOString(),
      end_datetime: new Date().toISOString(),
      deposit_paid: true,
      deposit_amount: 10,
      total_price: 50,
      notes: "test",
      status: "pending"
    }]); // Try without .select()
    console.log("Insert result:", { data, error });
  }
}
run();
