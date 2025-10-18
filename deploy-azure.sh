#!/bin/bash

# LinkExpiry - Azure Deployment Script
# This script automates the deployment of LinkExpiry to Azure

set -e  # Exit on error

echo "🚀 LinkExpiry Azure Deployment Script"
echo "======================================"
echo ""

# Configuration
RESOURCE_GROUP="linkexpiry-rg"
LOCATION="eastus"
DB_NAME="linkexpiry-db"
DB_ADMIN="linkadmin"
API_NAME="linkexpiry-api"
FRONTEND_NAME="linkexpiry-frontend"
PLAN_NAME="linkexpiry-plan"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    print_error "Azure CLI is not installed. Please install it first:"
    echo "https://docs.microsoft.com/cli/azure/install-azure-cli"
    exit 1
fi

# Check if logged in to Azure
if ! az account show &> /dev/null; then
    print_warning "Not logged in to Azure. Please login:"
    az login
fi

# Get current subscription
SUBSCRIPTION=$(az account show --query name -o tsv)
echo "Using subscription: $SUBSCRIPTION"
echo ""

# Prompt for database password
echo "Please enter a secure password for the PostgreSQL database:"
read -s DB_PASSWORD
echo ""
echo "Please confirm the password:"
read -s DB_PASSWORD_CONFIRM
echo ""

if [ "$DB_PASSWORD" != "$DB_PASSWORD_CONFIRM" ]; then
    print_error "Passwords do not match!"
    exit 1
fi

if [ ${#DB_PASSWORD} -lt 8 ]; then
    print_error "Password must be at least 8 characters long!"
    exit 1
fi

# Generate JWT secret
echo "Generating JWT secret key..."
JWT_SECRET=$(openssl rand -base64 32)
print_success "JWT secret generated"
echo ""

# Confirm deployment
echo "This script will create the following resources:"
echo "  - Resource Group: $RESOURCE_GROUP"
echo "  - PostgreSQL Server: $DB_NAME"
echo "  - App Service: $API_NAME"
echo "  - Static Web App: $FRONTEND_NAME"
echo ""
echo "Estimated monthly cost: ~\$25/month"
echo ""
read -p "Continue with deployment? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

# Step 1: Create Resource Group
echo ""
echo "Step 1/7: Creating Resource Group..."
if az group create --name $RESOURCE_GROUP --location $LOCATION &> /dev/null; then
    print_success "Resource group created"
else
    print_warning "Resource group already exists"
fi

# Step 2: Create PostgreSQL Server
echo ""
echo "Step 2/7: Creating PostgreSQL Server (this may take 5-10 minutes)..."
if az postgres flexible-server create \
    --resource-group $RESOURCE_GROUP \
    --name $DB_NAME \
    --location $LOCATION \
    --admin-user $DB_ADMIN \
    --admin-password "$DB_PASSWORD" \
    --sku-name Standard_B1ms \
    --tier Burstable \
    --storage-size 32 \
    --version 15 \
    --public-access 0.0.0.0 \
    --yes &> /dev/null; then
    print_success "PostgreSQL server created"
else
    print_error "Failed to create PostgreSQL server"
    exit 1
fi

# Step 3: Configure Firewall
echo ""
echo "Step 3/7: Configuring database firewall..."
az postgres flexible-server firewall-rule create \
    --resource-group $RESOURCE_GROUP \
    --name $DB_NAME \
    --rule-name AllowAzureServices \
    --start-ip-address 0.0.0.0 \
    --end-ip-address 0.0.0.0 &> /dev/null
print_success "Firewall configured"

# Step 4: Create Database
echo ""
echo "Step 4/7: Creating linkexpiry database..."
az postgres flexible-server db create \
    --resource-group $RESOURCE_GROUP \
    --server-name $DB_NAME \
    --database-name linkexpiry &> /dev/null
print_success "Database created"

# Step 5: Create App Service
echo ""
echo "Step 5/7: Creating App Service for backend API..."
az appservice plan create \
    --name $PLAN_NAME \
    --resource-group $RESOURCE_GROUP \
    --location $LOCATION \
    --sku B1 \
    --is-linux &> /dev/null

az webapp create \
    --name $API_NAME \
    --resource-group $RESOURCE_GROUP \
    --plan $PLAN_NAME \
    --runtime "DOTNETCORE:8.0" &> /dev/null
print_success "App Service created"

# Step 6: Configure App Settings
echo ""
echo "Step 6/7: Configuring backend settings..."
CONNECTION_STRING="Host=$DB_NAME.postgres.database.azure.com;Database=linkexpiry;Username=$DB_ADMIN;Password=$DB_PASSWORD;SslMode=Require"

az webapp config connection-string set \
    --name $API_NAME \
    --resource-group $RESOURCE_GROUP \
    --connection-string-type PostgreSQL \
    --settings DefaultConnection="$CONNECTION_STRING" &> /dev/null

az webapp config appsettings set \
    --name $API_NAME \
    --resource-group $RESOURCE_GROUP \
    --settings JwtSettings__SecretKey="$JWT_SECRET" &> /dev/null

az webapp update \
    --name $API_NAME \
    --resource-group $RESOURCE_GROUP \
    --https-only true &> /dev/null
print_success "Backend configured"

# Step 7: Create Static Web App
echo ""
echo "Step 7/7: Creating Static Web App for frontend..."
az staticwebapp create \
    --name $FRONTEND_NAME \
    --resource-group $RESOURCE_GROUP \
    --location "eastus2" \
    --sku Free &> /dev/null
print_success "Static Web App created"

# Get URLs
API_URL=$(az webapp show --name $API_NAME --resource-group $RESOURCE_GROUP --query defaultHostName -o tsv)
FRONTEND_URL=$(az staticwebapp show --name $FRONTEND_NAME --resource-group $RESOURCE_GROUP --query "defaultHostname" -o tsv)
DEPLOYMENT_TOKEN=$(az staticwebapp secrets list --name $FRONTEND_NAME --resource-group $RESOURCE_GROUP --query "properties.apiKey" -o tsv)

# Summary
echo ""
echo "======================================"
echo "🎉 Deployment Complete!"
echo "======================================"
echo ""
echo "Resources created:"
echo "  ✓ Resource Group: $RESOURCE_GROUP"
echo "  ✓ PostgreSQL: $DB_NAME.postgres.database.azure.com"
echo "  ✓ Backend API: https://$API_URL"
echo "  ✓ Frontend: https://$FRONTEND_URL"
echo ""
echo "Next steps:"
echo ""
echo "1. Run database schema:"
echo "   psql \"host=$DB_NAME.postgres.database.azure.com port=5432 dbname=linkexpiry user=$DB_ADMIN password=$DB_PASSWORD sslmode=require\" -f database/00_initial_schema.sql"
echo ""
echo "2. Update backend CORS in appsettings.Production.json:"
echo "   \"AllowedOrigins\": [\"https://$FRONTEND_URL\"]"
echo ""
echo "3. Deploy backend:"
echo "   cd backend/LinkExpiry.API"
echo "   dotnet publish -c Release -o ./publish"
echo "   cd publish && zip -r ../deploy.zip . && cd .."
echo "   az webapp deployment source config-zip --resource-group $RESOURCE_GROUP --name $API_NAME --src deploy.zip"
echo ""
echo "4. Update frontend .env.production:"
echo "   VITE_API_URL=https://$API_URL"
echo ""
echo "5. Deploy frontend:"
echo "   cd frontend"
echo "   npm install && npm run build"
echo "   npx @azure/static-web-apps-cli deploy ./dist --deployment-token $DEPLOYMENT_TOKEN"
echo ""
echo "Important credentials (save securely):"
echo "  Database Password: [hidden for security]"
echo "  JWT Secret: [hidden for security]"
echo "  Deployment Token: [hidden for security]"
echo ""
echo "Swagger UI: https://$API_URL/swagger"
echo "Application: https://$FRONTEND_URL"
echo ""
print_success "All resources deployed successfully!"
