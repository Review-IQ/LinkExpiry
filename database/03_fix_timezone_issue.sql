-- Migration: Fix timezone handling in timestamps
-- Date: 2025-10-18
-- Description: Convert TIMESTAMP to TIMESTAMPTZ (timestamp with timezone) for proper UTC handling

-- Fix clicks table - Convert clicked_at to timestamptz
ALTER TABLE clicks
ALTER COLUMN clicked_at TYPE TIMESTAMPTZ
USING clicked_at AT TIME ZONE 'UTC';

-- Set default to use UTC explicitly
ALTER TABLE clicks
ALTER COLUMN clicked_at SET DEFAULT (NOW() AT TIME ZONE 'UTC');

-- Fix links table timestamps as well
ALTER TABLE links
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'UTC';

ALTER TABLE links
ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE 'UTC');

ALTER TABLE links
ALTER COLUMN expires_at TYPE TIMESTAMPTZ
USING expires_at AT TIME ZONE 'UTC';

-- Fix users table timestamps
ALTER TABLE users
ALTER COLUMN created_at TYPE TIMESTAMPTZ
USING created_at AT TIME ZONE 'UTC';

ALTER TABLE users
ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE 'UTC');

ALTER TABLE users
ALTER COLUMN updated_at TYPE TIMESTAMPTZ
USING updated_at AT TIME ZONE 'UTC';

ALTER TABLE users
ALTER COLUMN updated_at SET DEFAULT (NOW() AT TIME ZONE 'UTC');

-- Verify the changes
SELECT
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name IN ('clicks', 'links', 'users')
AND column_name LIKE '%_at'
ORDER BY table_name, ordinal_position;
