# BrandBloom Insights - Repository Setup Guide

## 🏗️ Repository Structure

This repository contains the complete BrandBloom Insights platform with integrated PROJECT B dashboard capabilities.

```
brandbloom-insights/
├── frontend/                          # Main React application (Port 8081)
│   ├── src/
│   │   ├── components/wizard/
│   │   │   └── BrandLeaderWizard.tsx # Updated with PROJECT B integration
│   │   └── utils/
│   │       └── navigationUtils.ts    # Navigation to PROJECT B
│   └── package.json
├── PROJECT B/                         # Dashboard application (Port 8082)
│   └── maricoinsight-Dashboarding/
│       ├── .env                       # API keys (gitignored)
│       ├── .env.example              # Template for setup
│       ├── src/App.tsx               # Uses environment variables
│       └── package.json
├── backend/                          # Backend services
│   ├── nodejs/                       # Node.js backend
│   └── python/                       # Python backend
└── test-integration.js              # Integration testing script
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Azure OpenAI API keys

### 1. Main Application Setup

```bash
# Install dependencies
cd frontend
npm install

# Start main app (Port 8081)
npm run dev
```

### 2. PROJECT B Dashboard Setup

```bash
# Navigate to PROJECT B
cd "PROJECT B/maricoinsight-Dashboarding"

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your Azure API keys:
# VITE_AZURE_API_KEY=your_actual_api_key
# VITE_AZURE_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
# VITE_AZURE_DEPLOYMENT_NAME=gpt-4o-mini

# Start PROJECT B (Port 8082)
npm run dev
```

### 3. Test Integration

```bash
# From root directory
node test-integration.js

# Should show:
# ✅ Main App is running on port 8081
# ✅ PROJECT B Dashboard is running on port 8082
```

## 🔐 Environment Configuration

### Required API Keys

You need Azure OpenAI API keys for PROJECT B to function:

```env
# PROJECT B/maricoinsight-Dashboarding/.env
VITE_AZURE_API_KEY=your_azure_api_key_here
VITE_AZURE_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
VITE_AZURE_DEPLOYMENT_NAME=gpt-4o-mini
```

### Security Notes

- ✅ `.env` files are gitignored
- ✅ API keys are not committed to repository
- ✅ Use `.env.example` as template
- ✅ Rotate keys regularly for production

## 🎯 User Flow

1. **Visit**: http://localhost:8081
2. **Click**: "Analyze Dashboards"
3. **Select**: "Brand Leader"
4. **Click**: "Access Dashboard Analytics"
5. **Result**: PROJECT B opens at http://localhost:8082

## 🔧 Development Commands

### Start Both Applications

```bash
# Terminal 1 - Main App
cd frontend && npm run dev

# Terminal 2 - PROJECT B
cd "PROJECT B/maricoinsight-Dashboarding" && npm run dev
```

### Integration Testing

```bash
# Test both applications
node test-integration.js

# Manual testing
# 1. Visit http://localhost:8081
# 2. Test navigation flow
# 3. Verify PROJECT B opens correctly
```

## 📦 Deployment

### Development
- Main App: http://localhost:8081
- PROJECT B: http://localhost:8082

### Production (Azure)
- Main App: https://your-app.azurestaticapps.net
- PROJECT B: https://your-dashboard.azurestaticapps.net

### Environment Variables for Production
Set these in your hosting platform:
- `VITE_AZURE_API_KEY`
- `VITE_AZURE_ENDPOINT`
- `VITE_AZURE_DEPLOYMENT_NAME`

## 🐛 Troubleshooting

### Common Issues

1. **Port Conflicts**:
   - Ensure ports 8081 and 8082 are available
   - Check if other services are using these ports

2. **API Key Issues**:
   - Verify `.env` file exists in PROJECT B directory
   - Check API key format and endpoint URL
   - Ensure Azure OpenAI service is active

3. **Navigation Not Working**:
   - Verify both applications are running
   - Check browser console for errors
   - Disable popup blockers

### Debug Mode

```bash
# Enable debug logging
localStorage.setItem('bb_debug_verbose', 'true');
```

## 📚 Documentation

- **Frontend**: `frontend/FRONTEND_CODEBASE_DOCUMENTATION.mdc`
- **PROJECT B**: `PROJECT B/SETUP_GUIDE.md`
- **Integration**: `PROJECT B/INTEGRATION_README.md`

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch**
3. **Set up environment** (follow this guide)
4. **Make changes**
5. **Test integration** (`node test-integration.js`)
6. **Submit pull request**

## 📄 License

This project is proprietary to Marico and BrandBloom Insights.

---

**Last Updated**: 2025-01-31  
**Version**: 1.0.0  
**Author**: BrandBloom Frontend Team
