-- This script updates your existing database to match your new prices
-- and hides the services you no longer want to offer.
-- Please copy this entire script and run it in your Supabase SQL Editor.

-- 1. Update prices for continuing services
UPDATE services 
SET base_price = 35.00 
WHERE name = 'Locs & Retwists';

UPDATE services 
SET base_price = 40.00 
WHERE name = 'Cornrows';

UPDATE services 
SET base_price = 25.00 
WHERE name = 'Kids'' Styles';

-- 2. Hide services you are removing (Instead of deleting them, which would break past bookings)
UPDATE services 
SET is_active = false 
WHERE name IN ('Knotless Braids', 'Box Braids');
