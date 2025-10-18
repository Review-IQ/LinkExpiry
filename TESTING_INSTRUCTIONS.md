# Testing Instructions - View Count Fix

## ✅ All Fixes Are Already Applied

The following fixes are already in place and running:
1. HEAD endpoint in backend (doesn't increment views)
2. Frontend uses HEAD request first
3. useRef hook prevents React StrictMode double execution

## 🧪 How to Test Properly

### Important: You MUST Restart Both Services First

Even though the code has the fixes, you need to restart to ensure the latest version is running:

**Terminal 1 - Stop and Restart Backend:**
```bash
# Press Ctrl+C to stop the current backend
cd C:\myStuff\LinkExpiry\backend\LinkExpiry.API
dotnet run
```

**Terminal 2 - Stop and Restart Frontend:**
```bash
# Press Ctrl+C to stop the current frontend
cd C:\myStuff\LinkExpiry\frontend
npm run dev
```

### Step-by-Step Test Procedure

**1. Create a Fresh Test Link**
- Login to dashboard at http://localhost:5173/dashboard
- Create new link:
  - URL: https://google.com
  - Expiry: No expiry
  - No password
  - Note the short code (e.g., "abc123")

**2. Check Initial View Count**
- In dashboard, verify `current_views` is 0

**3. Test First Click (CRITICAL: Follow Exactly)**
- Open **NEW Incognito Window** (Ctrl+Shift+N)
- Press F12 → Go to **Network** tab
- Visit: http://localhost:5173/abc123 (use your shortCode)
- Watch Network tab - you should see:
  ```
  HEAD /abc123  → 200 OK
  GET  /abc123  → 302 Redirect
  ```
- **Close this incognito window completely**

**4. Verify Count**
- Go back to dashboard
- Refresh the page
- **Expected: current_views = 1**
- If you see more than 1, continue reading

**5. Test Additional Clicks**
- For each test, open a **NEW incognito window**
- Visit the link
- **Close the window completely**
- Check dashboard count

## 🔍 If You're Still Seeing High Counts

### Check 1: Are you testing via frontend or backend?
- ✅ CORRECT: http://localhost:5173/abc123
- ❌ WRONG: https://localhost:34049/abc123

Testing the backend URL directly bypasses the HEAD request protection!

### Check 2: Browser Network Tab
Look at the Network tab when visiting the link:

**Good (1 increment):**
```
HEAD /abc123 → 200 OK
GET  /abc123 → 302 Redirect
```

**Bad (multiple increments):**
```
GET /abc123 → 302
GET /abc123 → 302
GET /abc123 → 302
(multiple GET requests = multiple increments)
```

### Check 3: Are Services Restarted?
The fixes are in the code, but if you haven't restarted both services since the fix was applied, you're running old code!

**Stop both services (Ctrl+C in each terminal) and restart them.**

### Check 4: Testing Methodology
Common mistakes that cause false high counts:
- ❌ Opening link in multiple tabs
- ❌ Refreshing the link page multiple times
- ❌ Testing in regular browser (should use incognito)
- ❌ Having browser extensions enabled
- ❌ Not closing incognito window between tests
- ❌ Testing backend URL instead of frontend URL

## 📊 Expected Behavior

### Test: Click link 5 times (5 separate incognito windows)

**Expected Database State:**
```
current_views: 5
total_clicks: 5
```

**If you see:**
```
current_views: 50
```

Then check:
1. Did you restart both services after applying the fix?
2. Are you testing via http://localhost:5173/{shortCode}?
3. Are you opening each click in a NEW incognito window?
4. Are you watching the Network tab for duplicate requests?

## 🔧 Database Check

You can verify the count directly in PostgreSQL:

```bash
# Find psql.exe
powershell "Get-ChildItem -Path 'C:\Program Files\PostgreSQL' -Recurse -Filter psql.exe -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName"

# Connect to database (use the path from above)
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d linkexpiry_dev

# Check view count
SELECT short_code, current_views, total_clicks
FROM links
WHERE short_code = 'abc123';  -- Replace with your code

# Reset count for fresh testing
UPDATE links
SET current_views = 0, total_clicks = 0
WHERE short_code = 'abc123';  -- Replace with your code

# Exit
\q
```

## ✅ Final Checklist

Before reporting the issue still exists, verify:
- [ ] Backend restarted after fix applied
- [ ] Frontend restarted after fix applied
- [ ] Testing via http://localhost:5173/{shortCode} (NOT backend URL)
- [ ] Using NEW incognito window for each test
- [ ] Closing incognito window after each test
- [ ] No browser extensions enabled
- [ ] Browser cache cleared (Ctrl+Shift+Delete)
- [ ] Watching Network tab showing only 1 HEAD + 1 GET
- [ ] Only one tab open during test

## 📞 If Issue Persists

If you've followed ALL steps above and still see incorrect counts, please provide:
1. Screenshot of Network tab showing the requests
2. Screenshot of database query results
3. Confirmation that both services were restarted
4. Exact URL you're testing (should be http://localhost:5173/{shortCode})

---

**Last Updated**: October 17, 2025
**Status**: All fixes applied - Ready for proper testing
