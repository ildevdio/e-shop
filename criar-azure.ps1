# Requer: Azure CLI instalado (https://aka.ms/installazurecliwindows)
# Execute: .\criar-azure.ps1

# Login
az login

# Variáveis (mude o sufixo se quiser)
$prefix = "multigrao"
$location = "brazilsouth"
$rg = "$prefix-rg"
$appName = "$prefix-api"
$dbName = "$prefix-db"
$adminUser = "multigrao_admin"
$adminPass = "M@lt!Gr@0s2026!"

# 1. Grupo de recursos
az group create --name $rg --location $location
Write-Host "✅ Grupo de recursos criado: $rg"

# 2. PostgreSQL Flexible Server (grátis 12 meses)
az postgres flexible-server create `
  --name $dbName `
  --resource-group $rg `
  --location $location `
  --admin-user $adminUser `
  --admin-password $adminPass `
  --sku-name Standard_B1ms `
  --tier Burstable `
  --storage-size 32 `
  --public-access 0.0.0.0 `
  --version 16

Write-Host "✅ PostgreSQL criado: $dbName"

# 3. App Service Plan (Free)
az appservice plan create `
  --name "$prefix-plan" `
  --resource-group $rg `
  --sku F1 `
  --is-linux

Write-Host "✅ App Service Plan criado"

# 4. Web App (Linux, .NET 10)
az webapp create `
  --name $appName `
  --resource-group $rg `
  --plan "$prefix-plan" `
  --runtime "DOTNETCORE:10.0"

Write-Host "✅ Web App criado: $appName"

# 5. Connection string
$connString = "Host=$dbName.postgres.database.azure.com;Port=5432;Database=postgres;UserName=$adminUser;Password=$adminPass;SSL Mode=Require;Trust Server Certificate=true"

# 6. Variáveis de ambiente
az webapp config appsettings set `
  --resource-group $rg `
  --name $appName `
  --settings `
    "DB_CONNECTION_STRING=$connString" `
    "JWT_KEY=M@lt!Gr@0sS3nh@M3str3#2026!@#$%" `
    "JWT_ISSUER=MultigraoApi" `
    "JWT_AUDIENCE=MultigraoApp" `
    "CORS_ORIGINS=https://multigrao-xi.vercel.app,http://localhost:5173" `
    "ASPNETCORE_ENVIRONMENT=Production"

Write-Host "✅ Variáveis configuradas"

# 7. Baixar publish profile para configurar no GitHub
az webapp deployment list-publishing-profiles `
  --resource-group $rg `
  --name $appName `
  --query "[?publishMethod=='MSDeploy'].{profile:publishUrl}" `
  --output tsv

Write-Host ""
Write-Host "======================"
Write-Host "✅ Tudo criado!"
Write-Host ""
Write-Host "PRÓXIMO PASSO:"
Write-Host "1. Vá no portal do Azure -> App Service -> $appName"
Write-Host "2. Baixe o Publish Profile (Overview -> Get Publish Profile)"
Write-Host "3. No GitHub: Settings -> Secrets and variables -> Actions"
Write-Host "4. Crie o secret: AZURE_PUBLISH_PROFILE (cole o conteúdo do XML)"
Write-Host "5. Faça push no GitHub - o deploy automático vai rodar"
Write-Host ""
Write-Host "No Vercel, coloque:"
Write-Host "VITE_API_URL = https://$appName.azurewebsites.net"
Write-Host "======================"
