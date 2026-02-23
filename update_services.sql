-- 1. Update prices & names for existing ones
UPDATE services SET base_price = 35.00, name = 'Retwists' WHERE name IN ('Locs & Retwists', 'Retwists');
UPDATE services SET base_price = 40.00 WHERE name = 'Cornrows';
UPDATE services SET base_price = 25.00 WHERE name = 'Kids'' Styles';

-- 2. Hide services you are removing
UPDATE services SET is_active = false WHERE name IN ('Knotless Braids', 'Box Braids');

-- 3. Insert the new services
INSERT INTO services (name, description, base_price, deposit_required, duration_minutes)
SELECT 'Retwist two strands', 'Double the twist for a chunky, defined look.', 35.00, 10.00, 180
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Retwist two strands');

INSERT INTO services (name, description, base_price, deposit_required, duration_minutes)
SELECT 'Half barrel two strands', 'A hybrid style giving you the best of both worlds.', 40.00, 10.00, 180
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Half barrel two strands');

INSERT INTO services (name, description, base_price, deposit_required, duration_minutes)
SELECT '6+ Barrel twists', 'Intricate barrel twists for a statement protective style.', 40.00, 10.00, 210
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = '6+ Barrel twists');

INSERT INTO services (name, description, base_price, deposit_required, duration_minutes)
SELECT '2-4 barrel twists', 'Thick, bold barrel twists perfect for a durable style.', 35.00, 10.00, 150
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = '2-4 barrel twists');
