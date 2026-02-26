-- ============================================
-- REFERRAL SYSTEM SETUP FOR LOCKSBYWOG
-- ============================================

-- 1. Raise all service prices by £10 to account for the referral discount
UPDATE services SET base_price = base_price + 10 WHERE is_active = true;

-- 2. Create the referral_codes table
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  -- The booking that generated this code (the referrer)
  source_booking_id UUID REFERENCES bookings(id),
  -- Name of the person who owns this code
  owner_name TEXT NOT NULL,
  owner_email TEXT,
  owner_instagram TEXT,
  -- How many times this code has been used
  times_used INTEGER DEFAULT 0,
  -- Max times this code can be used (0 = unlimited)
  max_uses INTEGER DEFAULT 0,
  -- Whether this code is still active
  is_active BOOLEAN DEFAULT true,
  -- Discount amount in pounds
  discount_amount DECIMAL(10, 2) DEFAULT 10.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Add referral tracking columns to the bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS referral_code_used TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS referred_by_code_id UUID REFERENCES referral_codes(id);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS referral_code_generated TEXT;

-- 4. Enable RLS
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;

-- Allow public to read referral codes (to validate them)
CREATE POLICY "Public can validate referral codes"
ON referral_codes FOR SELECT
USING (true);

-- Allow public to update referral codes (increment times_used)
CREATE POLICY "Public can update referral codes"
ON referral_codes FOR UPDATE
USING (true)
WITH CHECK (true);

-- Allow public to insert referral codes (generated after booking)
CREATE POLICY "Public can create referral codes"
ON referral_codes FOR INSERT
WITH CHECK (true);

-- 5. Create a function to validate and apply a referral code
CREATE OR REPLACE FUNCTION validate_referral_code(code_input TEXT)
RETURNS TABLE(
  is_valid BOOLEAN,
  discount DECIMAL(10, 2),
  owner TEXT,
  code_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      WHEN rc.id IS NULL THEN false
      WHEN rc.is_active = false THEN false
      WHEN rc.max_uses > 0 AND rc.times_used >= rc.max_uses THEN false
      ELSE true
    END as is_valid,
    COALESCE(rc.discount_amount, 0) as discount,
    COALESCE(rc.owner_name, '') as owner,
    rc.id as code_id
  FROM referral_codes rc
  WHERE UPPER(rc.code) = UPPER(code_input)
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 6. Create a function to generate a unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code(p_booking_id UUID, p_name TEXT, p_email TEXT, p_instagram TEXT)
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  -- Generate a code based on the name: first 3 letters + random 4 digits
  LOOP
    new_code := UPPER(LEFT(REGEXP_REPLACE(p_name, '[^a-zA-Z]', '', 'g'), 3)) || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    SELECT EXISTS(SELECT 1 FROM referral_codes WHERE code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;

  -- Insert the new code
  INSERT INTO referral_codes (code, source_booking_id, owner_name, owner_email, owner_instagram)
  VALUES (new_code, p_booking_id, p_name, p_email, p_instagram);

  -- Update the booking with the generated code
  UPDATE bookings SET referral_code_generated = new_code WHERE id = p_booking_id;

  RETURN new_code;
END;
$$ LANGUAGE plpgsql;
