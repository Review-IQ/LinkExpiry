-- LinkExpiry Database Schema
-- PostgreSQL Database for LinkExpiry SaaS Platform
-- This script creates the initial database schema with all required tables and indexes

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    plan_type VARCHAR(20) DEFAULT 'FREE' CHECK (plan_type IN ('FREE', 'STARTER', 'PRO', 'ENTERPRISE')),
    subscription_status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (subscription_status IN ('ACTIVE', 'CANCELLED', 'EXPIRED', 'TRIAL')),
    stripe_customer_id VARCHAR(255),
    links_created_this_month INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- ============================================
-- LINKS TABLE
-- ============================================
CREATE TABLE links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    short_code VARCHAR(10) UNIQUE NOT NULL,
    original_url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    max_views INT,
    current_views INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    expiry_type VARCHAR(10) NOT NULL CHECK (expiry_type IN ('TIME', 'VIEWS', 'BOTH', 'NONE')),
    password_hash VARCHAR(255),
    custom_message TEXT,
    title VARCHAR(255),
    total_clicks INT DEFAULT 0,
    CONSTRAINT valid_short_code CHECK (short_code ~* '^[A-Za-z0-9]{7,10}$'),
    CONSTRAINT valid_expiry_type CHECK (
        (expiry_type = 'TIME' AND expires_at IS NOT NULL) OR
        (expiry_type = 'VIEWS' AND max_views IS NOT NULL) OR
        (expiry_type = 'BOTH' AND expires_at IS NOT NULL AND max_views IS NOT NULL) OR
        (expiry_type = 'NONE')
    )
);

-- ============================================
-- CLICKS TABLE
-- ============================================
CREATE TABLE clicks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    link_id UUID REFERENCES links(id) ON DELETE CASCADE,
    clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_hash VARCHAR(64),
    user_agent TEXT,
    referrer TEXT,
    country_code VARCHAR(2),
    device_type VARCHAR(20) CHECK (device_type IN ('MOBILE', 'TABLET', 'DESKTOP', 'OTHER')),
    browser VARCHAR(50)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Critical index for redirect endpoint (most important query)
CREATE INDEX idx_links_short_code ON links(short_code) WHERE is_active = TRUE;

-- User's links queries
CREATE INDEX idx_links_user_id ON links(user_id);

-- Expiry checker background service
CREATE INDEX idx_links_expires_at ON links(expires_at) WHERE is_active = TRUE;
CREATE INDEX idx_links_max_views ON links(current_views, max_views) WHERE is_active = TRUE;

-- Analytics queries
CREATE INDEX idx_clicks_link_id ON clicks(link_id);
CREATE INDEX idx_clicks_clicked_at ON clicks(clicked_at);

-- Composite index for expiry checking
CREATE INDEX idx_links_active_expiry ON links(is_active, expires_at, current_views, max_views);

-- ============================================
-- FUNCTIONS FOR ATOMIC OPERATIONS
-- ============================================

-- Atomic function to increment view count and check expiry
-- Returns: TRUE if link is still active, FALSE if it expired
CREATE OR REPLACE FUNCTION increment_link_view(p_short_code VARCHAR)
RETURNS TABLE(
    is_valid BOOLEAN,
    original_url TEXT,
    requires_password BOOLEAN,
    custom_message TEXT
) AS $$
DECLARE
    v_link_id UUID;
    v_current_views INT;
    v_max_views INT;
    v_expires_at TIMESTAMP;
    v_is_active BOOLEAN;
    v_original_url TEXT;
    v_password_hash VARCHAR(255);
    v_custom_message TEXT;
    v_expiry_type VARCHAR(10);
BEGIN
    -- Lock the row for update
    SELECT
        l.id,
        l.current_views,
        l.max_views,
        l.expires_at,
        l.is_active,
        l.original_url,
        l.password_hash,
        l.custom_message,
        l.expiry_type
    INTO
        v_link_id,
        v_current_views,
        v_max_views,
        v_expires_at,
        v_is_active,
        v_original_url,
        v_password_hash,
        v_custom_message,
        v_expiry_type
    FROM links l
    WHERE l.short_code = p_short_code
    FOR UPDATE;

    -- Link not found
    IF v_link_id IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::TEXT, FALSE, NULL::TEXT;
        RETURN;
    END IF;

    -- Link already inactive
    IF NOT v_is_active THEN
        RETURN QUERY SELECT FALSE, v_original_url, FALSE, v_custom_message;
        RETURN;
    END IF;

    -- Check time-based expiry
    IF v_expiry_type IN ('TIME', 'BOTH') AND v_expires_at < NOW() THEN
        UPDATE links SET is_active = FALSE WHERE id = v_link_id;
        RETURN QUERY SELECT FALSE, v_original_url, FALSE, v_custom_message;
        RETURN;
    END IF;

    -- Check view-based expiry (before incrementing)
    IF v_expiry_type IN ('VIEWS', 'BOTH') AND v_current_views >= v_max_views THEN
        UPDATE links SET is_active = FALSE WHERE id = v_link_id;
        RETURN QUERY SELECT FALSE, v_original_url, FALSE, v_custom_message;
        RETURN;
    END IF;

    -- Increment view count and total clicks atomically
    UPDATE links
    SET
        current_views = current_views + 1,
        total_clicks = total_clicks + 1
    WHERE id = v_link_id;

    -- Check if this increment caused expiry
    IF v_expiry_type IN ('VIEWS', 'BOTH') AND (v_current_views + 1) >= v_max_views THEN
        UPDATE links SET is_active = FALSE WHERE id = v_link_id;
    END IF;

    -- Return success with link details
    RETURN QUERY SELECT
        TRUE,
        v_original_url,
        (v_password_hash IS NOT NULL),
        v_custom_message;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION TO RESET MONTHLY LINK COUNTS
-- ============================================
CREATE OR REPLACE FUNCTION reset_monthly_link_counts()
RETURNS void AS $$
BEGIN
    UPDATE users SET links_created_this_month = 0;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION TO FIND EXPIRED LINKS
-- ============================================
CREATE OR REPLACE FUNCTION find_expired_links()
RETURNS TABLE(link_id UUID, user_id UUID, short_code VARCHAR, title VARCHAR) AS $$
BEGIN
    RETURN QUERY
    UPDATE links l
    SET is_active = FALSE
    WHERE l.is_active = TRUE
    AND (
        (l.expiry_type IN ('TIME', 'BOTH') AND l.expires_at < NOW())
        OR
        (l.expiry_type IN ('VIEWS', 'BOTH') AND l.current_views >= l.max_views)
    )
    RETURNING l.id, l.user_id, l.short_code, l.title;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER TO UPDATE updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA FOR TESTING (Optional)
-- ============================================

-- Create a test user (password: Test123!)
-- Password hash generated with BCrypt
INSERT INTO users (email, password_hash, plan_type) VALUES
('test@linkexpiry.com', '$2a$11$YourBCryptHashHere', 'FREE');

-- ============================================
-- USEFUL QUERIES FOR MONITORING
-- ============================================

-- View active links count by user
-- SELECT u.email, COUNT(l.id) as active_links
-- FROM users u
-- LEFT JOIN links l ON u.id = l.user_id AND l.is_active = TRUE
-- GROUP BY u.id, u.email;

-- View links expiring soon (next 24 hours)
-- SELECT short_code, title, expires_at
-- FROM links
-- WHERE is_active = TRUE
-- AND expiry_type IN ('TIME', 'BOTH')
-- AND expires_at < NOW() + INTERVAL '24 hours'
-- ORDER BY expires_at;

-- View most clicked links
-- SELECT l.short_code, l.title, l.total_clicks
-- FROM links l
-- ORDER BY l.total_clicks DESC
-- LIMIT 10;
