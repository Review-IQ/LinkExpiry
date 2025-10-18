# LinkExpiry - Complete Build Guide

## Project Overview

LinkExpiry is a production-ready SaaS platform for creating expiring links (like bit.ly with expiration).

**Tech Stack:**
- Backend: .NET Core 8 Web API + PostgreSQL
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- Deployment: Azure (App Service + Static Web Apps + PostgreSQL)

## Current Project Status

###  Completed Components

#### Database Layer
- ✅ Complete PostgreSQL schema with indexes (`database/00_initial_schema.sql`)
- ✅ Atomic increment function for view counting
- ✅ Expiry checking functions
- ✅ Proper indexes for performance

#### Backend - Data & Models
- ✅ Entity models (User, Link, Click)
- ✅ DTOs for all operations (Auth, Links, Analytics)
- ✅ API Response wrappers
- ✅ DbContext with Entity Framework Core
- ✅ Repository pattern implementation
- ✅ Unit of Work pattern

#### Backend - Services
- ✅ Authentication Service with JWT
- ✅ Short Code Generator with collision detection
- ⏳ Link Service (needs completion)
- ⏳ Analytics Service (needs completion)
- ⏳ Expiry Checker Background Service (needs completion)

#### Backend - Configuration
- ✅ .csproj with all dependencies
- ✅ appsettings.json with configuration
- ✅ JWT settings
- ✅ Rate limiting configuration
- ✅ Plan limits configuration

### ⏳ Components Still Needed

#### Backend - Controllers
- ❌ AuthController (register, login, refresh)
- ❌ LinksController (CRUD operations)
- ❌ RedirectController (critical - main redirect logic)
- ❌ AnalyticsController (stats and dashboard)
- ❌ UserController (profile, usage)

#### Backend - Middleware
- ❌ ExceptionHandlingMiddleware
- ❌ Rate Limiting setup

#### Backend - Services
- ❌ LinkService (complete implementation)
- ❌ AnalyticsService
- ❌ ExpiryCheckerService (background)
- ❌ ClickTrackingService

#### Backend - Main
- ❌ Program.cs (service registration, middleware pipeline)

#### Frontend - Everything
- ❌ React + Vite setup
- ❌ Tailwind CSS configuration
- ❌ shadcn/ui components
- ❌ All pages (Landing, Dashboard, Analytics, etc.)
- ❌ API client with interceptors
- ❌ Auth context and protected routes

## Next Steps - How to Continue

### Option 1: Ask Me to Continue
You can ask me to continue building specific components:

```
"Continue building the backend controllers"
"Build the RedirectController with optimized logic"
"Create the LinkService implementation"
"Build the Program.cs with all service registration"
"Start the frontend React project"
```

### Option 2: Use the Files as Templates
The files I've created can serve as templates. Here's what you have:

**Database:**
- Run `database/00_initial_schema.sql` on your PostgreSQL database

**Backend Structure:**
```
backend/LinkExpiry.API/
├── Models/
│   ├── Entities/ (✅ Complete)
│   ├── DTOs/ (✅ Complete)
│   └── Responses/ (✅ Complete)
├── Data/
│   ├── AppDbContext.cs (✅ Complete)
│   ├── UnitOfWork.cs (✅ Complete)
│   └── Repositories/ (✅ Complete)
├── Services/
│   ├── AuthService.cs (✅ Complete)
│   ├── ShortCodeGenerator.cs (✅ Complete)
│   ├── ILinkService.cs (❌ Need to create)
│   └── LinkService.cs (❌ Need to create)
├── Controllers/ (❌ All need to be created)
├── Middleware/ (❌ All need to be created)
└── Program.cs (❌ Need to create)
```

### Option 3: Build It Yourself Using This Guide

Here's what you need to do for each remaining component:

## Critical Implementation Details

### 1. RedirectController - THE MOST IMPORTANT ENDPOINT

This is the core of the application. Performance target: < 50ms

```csharp
// Pseudo-code for redirect logic:
[HttpGet("/{shortCode}")]
public async Task<IActionResult> Redirect(string shortCode)
{
    // 1. Call database function increment_link_view(shortCode)
    //    - This handles expiry checking + view increment atomically
    //    - Returns: isValid, originalUrl, requiresPassword, customMessage

    // 2. If !isValid → Return View("Expired") with custom message

    // 3. If requiresPassword → Return View("PasswordProtected")

    // 4. Log click asynchronously (don't await - fire and forget)
    //    - Extract IP, User-Agent, Referrer from request
    //    - Parse device type, browser
    //    - Insert into clicks table

    // 5. Return Redirect(originalUrl) with 302 status
}
```

**Key Points:**
- Use the PostgreSQL function `increment_link_view()` - it's already created in the schema
- Log clicks asynchronously to not block the redirect
- Cache-Control headers to prevent caching
- Handle race conditions (multiple simultaneous clicks)

### 2. Program.cs Structure

```csharp
var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ILinkService, LinkService>();
builder.Services.AddSingleton<ShortCodeGenerator>();

// JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => {
        // Configure JWT validation
    });

// Rate Limiting
builder.Services.AddMemoryCache();
builder.Services.Configure<IpRateLimitOptions>(
    builder.Configuration.GetSection("IpRateLimiting"));

// CORS
builder.Services.AddCors(options => {
    options.AddPolicy("AllowFrontend", policy => {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Background Services
builder.Services.AddHostedService<ExpiryCheckerService>();

var app = builder.Build();

// Middleware pipeline
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseIpRateLimiting();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
```

### 3. LinkService Implementation

Key methods needed:
- `CreateLinkAsync(userId, request)` - Validate, generate code, check limits
- `GetUserLinksAsync(userId, pageNumber, pageSize)` - Paginated list
- `GetLinkByIdAsync(linkId, userId)` - Single link details
- `UpdateLinkAsync(linkId, userId, request)` - Update title, message, etc.
- `DeleteLinkAsync(linkId, userId)` - Soft delete (set is_active = false)
- `ValidateLinkPasswordAsync(shortCode, password)` - For password-protected links

### 4. Frontend Structure

```
frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── ui/ (shadcn components)
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   └── shared/
│   │       ├── CopyButton.tsx
│   │       ├── QRCode.tsx
│   │       └── PasswordInput.tsx
│   ├── pages/
│   │   ├── Landing.tsx
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Dashboard.tsx
│   │   ├── CreateLink.tsx
│   │   ├── LinkAnalytics.tsx
│   │   ├── Settings.tsx
│   │   └── Expired.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useLinks.ts
│   │   └── useAnalytics.ts
│   ├── services/
│   │   └── api.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── formatters.ts
│   │   └── validators.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## Database Setup

1. Install PostgreSQL (or use Azure PostgreSQL)
2. Create database: `CREATE DATABASE linkexpiry;`
3. Run migration: `psql -U postgres -d linkexpiry -f database/00_initial_schema.sql`
4. Verify tables: `\dt` in psql

## Backend Setup

1. Navigate to backend directory
2. Update connection string in `appsettings.json`
3. Generate a secure JWT secret key (minimum 32 characters)
4. Run: `dotnet restore`
5. Run: `dotnet ef migrations add Initial` (after creating remaining files)
6. Run: `dotnet ef database update`
7. Run: `dotnet run`
8. Test at: `https://localhost:7001/swagger`

## Frontend Setup

1. Create React app: `npm create vite@latest frontend -- --template react-ts`
2. Install dependencies:
```bash
npm install react-router-dom axios @tanstack/react-query zustand
npm install -D tailwindcss postcss autoprefixer
npm install recharts react-hook-form zod @hookform/resolvers
npm install date-fns clsx tailwind-merge
npm install lucide-react
```

3. Initialize Tailwind: `npx tailwindcss init -p`
4. Install shadcn/ui: `npx shadcn-ui@latest init`
5. Add components: `npx shadcn-ui@latest add button card table input`

## Azure Deployment

### Backend (App Service)
```bash
# Create resource group
az group create --name LinkExpiry-RG --location eastus

# Create App Service plan
az appservice plan create --name LinkExpiry-Plan --resource-group LinkExpiry-RG --sku B1 --is-linux

# Create web app
az webapp create --name linkexpiry-api --resource-group LinkExpiry-RG --plan LinkExpiry-Plan --runtime "DOTNETCORE:8.0"

# Configure connection string
az webapp config appsettings set --name linkexpiry-api --resource-group LinkExpiry-RG --settings ConnectionStrings__DefaultConnection="YOUR_POSTGRES_CONNECTION_STRING"

# Deploy
dotnet publish -c Release
cd bin/Release/net8.0/publish
zip -r deploy.zip .
az webapp deployment source config-zip --name linkexpiry-api --resource-group LinkExpiry-RG --src deploy.zip
```

### Frontend (Static Web Apps)
```bash
# Build
npm run build

# Deploy to Azure Static Web Apps (via GitHub Actions)
# See: https://learn.microsoft.com/en-us/azure/static-web-apps/get-started-cli
```

### Database (Azure PostgreSQL)
```bash
az postgres flexible-server create \
  --name linkexpiry-db \
  --resource-group LinkExpiry-RG \
  --location eastus \
  --admin-user dbadmin \
  --admin-password YOUR_SECURE_PASSWORD \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32
```

## Testing Checklist

- [ ] User registration works
- [ ] User login returns JWT token
- [ ] Token refresh works before expiry
- [ ] Create link generates unique short code
- [ ] Redirect works and increments view count
- [ ] Expiry by time works correctly
- [ ] Expiry by views works correctly
- [ ] Password-protected links work
- [ ] Analytics show correct data
- [ ] Dashboard displays user's links
- [ ] Rate limiting blocks excessive requests
- [ ] Background service marks expired links
- [ ] Email notifications sent (if implemented)

## Performance Benchmarks

**Critical Metrics:**
- Redirect endpoint: < 50ms average
- Link creation: < 200ms
- Dashboard load: < 1 second
- Analytics load: < 2 seconds

Use Apache Bench for testing:
```bash
ab -n 1000 -c 10 https://localhost:7001/abc1234
```

## Security Checklist

- [ ] Passwords hashed with BCrypt (work factor 11+)
- [ ] JWT tokens use strong secret (32+ chars)
- [ ] HTTPS only in production
- [ ] CORS configured for frontend domain only
- [ ] Rate limiting enabled
- [ ] SQL injection prevented (parameterized queries)
- [ ] Input validation on all endpoints
- [ ] XSS protection (React handles this)
- [ ] CSRF protection for state-changing operations
- [ ] Sensitive data not logged

## Common Issues & Solutions

**Issue:** Entity Framework can't find tables
**Solution:** Ensure column names in entities match database (lowercase with underscores)

**Issue:** JWT token validation fails
**Solution:** Check Issuer, Audience, and Secret Key match in config

**Issue:** CORS errors in frontend
**Solution:** Ensure backend CORS policy includes frontend URL with correct protocol

**Issue:** Redirect is slow (> 100ms)
**Solution:** Check database indexes, use EXPLAIN ANALYZE on queries

**Issue:** Short code collisions
**Solution:** 7 characters Base62 = 3.5 trillion combinations, collisions are rare

## Monitoring & Logging

**Serilog** is configured for structured logging:
- Console output for development
- File output to `logs/` directory
- Rotate daily, keep 7 days

**Application Insights** for production (add package):
```csharp
builder.Services.AddApplicationInsightsTelemetry();
```

Monitor these metrics:
- Redirect response time (p50, p95, p99)
- Database query performance
- Error rate
- Token refresh rate
- Link creation rate by plan type

## Cost Estimates (Azure)

**Monthly costs for small scale:**
- App Service (B1): ~$13/month
- PostgreSQL (B1ms): ~$12/month
- Static Web App (Free tier): $0/month
- Bandwidth (first 100GB): $0/month

**Total: ~$25/month for up to 10k users**

## Next Development Phases

**Phase 1** (MVP - Current):
- [x] Database schema
- [x] Core backend models
- [ ] Auth controllers
- [ ] Link CRUD controllers
- [ ] Redirect endpoint
- [ ] Basic frontend (login, dashboard, create link)

**Phase 2** (Analytics):
- [ ] Complete analytics service
- [ ] Charts and visualizations
- [ ] Export to CSV
- [ ] Real-time dashboard updates

**Phase 3** (Advanced Features):
- [ ] QR code generation
- [ ] Custom short codes (user-defined)
- [ ] Bulk link creation
- [ ] API keys for developers
- [ ] Webhook notifications
- [ ] Custom domains

**Phase 4** (Monetization):
- [ ] Stripe integration
- [ ] Subscription plans
- [ ] Usage limits enforcement
- [ ] Billing dashboard

**Phase 5** (Scale):
- [ ] Redis caching for hot links
- [ ] CDN for static assets
- [ ] Database read replicas
- [ ] Horizontal scaling

## Resources

- [.NET Core 8 Docs](https://learn.microsoft.com/en-us/aspnet/core/)
- [Entity Framework Core](https://learn.microsoft.com/en-us/ef/core/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [React Docs](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Azure Docs](https://learn.microsoft.com/en-us/azure/)

## Support

For issues with the code I've generated, please ask me specific questions like:
- "Show me how to implement the RedirectController"
- "Create the Program.cs with all services"
- "Build the LinkService implementation"
- "Create the React dashboard page"

I can build each component on demand as you need them!
