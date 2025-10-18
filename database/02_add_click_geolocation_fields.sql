-- Migration: Add geolocation fields to clicks table
-- Date: 2025-10-18
-- Description: Adds country_name, city, and region fields to clicks table for detailed geolocation tracking

-- Add new columns to clicks table
ALTER TABLE clicks ADD COLUMN IF NOT EXISTS country_name VARCHAR(100);
ALTER TABLE clicks ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE clicks ADD COLUMN IF NOT EXISTS region VARCHAR(100);

-- Add indexes for common geolocation queries
CREATE INDEX IF NOT EXISTS idx_clicks_city ON clicks(city) WHERE city IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clicks_region ON clicks(region) WHERE region IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clicks_country_name ON clicks(country_name) WHERE country_name IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN clicks.country_name IS 'Full country name from GeoIP lookup';
COMMENT ON COLUMN clicks.city IS 'City name from GeoIP lookup';
COMMENT ON COLUMN clicks.region IS 'State/Province/Region from GeoIP lookup';
