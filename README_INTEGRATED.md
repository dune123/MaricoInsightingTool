# 🚀 BrandBloom Insights - Integrated Dashboard Platform

## 🎯 **Complete Analytics & Dashboard Solution**

A comprehensive FMCG intelligence platform featuring advanced analytics, dashboard creation, and AI-powered insights designed for business leaders and data scientists.

## ✨ **Key Features**

### 🏢 **For Brand Leaders**
- **Direct Dashboard Access**: One-click access to advanced analytics
- **AI-Powered Insights**: Intelligent business recommendations
- **Executive Dashboards**: High-level performance visualization
- **Strategic Decision Support**: Data-driven business intelligence

### 🔬 **For Data Scientists**
- **Advanced Analytics**: MMM and Non-MMM analysis capabilities
- **Custom Model Building**: Linear, log-linear, ridge, bayesian models
- **Data Processing**: Comprehensive data standardization and analysis
- **Statistical Modeling**: Advanced statistical analysis tools

### 📊 **Integrated Dashboard Platform (PROJECT B)**
- **Real-time Visualization**: Interactive charts and graphs
- **Custom Dashboard Creation**: Personalized analytics dashboards
- **Document Analysis**: Upload and analyze various file formats
- **AI Chatbots**: Intelligent data exploration and insights

## 🏗️ **Architecture**

```
Main Application (Port 8081) ──► Dashboard Platform (Port 8082)
     │                              │
     ├── Brand Leader Portal        ├── Advanced Analytics
     ├── Data Scientist Portal      ├── AI-Powered Insights
     └── Analysis Workflows         └── Custom Dashboards
```

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- Git

### **Installation & Setup**

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd brandbloom-insights
   ```

2. **Start Main Application** (Port 8081):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Start Dashboard Platform** (Port 8082):
   ```bash
   cd "PROJECT B/maricoinsight-Dashboarding"
   npm install
   npm run dev
   ```

4. **Test Integration**:
   ```bash
   node test-integration.js
   ```

### **Access Applications**
- **Main App**: http://localhost:8081
- **Dashboard Platform**: http://localhost:8082
- **Integration Test**: `node test-integration.js`

## 🎯 **User Workflows**

### **Brand Leader Workflow**
1. Visit main app (localhost:8081)
2. Click "Analyze Dashboards"
3. Dashboard platform opens directly (localhost:8082)
4. Access advanced analytics and insights

### **Data Scientist Workflow**
1. Visit main app (localhost:8081)
2. Click "Build Models"
3. Select analysis type (MMM/Non-MMM)
4. Upload data and build models
5. Access dashboard platform for visualization

## 🛠️ **Technical Stack**

### **Main Application**
- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **State Management**: React Context
- **Routing**: React Router
- **Backend**: Node.js + Python (Split Architecture)

### **Dashboard Platform (PROJECT B)**
- **Frontend**: React + TypeScript + Vite
- **Charts**: Recharts + React Grid Layout
- **AI Integration**: Azure OpenAI
- **File Processing**: PapaParse + XLSX
- **Database**: Supabase

## 📁 **Project Structure**

```
brandbloom-insights/
├── frontend/                    # Main React application
│   ├── src/
│   │   ├── pages/              # Main pages
│   │   ├── components/         # UI components
│   │   ├── analysis/           # Analysis workflows
│   │   └── utils/              # Utilities
├── backend/
│   ├── nodejs/                 # Node.js backend
│   └── python/                 # Python backend
├── PROJECT B/                  # Dashboard platform
│   └── maricoinsight-Dashboarding/
│       ├── src/                # Dashboard components
│       ├── components/         # Chart components
│       └── lib/                # Utilities
└── docs/                       # Documentation
```

## 🔧 **Configuration**

### **Environment Variables**
Create `.env` files for different environments:

**Development**:
```
VITE_DASHBOARD_URL=http://localhost:8082
```

**Production**:
```
VITE_DASHBOARD_URL=https://your-dashboard.azurestaticapps.net
```

### **Port Configuration**
- **Main App**: 8081 (configurable in vite.config.ts)
- **Dashboard**: 8082 (configured in PROJECT B/vite.config.ts)

## 🚀 **Deployment**

### **Azure Static Web Apps (Recommended)**
1. **Deploy Main App**:
   ```bash
   cd frontend
   npm run build
   # Deploy to Azure Static Web App
   ```

2. **Deploy Dashboard Platform**:
   ```bash
   cd "PROJECT B/maricoinsight-Dashboarding"
   npm run build
   # Deploy to separate Azure Static Web App
   ```

3. **Update Production URLs**:
   - Update `navigationUtils.ts` with production URLs
   - Configure environment variables

### **Alternative Deployment**
- **Docker**: Containerize both applications
- **Traditional Hosting**: Any static hosting service
- **Cloud Platforms**: AWS, Google Cloud, etc.

## 🧪 **Testing**

### **Integration Testing**
```bash
# Test both applications
node test-integration.js

# Expected output:
# ✅ Main App is running on port 8081
# ✅ PROJECT B Dashboard is running on port 8082
# 🎉 Integration Test PASSED!
```

### **Manual Testing**
1. Start both applications
2. Visit http://localhost:8081
3. Click "Analyze Dashboards"
4. Verify PROJECT B opens in new tab
5. Test dashboard functionality

## 📚 **Documentation**

- **Integration Guide**: `PROJECT B/INTEGRATION_README.md`
- **Frontend Docs**: `frontend/FRONTEND_CODEBASE_DOCUMENTATION.mdc`
- **Backend Docs**: `backend/README.mdc`
- **API Documentation**: `backend/python/API_DOCUMENTATION.mdc`

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 **License**

This project is proprietary software developed for Marico's FMCG Intelligence Platform.

## 🆘 **Support**

For issues or questions:
1. Check the documentation
2. Review browser console for errors
3. Verify both applications are running
4. Test integration with `node test-integration.js`

## 🎉 **Success Metrics**

- ✅ **Seamless Integration**: One-click navigation between apps
- ✅ **Performance**: Fast loading and responsive UI
- ✅ **Scalability**: Independent scaling of applications
- ✅ **User Experience**: Intuitive workflows for all user types
- ✅ **Production Ready**: Azure deployment configuration

---

**Last Updated**: 2025-01-31  
**Version**: 1.0.0  
**Author**: BrandBloom Development Team

🚀 **Ready to revolutionize FMCG analytics!** 🚀
