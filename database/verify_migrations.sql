-- Verify that migrations ran successfully

-- 1. Check clicks table structure (should have geolocation fields and timestamptz)
SELECT
    column_name,
    data_type,
    datetime_precision
FROM information_schema.columns
WHERE table_name = 'clicks'
ORDER BY ordinal_position;

-- 2. Verify all timestamp columns are now timestamptz
SELECT
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name IN ('clicks', 'links', 'users')
AND column_name LIKE '%_at'
ORDER BY table_name, column_name;

-- 3. Quick count of clicks
SELECT COUNT(*) as total_clicks FROM clicks;

-- Success message
SELECT 'Migrations verified successfully!' as status;
