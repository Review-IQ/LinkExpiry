# Password-Protected Link Testing Guide

## ⚠️ IMPORTANT: Testing Method

### ❌ WRONG WAY (What you're doing):
```
Going directly to: https://localhost:34049/axK2LTN/password
```
**This will NEVER work!** The `/password` endpoint is for the frontend to POST form data to, not for you to visit directly in the browser.

### ✅ CORRECT WAY:
```
1. Visit: http://localhost:5173/axK2LTN
2. Frontend will show you a password form
3. Enter the password in the form
4. Click "Access Link" button
```

## 🔍 How Password-Protected Links Work

### Flow Diagram:
```
User visits: http://localhost:5173/axK2LTN
  ↓
Frontend: HEAD request to check status
  ↓
Backend: Returns 401 (Password Required)
  ↓
Frontend: Shows password entry form
  ↓
User: Enters password and clicks submit
  ↓
Frontend: POST to /axK2LTN/password with FormData
  ↓
Backend: Verifies password with BCrypt
  ↓
If CORRECT:
  - Backend stores password in session
  - Backend redirects to GET /axK2LTN
  - View count increments
  - User redirected to original URL
  ↓
If INCORRECT:
  - Backend returns 401 with error message
  - Frontend shows "Invalid password" error
```

## 🧪 Step-by-Step Testing

### Step 1: Create a Password-Protected Link

1. Login to dashboard: http://localhost:5173/dashboard
2. Click "Create New Link"
3. Fill in the form:
   - **Original URL**: https://google.com
   - **Expiry Type**: No expiry (or any type)
   - **Password**: `test123` (remember this!)
   - Click "Create Link"
4. Note the short code (e.g., `axK2LTN`)

### Step 2: Test the Password Flow

1. **Open NEW incognito window** (Ctrl+Shift+N)
2. **Open DevTools** (F12) → Go to **Network** tab
3. Visit: `http://localhost:5173/axK2LTN` (use your actual shortCode)
4. You should see a **password entry form** with a lock icon
5. Enter the password: `test123`
6. Click "Access Link"
7. Watch the Network tab - you should see:
   ```
   HEAD /axK2LTN           → 401 Unauthorized
   POST /axK2LTN/password  → 302 Redirect (if password correct)
   GET  /axK2LTN           → 302 Redirect to original URL
   ```
8. You should be redirected to Google

### Step 3: Test Wrong Password

1. **Open ANOTHER NEW incognito window**
2. Visit: `http://localhost:5173/axK2LTN`
3. Enter wrong password: `wrong123`
4. Click "Access Link"
5. You should see: **"Invalid password. Please try again."** error message
6. The form should still be visible

### Step 4: Test Correct Password Again

1. In the same window, enter correct password: `test123`
2. Click "Access Link"
3. Should redirect to original URL

## 🐛 Debugging "Always Returns Invalid Password"

If you're getting "Invalid password" even with the correct password:

### Check 1: What password did you use when creating the link?

Run this SQL to see all your links:
```sql
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d linkexpiry_dev

SELECT short_code, title,
       CASE WHEN password_hash IS NOT NULL THEN 'YES' ELSE 'NO' END as has_password
FROM links
ORDER BY created_at DESC
LIMIT 5;
```

### Check 2: Is the password being hashed correctly?

The backend uses BCrypt to hash passwords. Check the CreateLink endpoint:

```bash
# Search for BCrypt.HashPassword in the codebase
cd backend/LinkExpiry.API
grep -r "BCrypt.HashPassword" .
```

Expected to find it in:
- `Controllers/LinksController.cs` (when creating links)
- `Controllers/RedirectController.cs` (when verifying passwords)

### Check 3: Check browser console for errors

1. Open browser console (F12 → Console tab)
2. Try submitting password
3. Look for any JavaScript errors

### Check 4: Check backend logs

When you submit a password, the backend should log something. Check the backend terminal for any errors or warnings.

### Check 5: Verify CORS headers

If the POST request is failing due to CORS, you'll see errors in the browser console. The Network tab will show:
```
POST /axK2LTN/password → (failed) net::ERR_FAILED
```

## 🔧 Manual Testing with curl

You can test the backend endpoint directly with curl:

```bash
# First, check if link requires password (HEAD request)
curl -X HEAD -I https://localhost:34049/axK2LTN -k

# Should return: 401 Unauthorized

# Submit password (POST request)
curl -X POST https://localhost:34049/axK2LTN/password \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "password=test123" \
  -k -v

# If password is correct, should return: 302 Redirect
# If password is wrong, should return: 401 with JSON error
```

## 📊 Database Check

To see the password hash in the database:

```sql
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d linkexpiry_dev

-- Check if password is hashed
SELECT
    short_code,
    title,
    LEFT(password_hash, 20) as password_hash_preview,
    LENGTH(password_hash) as hash_length
FROM links
WHERE short_code = 'axK2LTN';

-- BCrypt hashes are always 60 characters long and start with $2a$ or $2b$
-- Example: $2a$11$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJ
```

Expected output:
```
 short_code |      title       | password_hash_preview | hash_length
------------+------------------+-----------------------+-------------
 axK2LTN    | My Protected Link| $2a$11$Abc123...    |          60
```

## ✅ Expected vs Actual

### Expected Behavior:
1. Visit frontend URL → See password form
2. Enter correct password → Redirect to original URL
3. View count increments by 1
4. Enter wrong password → See error, form stays visible

### If You're Seeing:
- "Invalid password" with correct password
- No redirect after entering password
- JSON response instead of password form

Then:
1. **Verify you're testing via frontend URL** (`http://localhost:5173/...`)
2. **Check browser console for errors**
3. **Check backend terminal for error logs**
4. **Verify both services are running** (backend AND frontend)

## 🚨 Common Mistakes

1. ❌ Testing backend URL directly: `https://localhost:34049/axK2LTN/password`
2. ✅ Test frontend URL: `http://localhost:5173/axK2LTN`

3. ❌ Forgetting what password you used when creating link
4. ✅ Use a simple test password like `test123`

5. ❌ Not restarting services after code changes
6. ✅ Always restart both backend and frontend

7. ❌ Testing in regular browser with cache
8. ✅ Test in fresh incognito window

---

**Date**: October 17, 2025
**Status**: Password functionality is implemented - Test via frontend URL!
