# LinkExpiry - Azure Deployment Script (PowerShell)
# This script automates the deployment of LinkExpiry to Azure

$ErrorActionPreference = "Stop"

Write-Host "🚀 LinkExpiry Azure Deployment Script" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$RESOURCE_GROUP = "linkexpiry-rg"
$LOCATION = "eastus"
$DB_NAME = "linkexpiry-db"
$DB_ADMIN = "linkadmin"
$API_NAME = "linkexpiry-api"
$FRONTEND_NAME = "linkexpiry-frontend"
$PLAN_NAME = "linkexpiry-plan"

# Check if Azure CLI is installed
try {
    az --version | Out-Null
}
catch {
    Write-Host "✗ Azure CLI is not installed. Please install it first:" -ForegroundColor Red
    Write-Host "https://docs.microsoft.com/cli/azure/install-azure-cli" -ForegroundColor Yellow
    exit 1
}

# Check if logged in to Azure
try {
    az account show | Out-Null
}
catch {
    Write-Host "⚠ Not logged in to Azure. Please login:" -ForegroundColor Yellow
    az login
}

# Get current subscription
$SUBSCRIPTION = az account show --query name -o tsv
Write-Host "Using subscription: $SUBSCRIPTION" -ForegroundColor Green
Write-Host ""

# Prompt for database password
$DB_PASSWORD = Read-Host "Please enter a secure password for PostgreSQL database" -AsSecureString
$DB_PASSWORD_CONFIRM = Read-Host "Please confirm the password" -AsSecureString

$pwd1 = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($DB_PASSWORD))
$pwd2 = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($DB_PASSWORD_CONFIRM))

if ($pwd1 -ne $pwd2) {
    Write-Host "✗ Passwords do not match!" -ForegroundColor Red
    exit 1
}

if ($pwd1.Length -lt 8) {
    Write-Host "✗ Password must be at least 8 characters long!" -ForegroundColor Red
    exit 1
}

# Generate JWT secret
Write-Host "Generating JWT secret key..." -ForegroundColor Yellow
$JWT_SECRET = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
Write-Host "✓ JWT secret generated" -ForegroundColor Green
Write-Host ""

# Confirm deployment
Write-Host "This script will create the following resources:" -ForegroundColor Yellow
Write-Host "  - Resource Group: $RESOURCE_GROUP"
Write-Host "  - PostgreSQL Server: $DB_NAME"
Write-Host "  - App Service: $API_NAME"
Write-Host "  - Static Web App: $FRONTEND_NAME"
Write-Host ""
Write-Host "Estimated monthly cost: ~`$25/month" -ForegroundColor Yellow
Write-Host ""
$confirm = Read-Host "Continue with deployment? (y/n)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Deployment cancelled." -ForegroundColor Yellow
    exit 0
}

# Step 1: Create Resource Group
Write-Host ""
Write-Host "Step 1/7: Creating Resource Group..." -ForegroundColor Cyan
try {
    az group create --name $RESOURCE_GROUP --location $LOCATION 2>&1 | Out-Null
    Write-Host "✓ Resource group created" -ForegroundColor Green
}
catch {
    Write-Host "⚠ Resource group already exists" -ForegroundColor Yellow
}

# Step 2: Create PostgreSQL Server
Write-Host ""
Write-Host "Step 2/7: Creating PostgreSQL Server (this may take 5-10 minutes)..." -ForegroundColor Cyan
try {
    az postgres flexible-server create `
        --resource-group $RESOURCE_GROUP `
        --name $DB_NAME `
        --location $LOCATION `
        --admin-user $DB_ADMIN `
        --admin-password $pwd1 `
        --sku-name Standard_B1ms `
        --tier Burstable `
        --storage-size 32 `
        --version 15 `
        --public-access 0.0.0.0 `
        --yes 2>&1 | Out-Null
    Write-Host "✓ PostgreSQL server created" -ForegroundColor Green
}
catch {
    Write-Host "✗ Failed to create PostgreSQL server" -ForegroundColor Red
    exit 1
}

# Step 3: Configure Firewall
Write-Host ""
Write-Host "Step 3/7: Configuring database firewall..." -ForegroundColor Cyan
az postgres flexible-server firewall-rule create `
    --resource-group $RESOURCE_GROUP `
    --name $DB_NAME `
    --rule-name AllowAzureServices `
    --start-ip-address 0.0.0.0 `
    --end-ip-address 0.0.0.0 2>&1 | Out-Null
Write-Host "✓ Firewall configured" -ForegroundColor Green

# Step 4: Create Database
Write-Host ""
Write-Host "Step 4/7: Creating linkexpiry database..." -ForegroundColor Cyan
az postgres flexible-server db create `
    --resource-group $RESOURCE_GROUP `
    --server-name $DB_NAME `
    --database-name linkexpiry 2>&1 | Out-Null
Write-Host "✓ Database created" -ForegroundColor Green

# Step 5: Create App Service
Write-Host ""
Write-Host "Step 5/7: Creating App Service for backend API..." -ForegroundColor Cyan
az appservice plan create `
    --name $PLAN_NAME `
    --resource-group $RESOURCE_GROUP `
    --location $LOCATION `
    --sku B1 `
    --is-linux 2>&1 | Out-Null

az webapp create `
    --name $API_NAME `
    --resource-group $RESOURCE_GROUP `
    --plan $PLAN_NAME `
    --runtime "DOTNETCORE:8.0" 2>&1 | Out-Null
Write-Host "✓ App Service created" -ForegroundColor Green

# Step 6: Configure App Settings
Write-Host ""
Write-Host "Step 6/7: Configuring backend settings..." -ForegroundColor Cyan
$CONNECTION_STRING = "Host=$DB_NAME.postgres.database.azure.com;Database=linkexpiry;Username=$DB_ADMIN;Password=$pwd1;SslMode=Require"

az webapp config connection-string set `
    --name $API_NAME `
    --resource-group $RESOURCE_GROUP `
    --connection-string-type PostgreSQL `
    --settings DefaultConnection="$CONNECTION_STRING" 2>&1 | Out-Null

az webapp config appsettings set `
    --name $API_NAME `
    --resource-group $RESOURCE_GROUP `
    --settings JwtSettings__SecretKey="$JWT_SECRET" 2>&1 | Out-Null

az webapp update `
    --name $API_NAME `
    --resource-group $RESOURCE_GROUP `
    --https-only true 2>&1 | Out-Null
Write-Host "✓ Backend configured" -ForegroundColor Green

# Step 7: Create Static Web App
Write-Host ""
Write-Host "Step 7/7: Creating Static Web App for frontend..." -ForegroundColor Cyan
az staticwebapp create `
    --name $FRONTEND_NAME `
    --resource-group $RESOURCE_GROUP `
    --location "eastus2" `
    --sku Free 2>&1 | Out-Null
Write-Host "✓ Static Web App created" -ForegroundColor Green

# Get URLs
$API_URL = az webapp show --name $API_NAME --resource-group $RESOURCE_GROUP --query defaultHostName -o tsv
$FRONTEND_URL = az staticwebapp show --name $FRONTEND_NAME --resource-group $RESOURCE_GROUP --query "defaultHostname" -o tsv
$DEPLOYMENT_TOKEN = az staticwebapp secrets list --name $FRONTEND_NAME --resource-group $RESOURCE_GROUP --query "properties.apiKey" -o tsv

# Summary
Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Resources created:" -ForegroundColor Yellow
Write-Host "  ✓ Resource Group: $RESOURCE_GROUP" -ForegroundColor Green
Write-Host "  ✓ PostgreSQL: $DB_NAME.postgres.database.azure.com" -ForegroundColor Green
Write-Host "  ✓ Backend API: https://$API_URL" -ForegroundColor Green
Write-Host "  ✓ Frontend: https://$FRONTEND_URL" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Run database schema:" -ForegroundColor Cyan
Write-Host "   psql `"host=$DB_NAME.postgres.database.azure.com port=5432 dbname=linkexpiry user=$DB_ADMIN password=$pwd1 sslmode=require`" -f database\00_initial_schema.sql"
Write-Host ""
Write-Host "2. Update backend CORS in appsettings.Production.json:" -ForegroundColor Cyan
Write-Host "   `"AllowedOrigins`": [`"https://$FRONTEND_URL`"]"
Write-Host ""
Write-Host "3. Deploy backend:" -ForegroundColor Cyan
Write-Host "   cd backend\LinkExpiry.API"
Write-Host "   dotnet publish -c Release -o .\publish"
Write-Host "   Compress-Archive -Path .\publish\* -DestinationPath deploy.zip"
Write-Host "   az webapp deployment source config-zip --resource-group $RESOURCE_GROUP --name $API_NAME --src deploy.zip"
Write-Host ""
Write-Host "4. Update frontend .env.production:" -ForegroundColor Cyan
Write-Host "   VITE_API_URL=https://$API_URL"
Write-Host ""
Write-Host "5. Deploy frontend:" -ForegroundColor Cyan
Write-Host "   cd frontend"
Write-Host "   npm install && npm run build"
Write-Host "   npx @azure/static-web-apps-cli deploy .\dist --deployment-token $DEPLOYMENT_TOKEN"
Write-Host ""
Write-Host "Swagger UI: https://$API_URL/swagger" -ForegroundColor Magenta
Write-Host "Application: https://$FRONTEND_URL" -ForegroundColor Magenta
Write-Host ""
Write-Host "✓ All resources deployed successfully!" -ForegroundColor Green
