-- Migration: Add custom expiry pages feature
-- Date: 2025-10-18
-- Description: Allows users to create custom branded pages shown when links expire

-- Create expiry_pages table for reusable custom expiry page templates
CREATE TABLE IF NOT EXISTS expiry_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(100) NOT NULL, -- Template name for user's reference

    -- Page content
    title VARCHAR(200) NOT NULL,
    message TEXT,
    logo_url VARCHAR(500),
    background_color VARCHAR(50) DEFAULT '#f3f4f6', -- Hex color or gradient

    -- Call to action
    cta_button_text VARCHAR(50),
    cta_button_url VARCHAR(500),
    cta_button_color VARCHAR(50) DEFAULT '#4f46e5',

    -- Social media links (optional)
    social_facebook VARCHAR(255),
    social_twitter VARCHAR(255),
    social_instagram VARCHAR(255),
    social_linkedin VARCHAR(255),
    social_website VARCHAR(255),

    -- Advanced customization
    custom_css TEXT,
    enable_email_capture BOOLEAN DEFAULT FALSE,
    email_capture_text VARCHAR(200),

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'UTC'),
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'UTC'),

    CONSTRAINT valid_background_color CHECK (background_color ~* '^#[0-9A-Fa-f]{6}$|^linear-gradient|^radial-gradient'),
    CONSTRAINT valid_cta_button_color CHECK (cta_button_color ~* '^#[0-9A-Fa-f]{6}$')
);

-- Add foreign key to links table for custom expiry page
ALTER TABLE links ADD COLUMN IF NOT EXISTS expiry_page_id UUID REFERENCES expiry_pages(id) ON DELETE SET NULL;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_expiry_pages_user_id ON expiry_pages(user_id);
CREATE INDEX IF NOT EXISTS idx_links_expiry_page_id ON links(expiry_page_id) WHERE expiry_page_id IS NOT NULL;

-- Create table for email captures (if user enables email capture)
CREATE TABLE IF NOT EXISTS expiry_page_emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expiry_page_id UUID REFERENCES expiry_pages(id) ON DELETE CASCADE NOT NULL,
    link_id UUID REFERENCES links(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL,
    captured_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'UTC'),
    ip_hash VARCHAR(64),
    user_agent TEXT,

    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Indexes for email captures
CREATE INDEX IF NOT EXISTS idx_expiry_page_emails_expiry_page_id ON expiry_page_emails(expiry_page_id);
CREATE INDEX IF NOT EXISTS idx_expiry_page_emails_link_id ON expiry_page_emails(link_id) WHERE link_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_expiry_page_emails_captured_at ON expiry_page_emails(captured_at);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_expiry_pages_updated_at
    BEFORE UPDATE ON expiry_pages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE expiry_pages IS 'Custom branded pages shown when links expire';
COMMENT ON TABLE expiry_page_emails IS 'Email addresses captured from expired link visitors';
COMMENT ON COLUMN expiry_pages.name IS 'Template name for user reference (e.g., "Summer Campaign", "Default Brand")';
COMMENT ON COLUMN expiry_pages.enable_email_capture IS 'Show email capture form on expiry page';
COMMENT ON COLUMN links.expiry_page_id IS 'Custom expiry page to show when this link expires (NULL = default message)';
