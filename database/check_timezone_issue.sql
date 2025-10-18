-- Check timezone settings and click timestamps
-- Run this to diagnose the datetime issue

-- 1. Check PostgreSQL timezone setting
SHOW timezone;

-- 2. Check current time in different formats
SELECT
    NOW() as server_time,
    NOW() AT TIME ZONE 'UTC' as server_time_utc,
    CURRENT_TIMESTAMP as current_timestamp,
    TIMEZONE('UTC', NOW()) as utc_time;

-- 3. Check clicks table column type
SELECT
    column_name,
    data_type,
    datetime_precision
FROM information_schema.columns
WHERE table_name = 'clicks'
AND column_name = 'clicked_at';

-- 4. Sample recent clicks with timezone info
SELECT
    id,
    clicked_at,
    clicked_at AT TIME ZONE 'UTC' as clicked_at_utc,
    NOW() - clicked_at as time_ago,
    city,
    region,
    country_name
FROM clicks
ORDER BY clicked_at DESC
LIMIT 5;
