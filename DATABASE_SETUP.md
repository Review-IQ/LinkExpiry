# PostgreSQL Database Setup

## ❌ Error: Database Connection Failed

```
Failed to connect to 127.0.0.1:5432
No connection could be made because the target machine actively refused it.
```

**Cause**: PostgreSQL is not running or not installed.

---

## 🚀 Quick Fix

### Option 1: Start PostgreSQL Service (If Already Installed)

#### Windows:
```powershell
# Check if PostgreSQL service exists
Get-Service -Name postgresql*

# Start the service
Start-Service postgresql-x64-15  # Or whatever version you have

# Verify it's running
Get-Service -Name postgresql*
```

OR use Services app:
1. Press `Win + R`
2. Type `services.msc`
3. Find "postgresql" service
4. Right-click → Start

#### Linux/WSL:
```bash
# Start PostgreSQL
sudo service postgresql start

# Check status
sudo service postgresql status
```

---

### Option 2: Install PostgreSQL (If Not Installed)

#### Windows:

**Download & Install:**
1. Go to: https://www.postgresql.org/download/windows/
2. Download PostgreSQL 15 or later
3. Run installer
4. **IMPORTANT**: Remember the password you set for `postgres` user!

**Default Installation:**
- Port: `5432`
- User: `postgres`
- Password: (what you set during install)

#### Linux/WSL:
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start service
sudo service postgresql start

# Set password for postgres user
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
```

#### macOS:
```bash
# Using Homebrew
brew install postgresql@15
brew services start postgresql@15
```

---

## 📝 Create Database & Schema

Once PostgreSQL is running:

### Step 1: Create Database

#### Windows PowerShell:
```powershell
# Connect to PostgreSQL
psql -U postgres

# In psql prompt, create database:
CREATE DATABASE linkexpiry_dev;

# Exit
\q
```

#### Bash/WSL:
```bash
# Create database
sudo -u postgres createdb linkexpiry_dev

# OR using psql
sudo -u postgres psql -c "CREATE DATABASE linkexpiry_dev;"
```

### Step 2: Load Schema

```bash
# Navigate to project root
cd C:\myStuff\LinkExpiry

# Load schema
psql -U postgres -d linkexpiry_dev -f database/00_initial_schema.sql
```

**Expected Output:**
```
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE INDEX
CREATE INDEX
CREATE FUNCTION
...
```

### Step 3: Verify Database

```bash
# Connect to database
psql -U postgres -d linkexpiry_dev

# List tables
\dt

# Expected tables:
# users
# links
# clicks
```

**Exit psql**: Type `\q` and press Enter

---

## 🔧 Update Connection String (If Different Password)

If you set a different password during PostgreSQL installation:

**File**: `backend/LinkExpiry.API/appsettings.Development.json`

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=linkexpiry_dev;Username=postgres;Password=YOUR_PASSWORD_HERE"
  }
}
```

**Replace** `YOUR_PASSWORD_HERE` with your actual PostgreSQL password.

---

## ✅ Verify PostgreSQL is Running

### Test Connection:

#### PowerShell:
```powershell
# Test connection
psql -U postgres -c "SELECT version();"
```

#### Bash:
```bash
# Test connection
psql -U postgres -c "SELECT version();"
```

**Expected Output:**
```
                                                 version
---------------------------------------------------------------------------------------------------------
 PostgreSQL 15.x on x86_64-pc-windows-msvc, compiled by Visual C++ build 1914, 64-bit
(1 row)
```

**If this works**: PostgreSQL is running and accessible!

---

## 🔍 Troubleshooting

### Issue 1: "psql: command not found"

**Cause**: PostgreSQL bin folder not in PATH

**Solution (Windows)**:
1. Find PostgreSQL installation (usually `C:\Program Files\PostgreSQL\15\bin`)
2. Add to PATH:
   - Right-click "This PC" → Properties
   - Advanced system settings
   - Environment Variables
   - Edit "Path"
   - Add: `C:\Program Files\PostgreSQL\15\bin`
3. Restart terminal

### Issue 2: "password authentication failed"

**Cause**: Wrong password

**Solution**:
```bash
# Reset password (as administrator)
psql -U postgres
ALTER USER postgres PASSWORD 'postgres';
```

Then update `appsettings.Development.json` with the new password.

### Issue 3: Port 5432 already in use

**Cause**: Another service using port 5432

**Solution**:
```powershell
# Find what's using port 5432
netstat -ano | findstr :5432

# Kill the process (use PID from above)
taskkill /PID <PID> /F
```

Or change PostgreSQL port in `postgresql.conf`.

---

## 🎯 Quick Setup Script (Windows PowerShell)

```powershell
# 1. Start PostgreSQL service
Start-Service postgresql-x64-15

# 2. Create database
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -c "CREATE DATABASE linkexpiry_dev;"

# 3. Load schema
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -d linkexpiry_dev -f "C:\myStuff\LinkExpiry\database\00_initial_schema.sql"

# 4. Verify
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -d linkexpiry_dev -c "\dt"

Write-Host "✅ Database setup complete!" -ForegroundColor Green
```

---

## 🎯 Quick Setup Script (Linux/WSL)

```bash
#!/bin/bash

# 1. Start PostgreSQL
sudo service postgresql start

# 2. Create database
sudo -u postgres createdb linkexpiry_dev

# 3. Load schema
sudo -u postgres psql -d linkexpiry_dev -f database/00_initial_schema.sql

# 4. Verify
sudo -u postgres psql -d linkexpiry_dev -c "\dt"

echo "✅ Database setup complete!"
```

---

## 📋 Setup Checklist

- [ ] PostgreSQL installed (version 15+)
- [ ] PostgreSQL service running
- [ ] Can connect with `psql -U postgres`
- [ ] Database `linkexpiry_dev` created
- [ ] Schema loaded from `00_initial_schema.sql`
- [ ] Tables exist (users, links, clicks)
- [ ] Connection string in `appsettings.Development.json` is correct
- [ ] Backend can connect (no more connection errors)

---

## 🚀 After Database Setup

Once database is running:

1. **Restart backend**:
   ```bash
   cd backend/LinkExpiry.API
   dotnet run
   ```

2. **Check logs** for successful migration:
   ```
   [INF] Database migrated successfully
   [INF] LinkExpiry API starting...
   Now listening on: https://localhost:34049
   ```

3. **Test registration** from frontend

---

## 💡 Alternative: Use Docker PostgreSQL

If you prefer Docker:

```bash
# Run PostgreSQL in Docker
docker run --name linkexpiry-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=linkexpiry_dev \
  -p 5432:5432 \
  -d postgres:15

# Load schema
docker exec -i linkexpiry-postgres psql -U postgres -d linkexpiry_dev < database/00_initial_schema.sql
```

**No installation needed** - just Docker!

---

**Date**: October 17, 2025
**Status**: ⚠️ Database Setup Required
**Next Step**: Start PostgreSQL and create database
