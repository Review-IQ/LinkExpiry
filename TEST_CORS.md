# CORS Debugging Guide

## ✅ What I Just Fixed

Updated CORS to allow **ALL origins** in development mode for easier testing.

**File**: `backend/LinkExpiry.API/Program.cs`

```csharp
// Development: Allow any origin
policy.SetIsOriginAllowed(origin => true)
      .AllowAnyMethod()
      .AllowAnyHeader()
      .AllowCredentials();
```

---

## 🚨 CRITICAL: You MUST Restart the Backend!

The CORS change requires a backend restart:

```bash
# Stop the backend (Ctrl+C)
# Then restart:
cd backend/LinkExpiry.API
dotnet run
```

Look for this log line:
```
[INF] Frontend URL: http://localhost:5173
Now listening on: https://localhost:34049
```

---

## 🧪 Test 1: Direct API Test (No CORS)

Test the backend directly without browser CORS restrictions:

### PowerShell:
```powershell
$body = @{
    email = "test@example.com"
    password = "Test123!@#"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://localhost:34049/api/auth/register" `
    -Method Post `
    -Body $body `
    -ContentType "application/json" `
    -SkipCertificateCheck
```

### Bash/WSL:
```bash
curl -k -X POST https://localhost:34049/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "userId": "...",
    "email": "test@example.com",
    "accessToken": "...",
    "refreshToken": "...",
    "expiresAt": "...",
    "planType": "FREE"
  }
}
```

**If this fails**: Your backend has issues unrelated to CORS.

---

## 🧪 Test 2: Browser CORS Test

### Step 1: Open Browser Console
1. Open `http://localhost:5173`
2. Press F12 → Console tab
3. Paste this code:

```javascript
fetch('https://localhost:34049/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'Test123!@#'
  })
})
.then(r => r.json())
.then(data => console.log('SUCCESS:', data))
.catch(err => console.error('ERROR:', err));
```

### Step 2: Check Network Tab
1. Press F12 → Network tab
2. Look for the request to `/api/auth/register`
3. Click on it
4. Check **Headers** section

**Expected Response Headers** (if CORS is working):
```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Credentials: true
```

---

## 🔍 Common CORS Error Messages

### Error 1: "has been blocked by CORS policy"
```
Access to fetch at 'https://localhost:34049/api/auth/register'
from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Causes**:
- ✅ Backend not restarted after CORS change
- ✅ Backend not running
- ✅ CORS middleware not applied

**Solutions**:
1. **Restart backend** (most common fix!)
2. Verify backend is running on port 34049
3. Check backend logs for CORS policy application

### Error 2: "Preflight request didn't succeed"
```
CORS preflight channel did not succeed
```

**Cause**: Backend rejecting OPTIONS requests

**Solution**: Already fixed - `.AllowAnyMethod()` includes OPTIONS

### Error 3: SSL Certificate Error
```
NET::ERR_CERT_AUTHORITY_INVALID
```

**Cause**: HTTPS certificate not trusted

**Solution**:
```bash
dotnet dev-certs https --trust
```

Then restart browser.

### Error 4: "Credentials flag is true, but Access-Control-Allow-Credentials is not"
```
Response to preflight request doesn't pass access control check
```

**Cause**: Missing `.AllowCredentials()`

**Solution**: Already fixed in CORS policy

---

## 🔧 Advanced Debugging

### Check Backend Logs
Look for these log entries when making a request:

```
[INF] Request starting HTTP/2 POST https://localhost:34049/api/auth/register
[INF] CORS policy execution successful
[INF] User registered successfully: test@example.com
```

**If you don't see "CORS policy execution successful"**: CORS middleware not applied correctly.

### Verify CORS Middleware Order
In `Program.cs`, CORS must be **before** authentication:

```csharp
app.UseCors("AllowFrontend");  // ✅ Before auth
app.UseAuthentication();
app.UseAuthorization();
```

### Check Browser DevTools

**Headers Tab** should show:

**Request Headers**:
```
Origin: http://localhost:5173
Content-Type: application/json
```

**Response Headers** (if CORS works):
```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: *
```

---

## 📋 Troubleshooting Checklist

- [ ] Backend restarted after CORS changes
- [ ] Backend running on `https://localhost:34049`
- [ ] Frontend running on `http://localhost:5173`
- [ ] Browser console shows the exact CORS error
- [ ] Network tab shows the request details
- [ ] SSL certificate trusted (`dotnet dev-certs https --trust`)
- [ ] Browser cache cleared (Ctrl + Shift + Delete)
- [ ] Tried in Incognito mode
- [ ] Direct API test (curl/PowerShell) works

---

## 🎯 Quick Fix Steps

1. **Stop backend** (Ctrl+C in backend terminal)

2. **Restart backend**:
   ```bash
   cd backend/LinkExpiry.API
   dotnet run
   ```

3. **Verify backend logs show**:
   ```
   [INF] Frontend URL: http://localhost:5173
   Now listening on: https://localhost:34049
   ```

4. **Clear browser cache** or use Incognito

5. **Try registering** again from frontend

---

## 🆘 If CORS Still Fails

### Option 1: Completely Open CORS (Temporary)

Add this **temporary** configuration for testing:

```csharp
// TEMPORARY - ONLY FOR TESTING!
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
        // Note: AllowCredentials() cannot be used with AllowAnyOrigin()
    });
});
```

**WARNING**: This removes credentials support. Only use for testing!

### Option 2: Disable HTTPS in Development

Update `launchSettings.json`:

```json
{
  "profiles": {
    "LinkExpiry.API": {
      "applicationUrl": "http://localhost:34049"  // Remove HTTPS
    }
  }
}
```

And update frontend `.env`:
```
VITE_API_URL=http://localhost:34049  // Use HTTP instead
```

---

## 📸 Share These Details

If CORS still doesn't work, share:

1. **Exact error message** from browser console
2. **Network tab screenshot** showing request headers and response headers
3. **Backend console output** when request is made
4. **Result of direct API test** (curl/PowerShell)

This will help diagnose the exact issue.

---

**Last Updated**: October 17, 2025
**Status**: ✅ CORS Fixed - Restart Required
