# Link Redirect Issue - Guide

## Problem

When visiting `https://localhost:34049/Pzc5Glu`, it's redirecting to a backend link instead of the final destination URL.

## Possible Causes

### Cause 1: Visiting Backend URL Directly (MOST COMMON)

**Problem**: You're testing via `https://localhost:34049/Pzc5Glu`

**Issue**: When you visit the backend directly, you see the "raw" redirect response. Depending on your browser and network tools, this might look like it's "stuck" at the backend URL.

**Solution**: Visit `http://localhost:5173/Pzc5Glu` instead!

### Cause 2: Original URL is Another Short Link

**Problem**: The `original_url` stored in the database is itself another short link.

For example:
```sql
original_url = 'https://localhost:34049/abc123'
```

This would cause a chain of redirects.

**Solution**: Check what's stored in the database:

```bash
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d linkexpiry_dev

SELECT short_code, original_url
FROM links
WHERE short_code = 'Pzc5Glu';
```

Expected: `original_url` should be a final destination like `https://google.com`, NOT another short link.

### Cause 3: Browser Not Following Redirects

**Problem**: Your browser or testing tool isn't automatically following the 302 redirect.

**Solution**:
- Check browser console for redirect messages
- Use a different browser
- Test with curl to see the actual redirect:

```bash
curl -L -v https://localhost:34049/Pzc5Glu -k
```

The `-L` flag tells curl to follow redirects.

### Cause 4: Malformed Original URL

**Problem**: The original URL is malformed or missing the protocol.

For example:
```
original_url = 'google.com'  (missing https://)
```

**Solution**: Check and fix in database:

```sql
UPDATE links
SET original_url = 'https://google.com'
WHERE short_code = 'Pzc5Glu';
```

## Debugging Steps

### Step 1: Check Database

```bash
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d linkexpiry_dev
```

```sql
SELECT
    short_code,
    original_url,
    is_active,
    password_hash IS NOT NULL as has_password
FROM links
WHERE short_code = 'Pzc5Glu';
```

Check:
- Is `original_url` a valid URL?
- Does it start with `http://` or `https://`?
- Is it another short link URL?
- Is `is_active` true?

### Step 2: Check Backend Logs

When you visit the link, check the backend terminal for:

```
dbug: LinkExpiry.API.Controllers.RedirectController[0]
      Redirecting Pzc5Glu to https://google.com
```

This shows what URL the backend is trying to redirect to.

### Step 3: Test with curl

```bash
# Follow redirects and show headers
curl -L -v https://localhost:34049/Pzc5Glu -k
```

Look for:
```
< HTTP/1.1 302 Found
< Location: https://google.com
```

This shows the redirect is working.

### Step 4: Test via Frontend

Visit: `http://localhost:5173/Pzc5Glu`

This should:
1. Show loading screen
2. Redirect to final destination

## Common Scenarios

### Scenario 1: Direct Backend Access

```
User visits: https://localhost:34049/Pzc5Glu
Browser shows: https://localhost:34049/Pzc5Glu (in network tools)
Final destination: https://google.com
```

**What's happening**: Browser IS following the redirect, but network tools show the initial request URL.

**Solution**: Check if you actually ended up at Google. If not, there's a real issue.

### Scenario 2: Recursive Short Link

```
Link Pzc5Glu points to: https://localhost:34049/abc123
Link abc123 points to: https://google.com
```

**What's happening**: Multiple redirects in a chain.

**Solution**: Fix the original_url to point directly to the final destination:

```sql
UPDATE links
SET original_url = 'https://google.com'
WHERE short_code = 'Pzc5Glu';
```

### Scenario 3: Password-Protected Link

```
Link Pzc5Glu is password-protected
User visits backend directly: https://localhost:34049/Pzc5Glu
Backend returns: 401 JSON error
```

**What's happening**: Backend returns JSON, not a user-friendly password form.

**Solution**: Visit frontend URL: `http://localhost:5173/Pzc5Glu`

## Expected Redirect Flow

### Normal Link (No Password):

```
User visits: http://localhost:5173/Pzc5Glu
  ↓
Frontend: HEAD request to backend
  ↓
Backend: 200 OK (link is valid)
  ↓
Frontend: window.location.href to backend GET endpoint
  ↓
Backend: Increments view count, returns 302 redirect
  ↓
Browser: Follows redirect to https://google.com
```

### Password-Protected Link:

```
User visits: http://localhost:5173/Pzc5Glu
  ↓
Frontend: HEAD request to backend
  ↓
Backend: 401 (password required)
  ↓
Frontend: Shows password form
  ↓
User enters password
  ↓
Frontend: POST to /password endpoint
  ↓
Backend: Verifies, stores in session, redirects
  ↓
Browser: Ends up at https://google.com
```

## How to Fix

### If original_url is wrong:

```sql
UPDATE links
SET original_url = 'https://google.com'  -- Your desired destination
WHERE short_code = 'Pzc5Glu';
```

### If link is inactive:

```sql
UPDATE links
SET is_active = true
WHERE short_code = 'Pzc5Glu';
```

### If you want to test properly:

1. Visit `http://localhost:5173/Pzc5Glu` (frontend URL)
2. NOT `https://localhost:34049/Pzc5Glu` (backend URL)

## Verification

After fixing, test:

```bash
# Check what's in database
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d linkexpiry_dev -c "SELECT short_code, original_url FROM links WHERE short_code = 'Pzc5Glu';"

# Test redirect with curl
curl -L -v https://localhost:34049/Pzc5Glu -k

# Test via frontend
# Visit: http://localhost:5173/Pzc5Glu in browser
```

---

**Most Common Solution**: Just visit `http://localhost:5173/Pzc5Glu` instead of the backend URL!
