# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**LinkExpiry** is a production-ready SaaS platform for creating expiring links (like bit.ly with automatic expiration).

**Tech Stack:**
- Backend: .NET Core 8 Web API with C#
- Database: PostgreSQL with Entity Framework Core
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- Authentication: Custom JWT implementation (access + refresh tokens)
- Deployment Target: Azure (App Service + Static Web Apps + PostgreSQL Flexible Server)

**Key Features:**
- Create short links that expire after X days or Y views
- Password-protected links
- Real-time analytics and click tracking
- Multi-tier plans (FREE, STARTER, PRO, ENTERPRISE)
- Background expiry checking service

## Project Status

**Completed (60%):**
- ✅ Database schema with optimized indexes
- ✅ All entity models and DTOs
- ✅ Repository pattern and Unit of Work
- ✅ Authentication service with JWT
- ✅ Short code generator with collision detection
- ✅ Project configuration files

**In Progress (40%):**
- ⏳ Controllers (Auth, Links, Redirect, Analytics)
- ⏳ LinkService and AnalyticsService
- ⏳ Middleware (exception handling, rate limiting)
- ⏳ Program.cs
- ⏳ Frontend (React app)

See `PROJECT_STATUS.md` for detailed progress and `BUILD_GUIDE.md` for implementation details.

## Development Commands

### Database
```bash
# Run database migrations (PostgreSQL required)
psql -U postgres -d linkexpiry -f database/00_initial_schema.sql

# View tables
psql -U postgres -d linkexpiry -c "\dt"
```

### Backend (.NET Core 8)
```bash
# Navigate to backend
cd backend/LinkExpiry.API

# Restore packages
dotnet restore

# Build project
dotnet build

# Run in development mode
dotnet run

# Run with hot reload
dotnet watch run

# Run tests (when created)
dotnet test

# Create Entity Framework migration
dotnet ef migrations add MigrationName

# Update database with migrations
dotnet ef database update

# Publish for production
dotnet publish -c Release -o ./publish
```

**Backend runs on:** `https://localhost:7001` (HTTPS) or `http://localhost:5000` (HTTP)

**Swagger UI:** `https://localhost:7001/swagger`

### Frontend (React + Vite)
```bash
# Navigate to frontend (when created)
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npm run type-check

# Lint
npm run lint
```

**Frontend runs on:** `http://localhost:5173`

## Architecture

### Backend Architecture

**Layered Architecture Pattern:**
```
Controllers (API endpoints)
    ↓
Services (Business logic)
    ↓
Repositories (Data access)
    ↓
Entity Framework Core
    ↓
PostgreSQL Database
```

**Key Components:**

1. **Models Layer** (`Models/`)
   - `Entities/` - Database entities (User, Link, Click)
   - `DTOs/` - Data transfer objects for API requests/responses
   - `Responses/` - Standardized API response wrappers

2. **Data Layer** (`Data/`)
   - `AppDbContext.cs` - EF Core context
   - `Repositories/` - Generic repository pattern
   - `UnitOfWork.cs` - Transaction management

3. **Services Layer** (`Services/`)
   - `AuthService` - JWT authentication, user registration/login
   - `ShortCodeGenerator` - Base62 encoding with collision detection
   - `LinkService` - Link CRUD operations and business logic (to be completed)
   - `AnalyticsService` - Stats aggregation (to be completed)
   - `ExpiryCheckerService` - Background task for checking expired links (to be completed)

4. **Controllers Layer** (`Controllers/`)
   - `AuthController` - /api/auth/* endpoints
   - `LinksController` - /api/links/* endpoints
   - `RedirectController` - /{shortCode} redirect endpoint (CRITICAL - must be < 50ms)
   - `AnalyticsController` - /api/analytics/* endpoints

5. **Middleware** (`Middleware/`)
   - Exception handling
   - Rate limiting (100 req/min per IP)
   - CORS configuration

### Database Schema

**Tables:**
- `users` - User accounts with plan type and subscription status
- `links` - Short links with expiry conditions (time/views/both)
- `clicks` - Analytics data for each link access

**Critical Indexes:**
- `idx_links_short_code` - For fast redirect lookups (most important!)
- `idx_links_user_id` - For user's links queries
- `idx_links_expires_at` - For expiry checking
- `idx_clicks_link_id` - For analytics queries

**Database Functions:**
- `increment_link_view(short_code)` - Atomic view increment with expiry check
- `find_expired_links()` - Batch expiry checking
- `reset_monthly_link_counts()` - Reset usage limits monthly

### Frontend Architecture (Planned)

**Component Structure:**
```
src/
├── components/
│   ├── ui/ (shadcn components - Button, Card, Table, etc.)
│   ├── layout/ (Navbar, Sidebar, Footer)
│   └── shared/ (CopyButton, QRCode, PasswordInput)
├── pages/
│   ├── Landing.tsx - Public homepage
│   ├── Login.tsx / Register.tsx - Authentication
│   ├── Dashboard.tsx - User dashboard with links table
│   ├── CreateLink.tsx - Link creation form
│   ├── LinkAnalytics.tsx - Detailed analytics for a link
│   ├── Settings.tsx - User settings
│   └── Expired.tsx - Expired link page
├── contexts/
│   └── AuthContext.tsx - Global auth state
├── services/
│   └── api.ts - Axios client with interceptors
└── hooks/
    ├── useAuth.ts
    ├── useLinks.ts
    └── useAnalytics.ts
```

## Critical Implementation Notes

### 1. Redirect Endpoint Performance

**Target: < 50ms response time**

The redirect endpoint at `GET /{shortCode}` is THE most critical part of the application. Implementation requirements:

- Use PostgreSQL function `increment_link_view()` for atomic operations
- Log clicks asynchronously (fire-and-forget pattern)
- Return 302 redirect immediately
- Handle race conditions (multiple simultaneous clicks)
- Cache database connection
- Minimize allocations

### 2. Short Code Generation

- **Format:** 7 characters Base62 (0-9, a-z, A-Z)
- **Collisions:** Check database before returning
- **Profanity:** Filter blacklisted words
- **Unique:** Retry up to 3 times on collision
- **Total combinations:** 62^7 = 3.5 trillion

### 3. JWT Authentication

- **Access Token:** 1 hour expiration
- **Refresh Token:** 7 days expiration
- **Algorithm:** HMAC-SHA256
- **Storage:** Access token in memory, refresh token in httpOnly cookie
- **Claims:** User ID, email, plan type

### 4. Rate Limiting

- **Global:** 100 requests/minute per IP
- **Authenticated:** 1000 requests/hour per user
- **Redirect endpoint:** Unlimited (this is the product!)

### 5. Plan Limits

Configured in `appsettings.json`:
- **FREE:** 10 links/month, 100 views/link, 7 days analytics
- **STARTER:** 100 links/month, 10K views/link, 30 days analytics
- **PRO:** 1000 links/month, 100K views/link, 90 days analytics
- **ENTERPRISE:** Unlimited

## Security

**Password Hashing:**
- Algorithm: BCrypt
- Work factor: 11 (default in BCrypt.Net)
- Never store plain text passwords

**JWT Security:**
- Secret key: Minimum 32 characters (configured in appsettings.json)
- Issuer and Audience validation
- Token expiration enforced
- Refresh token rotation on use

**SQL Injection Prevention:**
- All queries use parameterized statements
- Entity Framework Core handles this automatically
- Direct SQL only in database functions (already parameterized)

**CORS:**
- Development: Allow localhost:5173
- Production: Allow only frontend domain
- Credentials: true (for httpOnly cookies)

**Input Validation:**
- All DTOs have validation attributes
- Model state checked in controllers
- URL validation for original_url
- Email validation for registration

## Testing

**Unit Tests (to be created):**
- ShortCodeGenerator collision handling
- AuthService JWT generation
- LinkService expiry logic

**Integration Tests (to be created):**
- RedirectController end-to-end
- Link creation with database
- Analytics aggregation

**Load Testing:**
```bash
# Test redirect endpoint performance
ab -n 1000 -c 10 https://localhost:7001/abc1234
```

**Target:** 95th percentile < 50ms

## Deployment

### Local Development

1. Install PostgreSQL
2. Run database schema: `psql -U postgres -f database/00_initial_schema.sql`
3. Update connection string in `appsettings.Development.json`
4. Generate JWT secret (32+ chars) and update `appsettings.json`
5. Run backend: `dotnet run`
6. Access Swagger: `https://localhost:7001/swagger`

### Azure Production

**Resources needed:**
- Azure App Service (B1 tier, Linux, .NET 8)
- Azure Database for PostgreSQL (Flexible Server, B1ms tier)
- Azure Static Web Apps (Free tier for frontend)

**Environment Variables (App Service):**
```
ConnectionStrings__DefaultConnection=<postgres-connection-string>
JwtSettings__SecretKey=<secure-random-string>
AppSettings__BaseUrl=<backend-url>
AppSettings__FrontendUrl=<frontend-url>
```

**Deployment:**
```bash
# Backend
dotnet publish -c Release
# Deploy zip to App Service

# Frontend
npm run build
# Deploy to Static Web Apps via GitHub Actions
```

## Monitoring

**Serilog** configured for structured logging:
- Development: Console + File
- Production: Console + File + Application Insights (optional)

**Key Metrics to Monitor:**
- Redirect response time (p50, p95, p99)
- Database query performance
- JWT token refresh rate
- Link creation rate by plan
- Error rate and types

## Common Issues

**Entity Framework can't find tables:**
- Ensure column names in C# entities match database (snake_case)
- Check connection string is correct
- Verify PostgreSQL is running

**JWT validation fails:**
- Check Issuer, Audience, SecretKey match in appsettings.json
- Verify token hasn't expired
- Check token format in Authorization header: "Bearer {token}"

**CORS errors:**
- Verify frontend URL in CORS policy
- Check WithOrigins() matches exactly (no trailing slash)
- Ensure AllowCredentials() is set

**Slow redirects (> 100ms):**
- Check database indexes with EXPLAIN ANALYZE
- Verify connection pooling is enabled
- Consider caching hot links in Redis

## Resources

- **See BUILD_GUIDE.md** for detailed implementation instructions
- **See PROJECT_STATUS.md** for current progress
- **Database schema:** `database/00_initial_schema.sql`

## Next Steps for Development

1. Complete Program.cs with service registration
2. Build all controllers (Auth, Links, Redirect, Analytics)
3. Implement LinkService and AnalyticsService
4. Add exception handling middleware
5. Create React frontend
6. End-to-end testing
7. Deploy to Azure
