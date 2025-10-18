-- Verify View Count Testing
-- Run this script to check your link counts

-- Show all links with their view counts
SELECT
    short_code,
    title,
    current_views,
    total_clicks,
    is_active,
    created_at
FROM links
ORDER BY created_at DESC
LIMIT 10;

-- To reset a specific link for testing (replace 'YOUR_SHORT_CODE'):
-- UPDATE links SET current_views = 0, total_clicks = 0 WHERE short_code = 'YOUR_SHORT_CODE';

-- To watch live updates (run this and then click your link):
-- \watch 1
-- SELECT short_code, current_views, total_clicks FROM links WHERE short_code = 'YOUR_SHORT_CODE';
-- Press Ctrl+C to stop watching
