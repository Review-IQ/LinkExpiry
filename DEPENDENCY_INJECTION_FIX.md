# Dependency Injection Lifetime Fix

## ❌ Error Encountered

```
System.AggregateException: Cannot consume scoped service 'LinkExpiry.API.Data.IUnitOfWork'
from singleton 'LinkExpiry.API.Services.ShortCodeGenerator'.
```

## 🔍 Root Cause

**Dependency Injection Lifetime Mismatch:**
- `ShortCodeGenerator` was registered as **Singleton** (lives for app lifetime)
- `IUnitOfWork` is registered as **Scoped** (lives for request lifetime)
- **Rule**: Singleton services cannot depend on Scoped services

## ✅ Solution

### Fix 1: Changed ShortCodeGenerator Lifetime

**File**: `backend/LinkExpiry.API/Program.cs`

**Before**:
```csharp
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ILinkService, LinkService>();
builder.Services.AddScoped<IAnalyticsService, AnalyticsService>();
builder.Services.AddSingleton<ShortCodeGenerator>(); // ❌ ERROR
```

**After**:
```csharp
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ILinkService, LinkService>();
builder.Services.AddScoped<IAnalyticsService, AnalyticsService>();
builder.Services.AddScoped<ShortCodeGenerator>(); // ✅ FIXED
```

### Fix 2: Fixed Header Assignment Warning

**Before**:
```csharp
context.Response.Headers.Add("Token-Expired", "true"); // ⚠️ Warning ASP0019
```

**After**:
```csharp
context.Response.Headers["Token-Expired"] = "true"; // ✅ No warning
```

## 📚 Dependency Injection Lifetimes Explained

### 1. **Transient**
- Created every time they're requested
- Use for lightweight, stateless services
- Example: `AddTransient<IEmailService, EmailService>()`

### 2. **Scoped**
- Created once per HTTP request
- Shared within a single request
- **Most common for services using DbContext**
- Example: `AddScoped<IUnitOfWork, UnitOfWork>()`

### 3. **Singleton**
- Created once for application lifetime
- Shared across all requests
- Use for stateless services or caching
- **Cannot depend on Scoped services**
- Example: `AddSingleton<IConfiguration>()`

## 🎯 Why ShortCodeGenerator Should Be Scoped

**Reasons**:
1. ✅ It depends on `IUnitOfWork` (which is Scoped)
2. ✅ It accesses the database to check for collisions
3. ✅ Each request needs its own instance with fresh DB context
4. ✅ No performance penalty - it's lightweight

**Singleton would be appropriate if**:
- ❌ It didn't depend on any Scoped services
- ❌ It was completely stateless
- ❌ It didn't access the database

## ✅ Verification

### Build Result
```
Build succeeded.
    0 Warning(s)
    0 Error(s)
```

### Service Registrations (Final)
```csharp
// All services properly scoped
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ILinkService, LinkService>();
builder.Services.AddScoped<IAnalyticsService, AnalyticsService>();
builder.Services.AddScoped<ShortCodeGenerator>();
```

## 🚀 Ready to Run

The backend now starts successfully without DI errors!

```bash
cd backend/LinkExpiry.API
dotnet run
```

Expected output:
```
[INF] LinkExpiry API starting...
[INF] Environment: Development
[INF] Frontend URL: http://localhost:5173
Now listening on: https://localhost:7001
```

---

**Date**: October 17, 2025
**Status**: ✅ Fixed
**Build**: 0 Errors, 0 Warnings
