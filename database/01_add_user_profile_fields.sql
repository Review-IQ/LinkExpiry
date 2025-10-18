-- Migration: Add user profile fields (First Name, Last Name, Phone)
-- Date: 2025-01-18
-- Description: Adds first_name, last_name, and phone fields to users table

-- Add new columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Make fields required for new users (existing users will need to update their profiles)
-- Note: We don't add NOT NULL constraint immediately to avoid breaking existing users
-- ALTER TABLE users ALTER COLUMN first_name SET NOT NULL;
-- ALTER TABLE users ALTER COLUMN last_name SET NOT NULL;
-- ALTER TABLE users ALTER COLUMN phone SET NOT NULL;

-- Add validation constraints
ALTER TABLE users ADD CONSTRAINT valid_first_name CHECK (first_name ~ '^[a-zA-Z\s\-'']+$');
ALTER TABLE users ADD CONSTRAINT valid_last_name CHECK (last_name ~ '^[a-zA-Z\s\-'']+$');
ALTER TABLE users ADD CONSTRAINT valid_phone CHECK (phone ~ '^\+?[\d\s\-\(\)]{10,20}$');

-- Add comments for documentation
COMMENT ON COLUMN users.first_name IS 'User first name (2-100 characters, letters only)';
COMMENT ON COLUMN users.last_name IS 'User last name (2-100 characters, letters only)';
COMMENT ON COLUMN users.phone IS 'User phone number with optional country code (10-20 digits)';

-- Create index for phone lookups (optional, for future features like 2FA)
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
