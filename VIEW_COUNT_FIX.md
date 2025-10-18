# View Count Fix - Complete Guide

## ✅ Fixes Applied

### 1. Backend: Added HEAD Endpoint
**File**: `backend/LinkExpiry.API/Controllers/RedirectController.cs`

Added `CheckLinkStatus()` method that handles HEAD requests:
- Does NOT increment view count
- Returns status codes to indicate link state
- Allows frontend to check link status before redirecting

### 2. Frontend: Use HEAD Request First
**File**: `frontend/src/pages/ShortLinkRedirect.tsx`

- First makes HEAD request to check status (no increment)
- Only makes GET request when actually redirecting
- Added `useRef` to prevent React StrictMode double execution

### 3. React StrictMode Protection
**File**: `frontend/src/pages/ShortLinkRedirect.tsx`

```typescript
const hasChecked = useRef(false);

useEffect(() => {
  if (shortCode && !hasChecked.current) {
    hasChecked.current = true;  // Prevent double execution
    checkLink();
  }
}, [shortCode]);
```

---

## 🧪 How to Test Properly

### Step 1: Restart Both Services

**Terminal 1 - Backend**:
```bash
cd backend/LinkExpiry.API
dotnet run
```

**Terminal 2 - Frontend**:
```bash
cd frontend
npm run dev
```

### Step 2: Open Browser DevTools

Press `F12` → Go to **Network** tab

### Step 3: Create a Test Link

1. Login to dashboard
2. Create a new link with:
   - URL: `https://google.com`
   - Expiry: No expiry (or time-based)
   - No password
   - Note the short code (e.g., `abc123`)

### Step 4: Check Initial View Count

In the dashboard, note the `current_views` for your link. Should be **0**.

### Step 5: Test Redirect (First Click)

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. Open **New Incognito Window** (Ctrl+Shift+N)
3. Visit: `http://localhost:5173/abc123` (replace with your shortCode)
4. Watch the **Network tab**:

**Expected requests**:
```
HEAD /{shortCode}  → 200 OK (no increment)
GET  /{shortCode}  → 302 Redirect (increment +1)
```

5. Go back to dashboard
6. Refresh the links list
7. **Current views should be exactly 1** ✅

### Step 6: Test Multiple Clicks

1. Open **3 more incognito windows**
2. Visit the link in each window
3. Go back to dashboard
4. **Current views should be exactly 4** ✅

---

## 🐛 Debugging High View Counts

If you're still seeing 10+ increments per click, here's how to debug:

### Check 1: Browser Network Tab

Open DevTools → Network tab and look for requests to `/{shortCode}`:

**Good** (1 increment):
```
HEAD /abc123 → 200 OK
GET  /abc123 → 302 Redirect
```

**Bad** (multiple increments):
```
GET /abc123 → 302
GET /abc123 → 302
GET /abc123 → 302
... (many requests)
```

### Check 2: Backend Logs

Look at the backend console for log messages:

```bash
[DBG] Redirecting abc123 to https://google.com
```

Count how many times this message appears for one click.

**Expected**: 1 message per click
**If seeing multiple**: Frontend is making multiple requests

### Check 3: Database Direct Query

Connect to PostgreSQL:
```bash
psql -U postgres -d linkexpiry_dev
```

Run this query to see view count:
```sql
SELECT short_code, current_views, total_clicks
FROM links
WHERE short_code = 'abc123';  -- Replace with your code
```

### Check 4: React StrictMode

In development mode, React StrictMode causes double renders. This is NORMAL in dev mode.

**To verify**:
1. Build production version: `cd frontend && npm run build`
2. Serve it: `npx serve -s dist -p 5173`
3. Test again

If counts are correct in production but not in dev, it's StrictMode (expected behavior in dev).

---

## 🔍 Possible Causes of High Counts

### Cause 1: Multiple Browser Tabs
- If you have the same link open in multiple tabs
- Each tab visiting the link increments the count
- **Solution**: Test in separate incognito windows

### Cause 2: Browser Prefetching
- Some browsers prefetch links
- Chrome's "Preload pages for faster browsing"
- **Solution**: Disable prefetching in browser settings

### Cause 3: Browser Extensions
- Ad blockers, privacy tools may make multiple requests
- Link checkers, security scanners
- **Solution**: Test in incognito mode without extensions

### Cause 4: React DevTools
- React DevTools can trigger re-renders
- **Solution**: Close React DevTools during testing

### Cause 5: Hot Module Reload (HMR)
- Vite's HMR can cause re-renders during development
- **Solution**: Test after saving files (wait for HMR to complete)

### Cause 6: Direct Backend Access
- If testing `https://localhost:34049/{shortCode}` directly
- No HEAD request protection
- **Solution**: Always test via `http://localhost:5173/{shortCode}`

---

## ✅ Correct Flow

### For Normal Links (No Password):

```
User visits: http://localhost:5173/abc123
  ↓
Frontend: HEAD request → Check status (0 increments)
  ↓
Backend: Returns 200 OK
  ↓
Frontend: Redirects to https://localhost:34049/abc123
  ↓
Backend: GET request → Increment +1, redirect to original URL
  ↓
Browser: Navigates to original URL
  ↓
Total increments: 1 ✅
```

### For Password-Protected Links:

```
User visits: http://localhost:5173/abc123
  ↓
Frontend: HEAD request → Check status (0 increments)
  ↓
Backend: Returns 401 Unauthorized
  ↓
Frontend: Shows password form (0 increments)
  ↓
User enters password
  ↓
Frontend: POST /abc123/password (0 increments)
  ↓
Backend: Validates password, sets session
  ↓
Frontend: GET request → Increment +1, redirect
  ↓
Total increments: 1 ✅
```

### For Expired Links:

```
User visits: http://localhost:5173/abc123
  ↓
Frontend: HEAD request → Check status (0 increments)
  ↓
Backend: Returns 410 Gone
  ↓
Frontend: GET request to get error message (increment +1, but link is inactive)
  ↓
Frontend: Shows expired page
  ↓
Total increments: 0-1 (doesn't matter, link is inactive)
```

---

## 🔧 Additional Debugging Commands

### Check All Links and Their Counts:
```sql
SELECT
    short_code,
    title,
    current_views,
    total_clicks,
    is_active,
    created_at
FROM links
ORDER BY created_at DESC;
```

### Reset a Link's View Count (for testing):
```sql
UPDATE links
SET current_views = 0, total_clicks = 0
WHERE short_code = 'abc123';  -- Replace with your code
```

### Watch Live Updates (in psql):
```sql
\watch 1

SELECT short_code, current_views, total_clicks
FROM links
WHERE short_code = 'abc123';
```
Press `Ctrl+C` to stop watching.

---

## 📊 Expected vs Actual

### Test Scenario:
- Create link
- Click it 5 times (in 5 separate incognito windows)

### Expected Result:
```
current_views: 5
total_clicks: 5
```

### If You're Seeing:
```
current_views: 50
total_clicks: 50
```

Then there's still an issue. Follow the debugging steps above.

---

## 🎯 Final Checklist

- [ ] Backend restarted after adding HEAD endpoint
- [ ] Frontend restarted after adding useRef fix
- [ ] Testing in incognito mode (no extensions)
- [ ] Browser cache cleared before testing
- [ ] Using `http://localhost:5173/{shortCode}` (NOT direct backend URL)
- [ ] Watching Network tab for requests
- [ ] Checking backend logs for redirect count
- [ ] Testing with fresh link (reset counts if needed)
- [ ] Only one tab open per test
- [ ] Waiting for page to fully load before checking count

---

**Date**: October 17, 2025
**Status**: ✅ Fixes Applied - Ready for Testing
**Key Fix**: HEAD request + useRef to prevent double execution
