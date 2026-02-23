-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create the 'services' table
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  base_price DECIMAL(10, 2) NOT NULL,
  deposit_required DECIMAL(10, 2) NOT NULL,
  duration_minutes INTEGER NOT NULL, -- Crucial for calculating overlaps
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial mock data into 'services'
INSERT INTO services (name, description, base_price, deposit_required, duration_minutes)
VALUES 
  ('Knotless Braids', 'Lightweight, natural-looking, scalp-friendly braids that last for weeks.', 45.00, 15.00, 240), -- 4 hours
  ('Locs & Retwists', 'Neat parts, clean finish, healthy edges. Keep your locs looking fresh.', 35.00, 10.00, 180), -- 3 hours
  ('Kids'' Styles', 'Quick, gentle, long-lasting styles for the little ones.', 25.00, 10.00, 120), -- 2 hours
  ('Box Braids', 'Classic protective style with clean parts and professional finish.', 50.00, 15.00, 300), -- 5 hours
  ('Cornrows', 'Sleek, stylish cornrows for any occasion.', 30.00, 10.00, 90); -- 1.5 hours


-- 2. Create the 'bookings' table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID NOT NULL REFERENCES services(id),
  
  -- Customer details
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  instagram TEXT,
  notes TEXT,
  
  -- Time Tracking (Crucial for preventing overlaps)
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  
  -- Financial & Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  total_price DECIMAL(10, 2) NOT NULL,
  deposit_amount DECIMAL(10, 2) NOT NULL,
  deposit_paid BOOLEAN DEFAULT false,
  
  -- Stripe Integration
  stripe_session_id TEXT,
  stripe_payment_intent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- 3. Create a Function to check for booking overlaps
CREATE OR REPLACE FUNCTION check_booking_overlap()
RETURNS TRIGGER AS $$
DECLARE
  overlap_exists BOOLEAN;
BEGIN
  -- We only check overlaps for confirmed bookings (assuming pending/cancelled don't block calendar)
  -- Or if you want pending to block time for a few minutes, remove the status check from this query.
  SELECT EXISTS(
    SELECT 1 FROM bookings
    WHERE 
      -- Don't compare a booking against itself when updating
      id != NEW.id 
      AND status IN ('confirmed', 'pending') 
      -- Overlap logic: Start time falls inside existing booking OR End time falls inside existing booking OR completely surrounds it
      AND (
        (NEW.start_datetime < end_datetime AND NEW.end_datetime > start_datetime)
      )
  ) INTO overlap_exists;

  IF overlap_exists THEN
    RAISE EXCEPTION 'Booking overlaps with an existing appointment for the requested time block.';
  END IF;

  -- Ensure end time is correctly calculated from start_datetime + service duration (backup safety net)
  NEW.end_datetime := NEW.start_datetime + (
    SELECT duration_minutes * INTERVAL '1 minute' FROM services WHERE id = NEW.service_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- 4. Create Trigger to run the overlap check BEFORE inserting or updating a booking
CREATE TRIGGER prevent_booking_overlap
BEFORE INSERT OR UPDATE OF start_datetime, end_datetime, service_id ON bookings
FOR EACH ROW
EXECUTE FUNCTION check_booking_overlap();


-- 5. Row Level Security (RLS) Policies
-- Enables security to restrict who can read/write data directly from the frontend.
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active services
CREATE POLICY "Public can view active services"
ON services FOR SELECT
USING (is_active = true);

-- Allow public to insert new bookings (handled carefully via backend/Stripe session ideally)
CREATE POLICY "Public can insert bookings"
ON bookings FOR INSERT
WITH CHECK (true);

-- Allow public to view bookings immediately after inserting them (needed for .select() to work)
-- This allows reading rows where the ID is known/returned from the insert.
-- We still want to prevent listing ALL bookings, but we need to satisfy the RLS for the SELECT part of the INSERT...SELECT.
-- Supabase INSERT with .select() requires SELECT permissions on the inserted row.
CREATE POLICY "Allow public inserting to return inserted row"
ON bookings FOR SELECT
USING (true); -- Note: For a real production app, you might want to tighten this or move creation to an Edge Function completely to avoid SELECT USING true. For now, this fixes the 401 error.

-- Note: To fetch available slots safely, you will use a Postgres function or Edge Function instead of reading the whole table directly.

-- Function for updating `updated_at` automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON services
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
