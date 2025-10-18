# Debugging Password Issue - Step by Step

## Current Situation

- **Password**: `123456`
- **Hash in DB**: `$2a$11$BcR6.pSrFPSpdkODaiYsdegszsrHTSu55P2NRYJk/LTu4PsOcXU.2`
- **Issue**: Password verification failing

## Changes Made for Debugging

### 1. Backend Logging Added
**File**: `backend/LinkExpiry.API/Controllers/RedirectController.cs` (line 221-260)

Added logging to see:
- Password length received
- Hash from database
- BCrypt verification result

### 2. Frontend Logging Added
**File**: `frontend/src/pages/ShortLinkRedirect.tsx` (line 86-104)

Added console logging to see:
- Password being submitted
- Request details
- Response status

## Testing Steps

### Step 1: Stop Both Services
Press `Ctrl+C` in both terminal windows to stop backend and frontend.

### Step 2: Rebuild and Restart Backend

```bash
cd C:\myStuff\LinkExpiry\backend\LinkExpiry.API
dotnet build
dotnet run
```

Watch the terminal for log messages.

### Step 3: Rebuild and Restart Frontend

```bash
cd C:\myStuff\LinkExpiry\frontend
npm run build
npm run dev
```

### Step 4: Test Password Flow

1. Open **NEW incognito window** (Ctrl+Shift+N)
2. Open **DevTools** (F12)
   - Go to **Console** tab
   - Go to **Network** tab

3. Visit: `http://localhost:5173/axK2LTN`

4. You should see a password form

5. Enter password: `123456`

6. Click "Access Link"

7. **Check Console Tab** - You should see logs like:
   ```
   [Password Submit] Starting submission...
   [Password Submit] Password length: 6
   [Password Submit] ShortCode: axK2LTN
   [Password Submit] FormData created, posting to: https://localhost:34049/axK2LTN/password
   [Password Submit] Response status: 401 or 302
   [Password Submit] Response type: ...
   ```

8. **Check Backend Terminal** - You should see logs like:
   ```
   info: LinkExpiry.API.Controllers.RedirectController[0]
         Password submission for axK2LTN, password length: 6
   dbug: LinkExpiry.API.Controllers.RedirectController[0]
         Hash from DB length: 60, starts with: $2a$11$BcR
   info: LinkExpiry.API.Controllers.RedirectController[0]
         Password verification result for axK2LTN: True or False
   ```

9. **Check Network Tab** - Look for the POST request:
   - Should see: `POST /axK2LTN/password`
   - Check the **Payload** tab to see the password being sent
   - Check the **Response** tab to see what was returned

## What to Look For

### If Password Length is NOT 6:
- Frontend is modifying the password somehow
- Check for whitespace trimming
- Check for encoding issues

### If Hash Length is NOT 60:
- Database has corrupted hash
- Hash not stored correctly

### If Verification Returns False:
- Hash doesn't match the password `123456`
- Possible causes:
  1. Password was hashed with different value than `123456`
  2. Hash is corrupted in database
  3. BCrypt version mismatch

## Solutions

### Solution 1: Verify Hash in Database

Run this query to check the exact hash:

```bash
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d linkexpiry_dev
```

```sql
SELECT
    short_code,
    password_hash,
    LENGTH(password_hash) as len,
    SUBSTRING(password_hash, 1, 10) as prefix
FROM links
WHERE short_code = 'axK2LTN';
```

Expected:
- `len`: 60
- `prefix`: `$2a$11$BcR`

### Solution 2: Create New Test Link

Instead of using the existing link, create a fresh one:

1. Go to: http://localhost:5173/dashboard
2. Create new link:
   - URL: https://google.com
   - Password: `test123`
   - Note the short code

3. Test the NEW link:
   - Visit: `http://localhost:5173/{NEW_SHORT_CODE}`
   - Enter: `test123`

### Solution 3: Manually Test BCrypt

Create a simple C# program to test:

```bash
cd C:\myStuff\LinkExpiry\backend\LinkExpiry.API
```

Create `TestPassword.cs`:

```csharp
using System;

var password = "123456";
var hash = "$2a$11$BcR6.pSrFPSpdkODaiYsdegszsrHTSu55P2NRYJk/LTu4PsOcXU.2";

Console.WriteLine($"Testing: '{password}'");
Console.WriteLine($"Against: {hash}");

var result = BCrypt.Net.BCrypt.Verify(password, hash);
Console.WriteLine($"Result: {result}");

if (!result)
{
    var newHash = BCrypt.Net.BCrypt.HashPassword(password);
    Console.WriteLine($"\nCorrect hash for '{password}': {newHash}");
}
```

Run with:
```bash
dotnet script TestPassword.cs
```

### Solution 4: Reset Password Hash

If the hash is wrong, update it in the database:

```sql
-- First, generate correct hash for '123456' from C# console or backend logs
-- Then update:
UPDATE links
SET password_hash = '{NEW_HASH_HERE}'
WHERE short_code = 'axK2LTN';
```

## Common Issues

### Issue 1: CORS Error
If you see CORS errors in browser console:
- Make sure you're testing via `http://localhost:5173/...`
- NOT `https://localhost:34049/...`

### Issue 2: Session Not Working
If password verifies but still asks for password again:
- Sessions might not be persisting
- Check if cookies are being set (Application tab → Cookies)

### Issue 3: Form Data Not Sent
If backend shows password length = 0:
- Frontend not sending form data correctly
- Check Network tab → Payload

## Expected Flow

```
1. Frontend: POST /axK2LTN/password
   Body: password=123456

2. Backend: Receives password
   Log: "Password submission for axK2LTN, password length: 6"

3. Backend: Loads hash from DB
   Log: "Hash from DB length: 60, starts with: $2a$11$BcR"

4. Backend: Verifies with BCrypt
   Log: "Password verification result for axK2LTN: True"

5. Backend: Stores in session
   Log: "Password stored in session for axK2LTN"

6. Backend: Returns 302 redirect

7. Frontend: Redirects to GET /axK2LTN

8. Backend: Checks session, finds password

9. Backend: Increments view count

10. Backend: Redirects to original URL
```

---

**Next Steps**: Follow testing steps above and report what you see in:
1. Browser console logs
2. Backend terminal logs
3. Network tab payload/response
