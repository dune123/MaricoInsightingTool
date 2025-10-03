# Azure Deployment Guide for BrandBloom Insights

## Overview

This guide explains how to deploy both the main BrandBloom Insights application and the PROJECTB Dashboard to Azure Static Web Apps with proper integration.

## Architecture

```
Main App (Azure Static Web App) ──► PROJECTB Dashboard (Azure Static Web App)
brandbloom-insights.azurestaticapps.net ──► brandbloom-dashboard.azurestaticapps.net
```

## Prerequisites

- Azure subscription
- GitHub repository with your code
- Azure CLI installed (optional)
- Node.js 18+ for local testing

## Deployment Steps

### Step 1: Prepare Environment Variables

1. **Create environment files for Main App**:
   ```bash
   # In frontend/ directory
   cp environment.config.example .env.development
   cp environment.config.example .env.production
   ```

2. **Create environment files for PROJECTB**:
   ```bash
   # In PROJECTB/maricoinsight-Dashboarding/ directory
   cp environment.config.example .env.development
   cp environment.config.example .env.production
   ```

3. **Update production environment variables**:
   ```env
   # frontend/.env.production
   VITE_DASHBOARD_URL=https://brandbloom-dashboard.azurestaticapps.net
   VITE_NODEJS_API_URL=https://your-nodejs-api.azurewebsites.net
   VITE_PYTHON_API_URL=https://your-python-api.azurewebsites.net
   VITE_DEBUG_MODE=false
   ```

### Step 2: Deploy Main Application

1. **Go to Azure Portal** → Static Web Apps → Create

2. **Configure Main App**:
   - **Name**: `brandbloom-insights`
   - **Resource Group**: Create new or use existing
   - **Source**: GitHub
   - **Repository**: Your GitHub repo
   - **Branch**: `main`
   - **Build Presets**: React
   - **App location**: `/frontend`
   - **Output location**: `dist`

3. **Configure Environment Variables** in Azure Portal:
   - Go to your Static Web App → Configuration
   - Add Application Settings:
     ```
     VITE_DASHBOARD_URL = https://brandbloom-dashboard.azurestaticapps.net
     VITE_NODEJS_API_URL = https://your-nodejs-api.azurewebsites.net
     VITE_PYTHON_API_URL = https://your-python-api.azurewebsites.net
     VITE_DEBUG_MODE = false
     ```

### Step 3: Deploy PROJECTB Dashboard

1. **Create Second Static Web App**:
   - **Name**: `brandbloom-dashboard`
   - **Resource Group**: Same as main app
   - **Source**: GitHub (same repository)
   - **Branch**: `main`
   - **Build Presets**: React
   - **App location**: `/PROJECTB/maricoinsight-Dashboarding`
   - **Output location**: `dist`

2. **Configure Environment Variables**:
   - Go to PROJECTB Static Web App → Configuration
   - Add Application Settings:
     ```
     VITE_MAIN_APP_URL = https://brandbloom-insights.azurestaticapps.net
     VITE_AZURE_API_KEY = your-azure-openai-key
     VITE_AZURE_ENDPOINT = https://your-resource.cognitiveservices.azure.com/
     VITE_AZURE_DEPLOYMENT_NAME = gpt-4o-mini
     ```

### Step 4: GitHub Actions Configuration

Azure automatically creates GitHub Actions workflows. Verify they look like this:

**Main App Workflow** (`.github/workflows/azure-static-web-apps-main.yml`):
```yaml
name: Azure Static Web Apps CI/CD

on:
  push:
    branches:
      - main
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches:
      - main

jobs:
  build_and_deploy_job:
    if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.action != 'closed')
    runs-on: ubuntu-latest
    name: Build and Deploy Job
    steps:
      - uses: actions/checkout@v3
        with:
          submodules: true
      - name: Build And Deploy
        id: builddeploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN_MAIN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "/frontend"
          output_location: "dist"
```

**PROJECTB Workflow** (`.github/workflows/azure-static-web-apps-dashboard.yml`):
```yaml
name: Azure Static Web Apps Dashboard CI/CD

on:
  push:
    branches:
      - main
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches:
      - main

jobs:
  build_and_deploy_job:
    if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.action != 'closed')
    runs-on: ubuntu-latest
    name: Build and Deploy Job
    steps:
      - uses: actions/checkout@v3
        with:
          submodules: true
      - name: Build And Deploy
        id: builddeploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN_DASHBOARD }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "/PROJECTB/maricoinsight-Dashboarding"
          output_location: "dist"
```

### Step 5: Backend APIs Deployment (Optional)

If you need to deploy your Node.js and Python backends:

1. **Node.js Backend** → Azure App Service
2. **Python Backend** → Azure App Service or Azure Functions
3. Update API URLs in environment variables

## Testing the Integration

### Local Testing

1. **Start both applications**:
   ```bash
   # Terminal 1 - Main App (Port 8081)
   cd frontend
   npm run dev
   
   # Terminal 2 - PROJECTB (Port 8082)
   cd "PROJECTB/maricoinsight-Dashboarding"
   npm run dev
   ```

2. **Test navigation**:
   - Visit `http://localhost:8081`
   - Click "Analyze Dashboards"
   - Verify PROJECTB opens at `http://localhost:8082`

### Production Testing

1. **After deployment**:
   - Visit your main app: `https://brandbloom-insights.azurestaticapps.net`
   - Click "Analyze Dashboards"
   - Verify dashboard opens: `https://brandbloom-dashboard.azurestaticapps.net`

## Troubleshooting

### Common Issues

1. **Navigation not working**:
   - Check environment variables are set correctly in Azure Portal
   - Verify both Static Web Apps are deployed and accessible
   - Check browser console for errors

2. **Build failures**:
   - Verify `package.json` scripts are correct
   - Check Node.js version compatibility (use Node 18+)
   - Review build logs in Azure Portal → Deployment Center

3. **Environment variables not loading**:
   - Ensure variables start with `VITE_` prefix
   - Check they're set in Azure Portal Configuration
   - Restart the Static Web App after adding variables

4. **CORS issues**:
   - Ensure both apps use HTTPS in production
   - Check `staticwebapp.config.json` configuration
   - Verify Content Security Policy settings

### Debug Steps

1. **Enable debug logging**:
   ```javascript
   // In browser console
   localStorage.setItem('bb_debug_verbose', 'true');
   ```

2. **Check environment variables**:
   ```javascript
   // In browser console
   console.log('Dashboard URL:', import.meta.env.VITE_DASHBOARD_URL);
   ```

3. **Network tab**: Check for failed requests or CORS errors

## Final URLs

After successful deployment:

- **Main Application**: `https://brandbloom-insights.azurestaticapps.net`
- **Dashboard**: `https://brandbloom-dashboard.azurestaticapps.net`

## Security Considerations

1. **Environment Variables**: Never commit `.env` files to Git
2. **API Keys**: Store sensitive keys in Azure Key Vault
3. **CORS**: Configure proper CORS policies for APIs
4. **CSP**: Content Security Policy is configured in `staticwebapp.config.json`

## Monitoring

1. **Azure Monitor**: Set up Application Insights
2. **GitHub Actions**: Monitor deployment status
3. **Static Web Apps**: Check deployment logs in Azure Portal

## Cost Optimization

1. **Free Tier**: Azure Static Web Apps has a generous free tier
2. **CDN**: Built-in global CDN for fast loading
3. **Auto-scaling**: Automatic scaling based on traffic

---

**Last Updated**: 2025-01-31  
**Version**: 1.0.0  
**Author**: BrandBloom Development Team
