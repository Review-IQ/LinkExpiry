# LinkExpiry - Azure Deployment Guide

Complete step-by-step guide to deploy LinkExpiry to Azure for production use.

## 📋 Prerequisites

Before starting, ensure you have:
- ✅ [Azure Account](https://azure.microsoft.com/free/) (Free tier works for testing)
- ✅ [Azure CLI](https://docs.microsoft.com/cli/azure/install-azure-cli) installed
- ✅ [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- ✅ [Node.js 18+](https://nodejs.org/)
- ✅ Git for version control

## 💰 Cost Estimate

**Monthly costs for production deployment:**

| Service | Tier | Cost |
|---------|------|------|
| App Service (Backend) | B1 Basic | ~$13/month |
| PostgreSQL Flexible Server | B1ms | ~$12/month |
| Static Web App (Frontend) | Free | $0 |
| **Total** | | **~$25/month** |

For development/testing, you can use lower tiers or free credits.

---

## 🗄️ Part 1: Deploy PostgreSQL Database

### 1.1 Create Resource Group

```bash
# Login to Azure
az login

# Create resource group
az group create \
  --name linkexpiry-rg \
  --location eastus
```

### 1.2 Create PostgreSQL Server

```bash
# Create PostgreSQL Flexible Server
az postgres flexible-server create \
  --resource-group linkexpiry-rg \
  --name linkexpiry-db \
  --location eastus \
  --admin-user linkadmin \
  --admin-password 'YourSecurePassword123!' \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --version 15 \
  --public-access 0.0.0.0
```

**Important:** Replace `YourSecurePassword123!` with a strong password and save it securely.

### 1.3 Configure Firewall Rules

```bash
# Allow Azure services
az postgres flexible-server firewall-rule create \
  --resource-group linkexpiry-rg \
  --name linkexpiry-db \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Allow your IP for initial setup (replace with your IP)
az postgres flexible-server firewall-rule create \
  --resource-group linkexpiry-rg \
  --name linkexpiry-db \
  --rule-name AllowMyIP \
  --start-ip-address YOUR_IP_ADDRESS \
  --end-ip-address YOUR_IP_ADDRESS
```

### 1.4 Run Database Schema

```bash
# Get connection string
az postgres flexible-server show-connection-string \
  --server-name linkexpiry-db \
  --database-name postgres \
  --admin-user linkadmin

# Connect using psql (install if needed)
psql "host=linkexpiry-db.postgres.database.azure.com port=5432 dbname=postgres user=linkadmin password=YourSecurePassword123! sslmode=require"

# Create database
CREATE DATABASE linkexpiry;

# Exit and reconnect to linkexpiry database
\q

psql "host=linkexpiry-db.postgres.database.azure.com port=5432 dbname=linkexpiry user=linkadmin password=YourSecurePassword123! sslmode=require"

# Run schema from your local file
\i C:/myStuff/LinkExpiry/database/00_initial_schema.sql

# Verify tables
\dt

# Exit
\q
```

**Connection String for later use:**
```
Host=linkexpiry-db.postgres.database.azure.com;Database=linkexpiry;Username=linkadmin;Password=YourSecurePassword123!;SslMode=Require
```

---

## 🖥️ Part 2: Deploy Backend (.NET API)

### 2.1 Update Configuration

Edit `backend/LinkExpiry.API/appsettings.Production.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=linkexpiry-db.postgres.database.azure.com;Database=linkexpiry;Username=linkadmin;Password=YourSecurePassword123!;SslMode=Require"
  },
  "JwtSettings": {
    "SecretKey": "YOUR_SUPER_SECRET_JWT_KEY_MINIMUM_32_CHARACTERS_LONG",
    "Issuer": "LinkExpiry",
    "Audience": "LinkExpiryUsers",
    "AccessTokenExpirationMinutes": 60,
    "RefreshTokenExpirationDays": 7
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "Cors": {
    "AllowedOrigins": [
      "https://YOUR_STATIC_WEB_APP_URL.azurestaticapps.net"
    ]
  }
}
```

**Generate JWT Secret Key:**
```bash
# On Windows (PowerShell)
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# On Linux/Mac
openssl rand -base64 32
```

### 2.2 Create App Service

```bash
# Create App Service Plan
az appservice plan create \
  --name linkexpiry-plan \
  --resource-group linkexpiry-rg \
  --location eastus \
  --sku B1 \
  --is-linux

# Create Web App
az webapp create \
  --name linkexpiry-api \
  --resource-group linkexpiry-rg \
  --plan linkexpiry-plan \
  --runtime "DOTNETCORE:8.0"
```

### 2.3 Configure App Settings

```bash
# Set connection string
az webapp config connection-string set \
  --name linkexpiry-api \
  --resource-group linkexpiry-rg \
  --connection-string-type PostgreSQL \
  --settings DefaultConnection="Host=linkexpiry-db.postgres.database.azure.com;Database=linkexpiry;Username=linkadmin;Password=YourSecurePassword123!;SslMode=Require"

# Set JWT secret
az webapp config appsettings set \
  --name linkexpiry-api \
  --resource-group linkexpiry-rg \
  --settings JwtSettings__SecretKey="YOUR_SUPER_SECRET_JWT_KEY_MINIMUM_32_CHARACTERS_LONG"

# Enable HTTPS only
az webapp update \
  --name linkexpiry-api \
  --resource-group linkexpiry-rg \
  --https-only true
```

### 2.4 Deploy Backend Code

**Option A: Using Azure CLI**
```bash
cd backend/LinkExpiry.API

# Build for production
dotnet publish -c Release -o ./publish

# Create deployment package
cd publish
zip -r ../deploy.zip .
cd ..

# Deploy
az webapp deployment source config-zip \
  --resource-group linkexpiry-rg \
  --name linkexpiry-api \
  --src deploy.zip
```

**Option B: Using Git Deployment**
```bash
# Configure local git deployment
az webapp deployment source config-local-git \
  --name linkexpiry-api \
  --resource-group linkexpiry-rg

# Get deployment URL
az webapp deployment list-publishing-credentials \
  --name linkexpiry-api \
  --resource-group linkexpiry-rg \
  --query scmUri \
  --output tsv

# Add Azure remote
cd backend/LinkExpiry.API
git init
git add .
git commit -m "Initial deployment"
git remote add azure <DEPLOYMENT_URL>
git push azure master
```

### 2.5 Verify Backend Deployment

```bash
# Get the API URL
az webapp show \
  --name linkexpiry-api \
  --resource-group linkexpiry-rg \
  --query defaultHostName \
  --output tsv
```

Visit: `https://linkexpiry-api.azurewebsites.net/swagger` to test the API.

---

## 🌐 Part 3: Deploy Frontend (React App)

### 3.1 Update Frontend Configuration

Edit `frontend/.env.production`:

```bash
VITE_API_URL=https://linkexpiry-api.azurewebsites.net
```

### 3.2 Build Frontend

```bash
cd frontend

# Install dependencies (including qrcode)
npm install

# Build for production
npm run build
```

This creates a `dist/` folder with optimized static files.

### 3.3 Create Static Web App

```bash
# Create Static Web App
az staticwebapp create \
  --name linkexpiry-frontend \
  --resource-group linkexpiry-rg \
  --location "eastus2" \
  --sku Free
```

### 3.4 Deploy Frontend

**Option A: Using Azure Static Web Apps CLI**
```bash
# Install SWA CLI
npm install -g @azure/static-web-apps-cli

# Get deployment token
az staticwebapp secrets list \
  --name linkexpiry-frontend \
  --resource-group linkexpiry-rg \
  --query "properties.apiKey" \
  --output tsv

# Deploy
swa deploy ./dist \
  --deployment-token <YOUR_DEPLOYMENT_TOKEN>
```

**Option B: Using GitHub Actions (Recommended)**

1. Create GitHub repository for your code
2. Push code to GitHub
3. In Azure Portal, go to your Static Web App
4. Click "GitHub" under "Deployment"
5. Authorize GitHub and select your repository
6. Configure build settings:
   - **App location:** `/frontend`
   - **Api location:** (leave empty)
   - **Output location:** `dist`

GitHub will automatically deploy on every push to main branch.

### 3.5 Configure Custom Domain (Optional)

```bash
# Add custom domain
az staticwebapp hostname set \
  --name linkexpiry-frontend \
  --resource-group linkexpiry-rg \
  --hostname www.yourdomain.com
```

Then add CNAME record in your DNS:
```
CNAME: www → <static-web-app-url>.azurestaticapps.net
```

---

## 🔧 Part 4: Post-Deployment Configuration

### 4.1 Update Backend CORS

Now that you have your Static Web App URL, update the backend CORS settings:

```bash
# Get your Static Web App URL
az staticwebapp show \
  --name linkexpiry-frontend \
  --resource-group linkexpiry-rg \
  --query "defaultHostname" \
  --output tsv

# Update CORS in backend appsettings.Production.json
# Then redeploy backend
```

### 4.2 Configure Application Insights (Optional)

```bash
# Create Application Insights
az monitor app-insights component create \
  --app linkexpiry-insights \
  --location eastus \
  --resource-group linkexpiry-rg

# Get instrumentation key
az monitor app-insights component show \
  --app linkexpiry-insights \
  --resource-group linkexpiry-rg \
  --query instrumentationKey \
  --output tsv

# Add to backend app settings
az webapp config appsettings set \
  --name linkexpiry-api \
  --resource-group linkexpiry-rg \
  --settings APPLICATIONINSIGHTS_CONNECTION_STRING="InstrumentationKey=<YOUR_KEY>"
```

### 4.3 Set Up SSL Certificates

Both App Service and Static Web Apps provide free SSL certificates automatically:

```bash
# Enable HTTPS redirect (if not already done)
az webapp update \
  --name linkexpiry-api \
  --resource-group linkexpiry-rg \
  --https-only true
```

---

## 🧪 Part 5: Testing Deployment

### 5.1 Test Backend API

```bash
# Test health endpoint
curl https://linkexpiry-api.azurewebsites.net/health

# Test registration
curl -X POST https://linkexpiry-api.azurewebsites.net/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}'

# Test login
curl -X POST https://linkexpiry-api.azurewebsites.net/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}'
```

### 5.2 Test Frontend

1. Visit your Static Web App URL
2. Register a new user
3. Login
4. Create a link with QR code
5. Test the redirect
6. View analytics

### 5.3 Test Performance

```bash
# Test redirect speed (should be < 50ms)
curl -w "@curl-format.txt" -o /dev/null -s https://linkexpiry-api.azurewebsites.net/<shortcode>

# Create curl-format.txt:
time_total:  %{time_total}s\n
```

---

## 📊 Part 6: Monitoring & Maintenance

### 6.1 View Logs

```bash
# Stream backend logs
az webapp log tail \
  --name linkexpiry-api \
  --resource-group linkexpiry-rg

# Download logs
az webapp log download \
  --name linkexpiry-api \
  --resource-group linkexpiry-rg \
  --log-file logs.zip
```

### 6.2 Scale Resources

**Scale App Service:**
```bash
# Scale up to more powerful tier
az appservice plan update \
  --name linkexpiry-plan \
  --resource-group linkexpiry-rg \
  --sku P1V2

# Scale out (more instances)
az appservice plan update \
  --name linkexpiry-plan \
  --resource-group linkexpiry-rg \
  --number-of-workers 3
```

**Scale Database:**
```bash
az postgres flexible-server update \
  --resource-group linkexpiry-rg \
  --name linkexpiry-db \
  --sku-name Standard_D2s_v3 \
  --tier GeneralPurpose
```

### 6.3 Backup Database

```bash
# Enable automated backups (enabled by default)
az postgres flexible-server show \
  --resource-group linkexpiry-rg \
  --name linkexpiry-db \
  --query backup

# Manual backup
pg_dump "host=linkexpiry-db.postgres.database.azure.com dbname=linkexpiry user=linkadmin password=YourSecurePassword123! sslmode=require" > backup.sql
```

---

## 🚨 Troubleshooting

### Issue: API returning 500 errors

**Solution:**
```bash
# Check logs
az webapp log tail --name linkexpiry-api --resource-group linkexpiry-rg

# Verify connection string
az webapp config connection-string list --name linkexpiry-api --resource-group linkexpiry-rg

# Restart app
az webapp restart --name linkexpiry-api --resource-group linkexpiry-rg
```

### Issue: Frontend can't connect to backend

**Solution:**
1. Check CORS settings in `appsettings.Production.json`
2. Verify API URL in frontend `.env.production`
3. Check browser console for errors
4. Ensure HTTPS is enabled on backend

### Issue: Database connection timeout

**Solution:**
```bash
# Check firewall rules
az postgres flexible-server firewall-rule list \
  --resource-group linkexpiry-rg \
  --name linkexpiry-db

# Verify connection string format
# Should include: SslMode=Require
```

### Issue: JWT tokens not working

**Solution:**
1. Verify `JwtSettings__SecretKey` is set in App Service
2. Ensure secret key is at least 32 characters
3. Check if tokens are being sent in Authorization header
4. Verify issuer and audience match in frontend/backend

---

## 🔐 Security Checklist

Before going live:

- [ ] **JWT Secret** - Generated with secure random generator (32+ chars)
- [ ] **Database Password** - Strong password, stored in Azure Key Vault (optional)
- [ ] **HTTPS Only** - Enabled on both frontend and backend
- [ ] **CORS** - Configured to allow only your frontend domain
- [ ] **Firewall Rules** - Database only accessible from Azure services
- [ ] **SQL Injection** - Using parameterized queries (done by EF Core)
- [ ] **Rate Limiting** - Configured in backend (already set up)
- [ ] **Input Validation** - All DTOs have validation attributes (done)
- [ ] **Error Messages** - Don't expose sensitive information (done)
- [ ] **Dependencies** - Updated to latest secure versions

---

## 💡 Optimization Tips

### 1. Enable Caching

Add Redis cache for hot links:
```bash
az redis create \
  --name linkexpiry-cache \
  --resource-group linkexpiry-rg \
  --location eastus \
  --sku Basic \
  --vm-size c0
```

### 2. Add CDN for Static Assets

```bash
az cdn profile create \
  --name linkexpiry-cdn \
  --resource-group linkexpiry-rg \
  --sku Standard_Microsoft

az cdn endpoint create \
  --name linkexpiry-endpoint \
  --profile-name linkexpiry-cdn \
  --resource-group linkexpiry-rg \
  --origin <your-static-web-app-url>
```

### 3. Configure Auto-scaling

```bash
# Enable autoscaling based on CPU
az monitor autoscale create \
  --resource-group linkexpiry-rg \
  --resource linkexpiry-api \
  --resource-type Microsoft.Web/serverfarms \
  --name autoscale-settings \
  --min-count 1 \
  --max-count 5 \
  --count 2

# Scale rule: CPU > 70%
az monitor autoscale rule create \
  --resource-group linkexpiry-rg \
  --autoscale-name autoscale-settings \
  --condition "Percentage CPU > 70 avg 5m" \
  --scale out 1
```

---

## 📱 Mobile App Integration (Future)

The API is ready for mobile apps:

1. Use the same JWT authentication
2. All endpoints return JSON
3. Include `Authorization: Bearer <token>` header
4. Redirect endpoint works with mobile deep links

Example iOS/Android integration:
```
linkexpiry://link/{shortCode}
```

---

## 🎯 Next Steps

After deployment:

1. **Test thoroughly** - Try all features in production
2. **Set up monitoring** - Application Insights dashboards
3. **Configure alerts** - Get notified of errors
4. **Enable backups** - Database and configuration
5. **Add custom domain** - Professional branding
6. **Set up CI/CD** - Automated deployments with GitHub Actions
7. **Load testing** - Ensure redirect endpoint < 50ms
8. **Security scan** - Use Azure Security Center

---

## 📞 Support Resources

- [Azure Documentation](https://docs.microsoft.com/azure/)
- [.NET Core Deployment](https://docs.microsoft.com/aspnet/core/host-and-deploy/azure-apps/)
- [Static Web Apps Docs](https://docs.microsoft.com/azure/static-web-apps/)
- [PostgreSQL on Azure](https://docs.microsoft.com/azure/postgresql/)

---

## 💰 Cost Optimization

To reduce costs:

1. **Use B-series VMs** - Burstable performance for variable workloads
2. **Reserved Instances** - Save 30-40% with 1-3 year commitment
3. **Auto-shutdown** - Stop dev/test resources when not in use
4. **Monitor usage** - Use Azure Cost Management
5. **Free tier** - Static Web Apps are free (up to 100GB bandwidth/month)

---

**Deployment Complete!** 🎉

Your LinkExpiry platform is now live and ready to handle production traffic!

For questions or issues, check the troubleshooting section or create an issue in the GitHub repository.
