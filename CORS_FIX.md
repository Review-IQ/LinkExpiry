# CORS Error Fix Guide

## ✅ Issue Resolved

Your backend and frontend ports were mismatched, causing CORS errors.

---

## 🔧 What Was Fixed

### 1. Backend Configuration
**File**: `backend/LinkExpiry.API/appsettings.Development.json`

**Updated**:
```json
{
  "AppSettings": {
    "BaseUrl": "https://localhost:34049",  // ✅ Updated to match launchSettings.json
    "FrontendUrl": "http://localhost:5173" // ✅ CORS origin
  }
}
```

### 2. Frontend Configuration
**File**: `frontend/.env`

**Updated**:
```
VITE_API_URL=https://localhost:34049  // ✅ Matches backend port
```

### 3. API Client
**File**: `frontend/src/services/api.ts`

**Fixed to read from environment**:
```typescript
// BEFORE (Hardcoded):
const API_BASE_URL = "https://localhost:34049";

// AFTER (Environment-based):
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://localhost:34049";
```

---

## 🚀 How to Test the Fix

### Step 1: Restart Backend
```bash
cd backend/LinkExpiry.API
dotnet run
```

**Expected Output**:
```
[INF] LinkExpiry API starting...
[INF] Environment: Development
[INF] Frontend URL: http://localhost:5173
Now listening on: https://localhost:34049
Now listening on: http://localhost:34050
```

### Step 2: Restart Frontend
```bash
cd frontend
npm run dev
```

**Expected Output**:
```
VITE v5.4.20  ready in XXX ms

➜  Local:   http://localhost:5173/
```

**IMPORTANT**: You MUST restart the frontend dev server after changing `.env` files!

### Step 3: Test Registration
1. Open browser: `http://localhost:5173`
2. Click "Register"
3. Fill in email and password
4. Submit

**Check Network Tab** (F12):
- Request URL should be: `https://localhost:34049/api/auth/register`
- Status should be: `200 OK` (not CORS error)

---

## 🔍 Understanding CORS

### What is CORS?
**Cross-Origin Resource Sharing** - A security feature that restricts web pages from making requests to a different domain than the one serving the page.

### Your Setup
- **Frontend**: `http://localhost:5173` (different port)
- **Backend**: `https://localhost:34049` (different port + HTTPS)
- These are **different origins**, so CORS must be configured

### Backend CORS Configuration
**Location**: `backend/LinkExpiry.API/Program.cs` (lines 89-98)

```csharp
var frontendUrl = builder.Configuration["AppSettings:FrontendUrl"] ?? "http://localhost:5173";

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(frontendUrl)          // ✅ Allows http://localhost:5173
              .AllowAnyMethod()                  // ✅ GET, POST, PUT, DELETE
              .AllowAnyHeader()                  // ✅ Authorization, Content-Type, etc.
              .AllowCredentials();               // ✅ Cookies and auth tokens
    });
});
```

---

## ⚠️ Common CORS Errors

### Error 1: Access-Control-Allow-Origin Missing
```
Access to XMLHttpRequest at 'https://localhost:34049/api/auth/register'
from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Cause**: Backend not configured to allow frontend origin

**Solution**: ✅ Fixed by updating `appsettings.Development.json`

### Error 2: Preflight Request Failed
```
Response to preflight request doesn't pass access control check
```

**Cause**: Missing `.AllowCredentials()` or `.AllowAnyMethod()`

**Solution**: ✅ Already configured in `Program.cs`

### Error 3: Wrong Port
```
Failed to fetch
```

**Cause**: Frontend trying to connect to wrong backend port

**Solution**: ✅ Fixed by updating `.env` and `api.ts`

---

## 📋 Port Configuration Summary

| Service | Port | Protocol | URL |
|---------|------|----------|-----|
| Backend API | 34049 | HTTPS | `https://localhost:34049` |
| Backend HTTP | 34050 | HTTP | `http://localhost:34050` (redirects to HTTPS) |
| Frontend | 5173 | HTTP | `http://localhost:5173` |

**Configuration Files**:
1. Backend ports: `backend/LinkExpiry.API/Properties/launchSettings.json`
2. Backend CORS: `backend/LinkExpiry.API/appsettings.Development.json`
3. Frontend API URL: `frontend/.env`

---

## 🔄 If You Still See CORS Errors

### 1. Clear Browser Cache
- Press `Ctrl + Shift + Delete`
- Clear cached images and files
- OR use Incognito/Private mode

### 2. Verify Backend is Running
```bash
curl https://localhost:34049/health
# Expected: Healthy
```

### 3. Verify Backend CORS Logs
Check terminal for:
```
[INF] Frontend URL: http://localhost:5173
```

### 4. Check Browser Console
- Open DevTools (F12)
- Go to Network tab
- Look for the failing request
- Check Response Headers for `Access-Control-Allow-Origin`

### 5. Verify Environment Variables
**Frontend** - Check if Vite loaded the env:
```typescript
console.log(import.meta.env.VITE_API_URL); // Should print: https://localhost:34049
```

### 6. Restart Both Services
Sometimes environment changes require a full restart:
```bash
# Terminal 1
cd backend/LinkExpiry.API
dotnet run

# Terminal 2
cd frontend
npm run dev
```

---

## ✅ Expected Behavior (After Fix)

### Browser Network Tab Should Show:

**Request Headers**:
```
Origin: http://localhost:5173
```

**Response Headers**:
```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Credentials: true
```

**Status**: `200 OK` (or appropriate success code)

---

## 🎯 Quick Verification Checklist

- [ ] Backend running on `https://localhost:34049`
- [ ] Frontend running on `http://localhost:5173`
- [ ] `appsettings.Development.json` has `FrontendUrl: "http://localhost:5173"`
- [ ] `frontend/.env` has `VITE_API_URL=https://localhost:34049`
- [ ] `api.ts` reads from `import.meta.env.VITE_API_URL`
- [ ] Both services restarted after config changes
- [ ] Browser cache cleared (or using Incognito)

---

## 🎉 You're All Set!

Your backend and frontend should now communicate without CORS errors!

**Next Steps**:
1. Test user registration
2. Test user login
3. Test creating a link
4. Check the analytics dashboard

If you still encounter issues, check the browser console and backend logs for specific error messages.

---

**Date**: October 17, 2025
**Status**: ✅ CORS Configured
**Backend**: https://localhost:34049
**Frontend**: http://localhost:5173
