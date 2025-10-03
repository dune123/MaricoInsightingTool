#!/bin/bash

# Setup Environment Configuration for BrandBloom Insights
# This script helps set up environment variables for development and production

echo "🚀 Setting up BrandBloom Insights Environment Configuration"
echo "=========================================================="

# Create environment files for main frontend
echo "📁 Setting up Main App environment files..."
cd frontend

if [ ! -f .env.development ]; then
    echo "Creating .env.development for main app..."
    cat > .env.development << EOF
# Development Environment Variables for Main App
VITE_DASHBOARD_URL=http://localhost:8082
VITE_NODEJS_API_URL=http://localhost:3001
VITE_PYTHON_API_URL=http://localhost:8000
VITE_DEBUG_MODE=true
VITE_ENABLE_CONSOLE_LOGS=true
EOF
    echo "✅ Created .env.development"
else
    echo "⚠️  .env.development already exists"
fi

if [ ! -f .env.production ]; then
    echo "Creating .env.production for main app..."
    cat > .env.production << EOF
# Production Environment Variables for Main App
VITE_DASHBOARD_URL=https://brandbloom-dashboard.azurestaticapps.net
VITE_NODEJS_API_URL=https://your-nodejs-api.azurewebsites.net
VITE_PYTHON_API_URL=https://your-python-api.azurewebsites.net
VITE_DEBUG_MODE=false
VITE_ENABLE_CONSOLE_LOGS=false
EOF
    echo "✅ Created .env.production"
else
    echo "⚠️  .env.production already exists"
fi

# Create environment files for PROJECTB
echo "📁 Setting up PROJECTB environment files..."
cd ../PROJECTB/maricoinsight-Dashboarding

if [ ! -f .env.development ]; then
    echo "Creating .env.development for PROJECTB..."
    cat > .env.development << EOF
# Development Environment Variables for PROJECTB Dashboard
VITE_PORT=8082
VITE_MAIN_APP_URL=http://localhost:8081
VITE_AZURE_API_KEY=your-azure-openai-key
VITE_AZURE_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
VITE_AZURE_DEPLOYMENT_NAME=gpt-4o-mini
EOF
    echo "✅ Created .env.development"
else
    echo "⚠️  .env.development already exists"
fi

if [ ! -f .env.production ]; then
    echo "Creating .env.production for PROJECTB..."
    cat > .env.production << EOF
# Production Environment Variables for PROJECTB Dashboard
VITE_MAIN_APP_URL=https://brandbloom-insights.azurestaticapps.net
VITE_AZURE_API_KEY=your-azure-openai-key
VITE_AZURE_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
VITE_AZURE_DEPLOYMENT_NAME=gpt-4o-mini
EOF
    echo "✅ Created .env.production"
else
    echo "⚠️  .env.production already exists"
fi

cd ../..

echo ""
echo "🎉 Environment setup complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Update the production URLs in .env.production files after Azure deployment"
echo "2. Add your Azure OpenAI credentials to the PROJECTB .env files"
echo "3. Test locally by running both apps:"
echo "   - Terminal 1: cd frontend && npm run dev"
echo "   - Terminal 2: cd PROJECTB/maricoinsight-Dashboarding && npm run dev"
echo "4. Deploy to Azure using the AZURE_DEPLOYMENT_GUIDE.md"
echo ""
echo "⚠️  Important: Never commit .env files to Git!"
echo "   Add .env.* to your .gitignore file"
