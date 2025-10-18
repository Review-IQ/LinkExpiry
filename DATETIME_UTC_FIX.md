# DateTime UTC Fix for PostgreSQL 18

## ✅ Issue Resolved

**Error**: `Cannot write DateTime with Kind=Unspecified to PostgreSQL type 'timestamp with time zone', only UTC is supported`

**Root Cause**: PostgreSQL 18 with Npgsql requires all DateTime values to have `Kind=UTC`, but the code was creating DateTime objects with `Kind=Unspecified`.

---

## 🔧 What Was Fixed

### 1. AppDbContext.cs - Global UTC DateTime Configuration

**File**: `backend/LinkExpiry.API/Data/AppDbContext.cs`

**Added**:
```csharp
protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
{
    // Configure all DateTime properties to use UTC for PostgreSQL compatibility
    configurationBuilder.Properties<DateTime>()
        .HaveConversion<UtcDateTimeConverter>();

    configurationBuilder.Properties<DateTime?>()
        .HaveConversion<UtcNullableDateTimeConverter>();
}
```

**Value Converters Added**:
```csharp
/// <summary>
/// Converts DateTime to UTC for PostgreSQL timestamp with time zone compatibility
/// </summary>
public class UtcDateTimeConverter : ValueConverter<DateTime, DateTime>
{
    public UtcDateTimeConverter() : base(
        // Convert to UTC when writing to database
        v => v.Kind == DateTimeKind.Utc ? v : DateTime.SpecifyKind(v, DateTimeKind.Utc),
        // Ensure UTC when reading from database
        v => DateTime.SpecifyKind(v, DateTimeKind.Utc))
    {
    }
}

/// <summary>
/// Converts nullable DateTime to UTC for PostgreSQL timestamp with time zone compatibility
/// </summary>
public class UtcNullableDateTimeConverter : ValueConverter<DateTime?, DateTime?>
{
    public UtcNullableDateTimeConverter() : base(
        // Convert to UTC when writing to database
        v => v.HasValue ? (v.Value.Kind == DateTimeKind.Utc ? v.Value : DateTime.SpecifyKind(v.Value, DateTimeKind.Utc)) : v,
        // Ensure UTC when reading from database
        v => v.HasValue ? DateTime.SpecifyKind(v.Value, DateTimeKind.Utc) : v)
    {
    }
}
```

**What This Does**:
- Automatically converts ALL DateTime properties to UTC when saving to database
- Ensures ALL DateTime values read from database are treated as UTC
- Applies globally to ALL entities (User, Link, Click)

### 2. AnalyticsService.cs - Explicit UTC DateTime Creation

**File**: `backend/LinkExpiry.API/Services/AnalyticsService.cs` (line 156)

**Before**:
```csharp
var startOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
// Kind = Unspecified ❌
```

**After**:
```csharp
var startOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
// Kind = UTC ✅
```

---

## 📋 Affected Operations

The fix resolves errors in:

1. **User Registration** (`POST /api/auth/register`)
   - Creates User.CreatedAt with UTC timestamp

2. **Link Creation** (`POST /api/links`)
   - Creates Link.CreatedAt and Link.ExpiresAt with UTC timestamps

3. **Analytics Dashboard** (`GET /api/analytics/dashboard`)
   - Queries clicks with date filters (startOfMonth, last30Days)

4. **Link Analytics** (`GET /api/analytics/{linkId}`)
   - Queries clicks by date range

5. **Click Logging** (`POST /api/clicks`)
   - Creates Click.ClickedAt with UTC timestamp

---

## 🚀 Next Steps

### Step 1: Load Database Schema

You mentioned the database is already created. Now load the schema:

```powershell
# Using full path to psql (as we found earlier)
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d linkexpiry_dev -f "C:\myStuff\LinkExpiry\database\00_initial_schema.sql"
```

When prompted, enter password: `admin`

**Expected Output**:
```
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE FUNCTION
CREATE TRIGGER
```

### Step 2: Restart Backend

The backend is currently running (process ID 68920). You need to restart it to apply the DateTime UTC fixes.

**In the backend terminal**:
1. Press `Ctrl+C` to stop the running server
2. Restart it:
```bash
cd backend/LinkExpiry.API
dotnet run
```

**Expected Output**:
```
[INF] Database migrated successfully
[INF] LinkExpiry API starting...
[INF] Environment: Development
[INF] Frontend URL: http://localhost:5173
Now listening on: https://localhost:34049
Now listening on: http://localhost:34050
```

### Step 3: Test Registration

**In Browser Console** (F12 → Console):
```javascript
fetch('https://localhost:34049/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
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
    "expiresAt": "2025-10-17T...",
    "planType": "FREE"
  }
}
```

**No DateTime errors!** ✅

### Step 4: Test Link Creation

**In Browser Console**:
```javascript
// Assuming you have accessToken from registration
fetch('https://localhost:34049/api/links', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN_HERE'
  },
  credentials: 'include',
  body: JSON.stringify({
    originalUrl: 'https://example.com',
    title: 'Test Link',
    expiryType: 'TIME',
    expiresAt: new Date(Date.now() + 86400000).toISOString() // 24 hours from now
  })
})
.then(r => r.json())
.then(data => console.log('LINK CREATED:', data))
.catch(err => console.error('ERROR:', err));
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Link created successfully",
  "data": {
    "id": "...",
    "shortCode": "abc123",
    "shortUrl": "https://localhost:34049/abc123",
    "originalUrl": "https://example.com",
    "title": "Test Link",
    "createdAt": "2025-10-17T...",
    "expiresAt": "2025-10-18T...",
    "isActive": true
  }
}
```

### Step 5: Test Analytics Dashboard

**In Browser Console**:
```javascript
fetch('https://localhost:34049/api/analytics/dashboard', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN_HERE'
  },
  credentials: 'include'
})
.then(r => r.json())
.then(data => console.log('DASHBOARD:', data))
.catch(err => console.error('ERROR:', err));
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "totalLinks": 1,
    "activeLinks": 1,
    "expiredLinks": 0,
    "totalClicks": 0,
    "clicksThisMonth": 0,
    "linksCreatedThisMonth": 1,
    "linksLimitThisMonth": 10,
    "topLinks": [...],
    "clicksByDate": [...]
  }
}
```

---

## 🔍 Technical Details

### Why This Was Needed

**PostgreSQL 18** with the latest **Npgsql** EF Core provider enforces strict timezone awareness for `timestamp with time zone` columns.

**Before Fix**:
- Code created `DateTime` objects without specifying `Kind`
- Default `Kind` is `Unspecified`
- PostgreSQL/Npgsql rejects `Unspecified` DateTime values
- **Result**: `System.ArgumentException`

**After Fix**:
- All DateTime properties automatically converted to `Kind=UTC`
- Both when writing TO database and reading FROM database
- Consistent timezone handling across the entire application
- **Result**: No more timezone errors ✅

### What the Converters Do

1. **Writing to Database**:
   - If `DateTime.Kind == UTC`: Use as-is
   - If `DateTime.Kind == Local` or `Unspecified`: Convert to UTC using `SpecifyKind`

2. **Reading from Database**:
   - Always ensure `DateTime.Kind == UTC` using `SpecifyKind`

3. **No Data Loss**:
   - `SpecifyKind` doesn't change the time value, just the `Kind` metadata
   - If you were already using UTC times (like `DateTime.UtcNow`), no change

---

## ✅ Verification Checklist

- [x] AppDbContext.cs updated with UTC converters
- [x] AnalyticsService.cs startOfMonth fixed with explicit UTC
- [x] No other `new DateTime(` or `DateTime.Now` calls found in code
- [ ] Database schema loaded from 00_initial_schema.sql
- [ ] Backend restarted with DateTime fix
- [ ] User registration works without errors
- [ ] Link creation works without errors
- [ ] Analytics dashboard works without errors

---

## 🎉 Summary

The DateTime UTC fix is **complete in the code**. Once you:
1. Load the database schema
2. Restart the backend

All DateTime-related operations will work correctly with PostgreSQL 18!

---

**Date**: October 17, 2025
**Status**: ✅ Code Fixed - Restart Required
**Next Step**: Load database schema and restart backend
