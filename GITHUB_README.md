# BrandBloom Insights - Complete Platform

## 🎯 Overview

BrandBloom Insights is a comprehensive FMCG intelligence platform that combines advanced analytics with executive dashboards. The platform features seamless integration between a main application and a sophisticated dashboard system (PROJECT B).

## 🏗️ Architecture

```
Main App (Port 8081) ──► PROJECT B (Port 8083)
     │                        │
     └── Brand Leader ───────┘
         Button Click
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Azure OpenAI API keys

### 1. Clone Repository
```bash
git clone <repository-url>
cd brandbloom-insights
```

### 2. Setup Main Application
```bash
cd frontend
npm install
npm run dev  # Runs on http://localhost:8081
```

### 3. Setup PROJECT B Dashboard
```bash
cd "PROJECT B/maricoinsight-Dashboarding"
npm install

# Create environment file
cp .env.example .env

# Edit .env with your Azure API keys:
# VITE_AZURE_API_KEY=your_actual_api_key
# VITE_AZURE_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
# VITE_AZURE_DEPLOYMENT_NAME=gpt-4o-mini

npm run dev  # Runs on http://localhost:8083
```

### 4. Test Integration
```bash
# From root directory
node test-integration.js

# Should show:
# ✅ Main App is running on port 8081
# ✅ PROJECT B Dashboard is running on port 8083
```

## 🎯 User Flow

1. **Visit**: http://localhost:8081
2. **Click**: "Analyze Dashboards"
3. **Select**: "Brand Leader"
4. **Click**: "Access Dashboard Analytics"
5. **Result**: PROJECT B opens at http://localhost:8083

## 🔐 Environment Configuration

### Required API Keys

Create `.env` file in `PROJECT B/maricoinsight-Dashboarding/`:

```env
VITE_AZURE_API_KEY=your_azure_api_key_here
VITE_AZURE_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
VITE_AZURE_DEPLOYMENT_NAME=gpt-4o-mini
```

### Security Notes
- ✅ `.env` files are gitignored
- ✅ API keys are not committed to repository
- ✅ Use `.env.example` as template
- ✅ Rotate keys regularly for production

## 📁 Repository Structure

```
brandbloom-insights/
├── frontend/                          # Main React app (Port 8081)
│   ├── src/
│   │   ├── components/wizard/
│   │   │   └── BrandLeaderWizard.tsx # PROJECT B integration
│   │   └── utils/
│   │       └── navigationUtils.ts    # Navigation logic
│   └── package.json
├── PROJECT B/                         # Dashboard app (Port 8083)
│   └── maricoinsight-Dashboarding/
│       ├── .env                       # API keys (gitignored)
│       ├── .env.example              # Setup template
│       ├── src/App.tsx               # Main dashboard app
│       └── package.json
├── backend/                          # Backend services
│   ├── nodejs/                       # Node.js backend
│   └── python/                       # Python backend
├── test-integration.js              # Integration testing
├── REPOSITORY_SETUP.md             # Detailed setup guide
└── GITHUB_README.md               # This file
```

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

## 🌟 Key Features

### Main Application
- **User Type Selection**: Brand Leader vs Data Scientist
- **Seamless Navigation**: One-click access to PROJECT B
- **Responsive Design**: Premium UI/UX for corporate clients
- **Integration Ready**: Built for Azure deployment

### PROJECT B Dashboard
- **AI-Powered Analytics**: Azure OpenAI integration
- **Advanced Visualizations**: Interactive charts and graphs
- **Custom Dashboards**: Create and manage personalized dashboards
- **Document Analysis**: Upload and analyze various file formats
- **Real-time Processing**: Live data processing and visualization

## 📦 Deployment

### Development
- Main App: http://localhost:8081
- PROJECT B: http://localhost:8083

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
   - Main App: Port 8081
   - PROJECT B: Port 8083
   - Check if ports are available

2. **API Key Issues**:
   - Verify `.env` file exists
   - Check API key format
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

- **Repository Setup**: `REPOSITORY_SETUP.md`
- **PROJECT B Setup**: `PROJECT B/SETUP_GUIDE.md`
- **Integration Guide**: `PROJECT B/INTEGRATION_README.md`
- **Frontend Docs**: `frontend/FRONTEND_CODEBASE_DOCUMENTATION.mdc`

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch**
3. **Set up environment** (follow setup guides)
4. **Make changes**
5. **Test integration** (`node test-integration.js`)
6. **Submit pull request**

## 🔒 Security

- **API Keys**: Stored in environment variables
- **Gitignore**: `.env` files are ignored
- **Production**: Use secure key management
- **Rotation**: Regular key rotation recommended

## 📄 License

This project is proprietary to Marico and BrandBloom Insights.

---

**Last Updated**: 2025-01-31  
**Version**: 1.0.0  
**Author**: BrandBloom Frontend Team

## 🎉 Ready to Use!

The platform is fully integrated and ready for development and deployment. Follow the setup guide to get started!
