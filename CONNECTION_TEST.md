# Backend-Frontend Connection Guide

## ✅ Current Configuration

### Backend (.NET 8 API)
- **URL**: `https://localhost:7001`
- **CORS Enabled**: Yes, configured to accept requests from `http://localhost:5173`
- **Configuration**: `backend/LinkExpiry.API/appsettings.Development.json`

### Frontend (React + Vite)
- **URL**: `http://localhost:5173`
- **API URL**: `https://localhost:7001` (configured in `.env`)
- **Configuration**: `frontend/.env`

### Solution File
- **Location**: `backend/LinkExpiry.sln`
- **Project**: `LinkExpiry.API`

---

## 🚀 How to Run Both Services

### Option 1: Run Separately (Recommended for Development)

#### Terminal 1 - Backend:
```bash
cd backend/LinkExpiry.API
dotnet run
```

Backend will start at:
- API: `https://localhost:7001`
- Swagger: `https://localhost:7001/swagger`
- Health Check: `https://localhost:7001/health`

#### Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

Frontend will start at:
- App: `http://localhost:5173`

---

### Option 2: Using Visual Studio (Backend) + Terminal (Frontend)

1. Open `backend/LinkExpiry.sln` in Visual Studio
2. Press F5 to run the backend
3. In a terminal, run:
   ```bash
   cd frontend
   npm run dev
   ```

---

## 🧪 Testing the Connection

### 1. Start Backend
```bash
cd backend/LinkExpiry.API
dotnet run
```

You should see:
```
[INF] LinkExpiry API starting...
[INF] Environment: Development
[INF] Frontend URL: http://localhost:5173
Now listening on: https://localhost:7001
```

### 2. Test Backend Endpoints

**Root endpoint:**
```bash
curl https://localhost:7001/
```

Expected response:
```json
{
  "service": "LinkExpiry API",
  "version": "1.0.0",
  "status": "running",
  "docs": "/swagger",
  "health": "/health"
}
```

**Health check:**
```bash
curl https://localhost:7001/health
```

Expected: `Healthy`

**Swagger UI:**
Open browser: `https://localhost:7001/swagger`

### 3. Start Frontend
```bash
cd frontend
npm run dev
```

You should see:
```
VITE v5.4.20  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### 4. Test Frontend Connection

1. Open browser: `http://localhost:5173`
2. Try to register a new user
3. Check browser DevTools Network tab - you should see API requests to `https://localhost:7001/api/auth/register`

---

## 🔧 Configuration Files

### Backend: `backend/LinkExpiry.API/appsettings.Development.json`
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=linkexpiry_dev;Username=postgres;Password=postgres"
  },
  "AppSettings": {
    "BaseUrl": "https://localhost:7001",
    "FrontendUrl": "http://localhost:5173"
  }
}
```

### Frontend: `frontend/.env`
```
VITE_API_URL=https://localhost:7001
```

---

## ⚠️ Common Issues

### Issue 1: CORS Error
**Error**: `Access to XMLHttpRequest blocked by CORS policy`

**Solution**:
- Ensure backend `appsettings.Development.json` has correct `FrontendUrl`
- Restart backend after changing config
- Check Program.cs line 87-97 for CORS configuration

### Issue 2: SSL Certificate Error
**Error**: `NET::ERR_CERT_AUTHORITY_INVALID`

**Solution**:
- Trust the .NET development certificate:
  ```bash
  dotnet dev-certs https --trust
  ```

### Issue 3: Connection Refused
**Error**: `Failed to fetch` or `ERR_CONNECTION_REFUSED`

**Solution**:
- Ensure backend is running on `https://localhost:7001`
- Check if port 7001 is available
- Check firewall settings

### Issue 4: Database Connection Failed
**Error**: `Npgsql.NpgsqlException: Connection refused`

**Solution**:
- Ensure PostgreSQL is running
- Run database schema:
  ```bash
  psql -U postgres -d linkexpiry_dev -f database/00_initial_schema.sql
  ```
- Check connection string in `appsettings.Development.json`

---

## 📊 API Endpoints Available

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

### Links
- `POST /api/links` - Create new link
- `GET /api/links` - Get user's links (paginated)
- `GET /api/links/{id}` - Get single link
- `PUT /api/links/{id}` - Update link
- `DELETE /api/links/{id}` - Delete link
- `GET /{shortCode}` - Redirect to original URL ⚡

### Analytics
- `GET /api/analytics/links/{id}` - Get link analytics
- `GET /api/analytics/dashboard` - Get dashboard stats

### User
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `PUT /api/user/password` - Change password

---

## 🎯 Quick Verification Checklist

- [ ] Backend builds without errors: `cd backend/LinkExpiry.API && dotnet build`
- [ ] Frontend builds without errors: `cd frontend && npm run build`
- [ ] PostgreSQL is running
- [ ] Database schema is loaded
- [ ] Backend runs on `https://localhost:7001`
- [ ] Swagger UI accessible at `https://localhost:7001/swagger`
- [ ] Frontend runs on `http://localhost:5173`
- [ ] Can register a new user from frontend
- [ ] Can login from frontend
- [ ] Can create a link from dashboard

---

## 🎉 You're Ready!

Both services are properly connected and configured. The frontend will automatically connect to the backend API at `https://localhost:7001`.

**Next Steps:**
1. Run both services
2. Register a new user
3. Create your first expiring link!
4. Check out the analytics dashboard

For deployment to production, see `DEPLOYMENT_GUIDE.md`.
