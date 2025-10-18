-- Debug script for clicks table issues
-- Run this to check the current state of the clicks table

-- 1. Check if geolocation columns exist
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'clicks'
ORDER BY ordinal_position;

-- 2. Check recent clicks data
SELECT
    id,
    clicked_at,
    clicked_at AT TIME ZONE 'UTC' as clicked_at_utc,
    NOW() as current_time,
    NOW() AT TIME ZONE 'UTC' as current_time_utc,
    city,
    region,
    country_name,
    country_code,
    device_type,
    browser
FROM clicks
ORDER BY clicked_at DESC
LIMIT 10;

-- 3. Check if any clicks have geolocation data
SELECT
    COUNT(*) as total_clicks,
    COUNT(city) as clicks_with_city,
    COUNT(region) as clicks_with_region,
    COUNT(country_name) as clicks_with_country_name,
    COUNT(country_code) as clicks_with_country_code
FROM clicks;

-- 4. Check database timezone settings
SHOW timezone;
