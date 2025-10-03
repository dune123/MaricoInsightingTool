# PROJECT B - Dashboard Integration

## Overview

PROJECT B is the **Marico Insight Dashboarding** application that provides advanced analytics and dashboard capabilities for the BrandBloom Insights platform. It's designed to be accessed from the main application when users click "Analyze Dashboards".

## Architecture

```
Main App (Port 8081) ──► PROJECT B (Port 8082)
     │                        │
     └── Brand Leader ────────┘
         Button Click
```

## Features

- **Advanced Data Visualization**: Interactive charts and graphs
- **AI-Powered Insights**: Azure OpenAI integration for intelligent analysis
- **Custom Dashboards**: Create and manage personalized dashboards
- **Document Analysis**: Upload and analyze various file formats
- **Real-time Processing**: Live data processing and visualization

## Quick Start

### Development Setup

1. **Start Main Application** (Port 8081):
   ```bash
   cd frontend
   npm run dev
   ```

2. **Start PROJECT B** (Port 8082):
   ```bash
   cd "PROJECT B/maricoinsight-Dashboarding"
   ./start-dashboard.sh
   # OR
   npm run dev
   ```

3. **Access Applications**:
   - Main App: http://localhost:8081
   - Dashboard: http://localhost:8082

### Navigation Flow

1. User visits main app (localhost:8081)
2. Clicks "Analyze Dashboards" button
3. Selects "Brand Leader" role
4. Clicks "Access Dashboard Analytics"
5. PROJECT B opens in new tab (localhost:8082)

## Integration Details

### Navigation Implementation

The integration uses a utility function `navigateToDashboard()` that:
- Opens PROJECT B in a new tab
- Handles development vs production URLs
- Provides fallback handling for connection issues
- Shows loading states during navigation

### URL Management

- **Development**: `http://localhost:8082`
- **Production**: `https://your-dashboard.azurestaticapps.net` (update when deployed)

### File Structure

```
PROJECT B/
├── maricoinsight-Dashboarding/     # Main dashboard app
│   ├── src/
│   │   ├── App.tsx                # Main application component
│   │   ├── components/            # Dashboard components
│   │   └── lib/                   # Utilities and services
│   ├── vite.config.ts             # Vite configuration (port 8082)
│   ├── package.json               # Dependencies
│   └── start-dashboard.sh         # Startup script
└── INTEGRATION_README.md          # This file
```

## Deployment

### Azure Static Web Apps (Recommended)

1. **Deploy Main App**:
   - Build: `npm run build`
   - Deploy to Azure Static Web App
   - URL: `https://your-app.azurestaticapps.net`

2. **Deploy PROJECT B**:
   - Build: `npm run build`
   - Deploy to separate Azure Static Web App
   - URL: `https://your-dashboard.azurestaticapps.net`

3. **Update Production URLs**:
   - Update `navigationUtils.ts` with production URLs
   - Test navigation between applications

### Alternative Deployment Options

- **Azure App Service**: Deploy both as separate web apps
- **Azure Container Instances**: Deploy as containers
- **Traditional hosting**: Any static hosting service

## Configuration

### Environment Variables

Create `.env` files for different environments:

**Development (.env.development)**:
```
VITE_DASHBOARD_URL=http://localhost:8082
```

**Production (.env.production)**:
```
VITE_DASHBOARD_URL=https://your-dashboard.azurestaticapps.net
```

### Vite Configuration

The PROJECT B app is configured to run on port 8082:

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    port: 8082,
    host: true
  }
});
```

## Troubleshooting

### Common Issues

1. **Port Conflicts**:
   - Ensure port 8082 is available
   - Check if another service is using the port

2. **Navigation Not Working**:
   - Verify PROJECT B is running on port 8082
   - Check browser console for errors
   - Ensure popup blockers are disabled

3. **CORS Issues**:
   - Both apps should run on localhost in development
   - No CORS issues expected for static apps

### Debug Mode

Enable debug logging:
```javascript
localStorage.setItem('bb_debug_verbose', 'true');
```

## Development Workflow

1. **Start both applications**:
   ```bash
   # Terminal 1 - Main App
   cd frontend && npm run dev
   
   # Terminal 2 - PROJECT B
   cd "PROJECT B/maricoinsight-Dashboarding" && npm run dev
   ```

2. **Test integration**:
   - Visit http://localhost:8081
   - Click "Analyze Dashboards"
   - Select "Brand Leader"
   - Click "Access Dashboard Analytics"
   - Verify PROJECT B opens in new tab

3. **Development tips**:
   - Use browser dev tools to debug navigation
   - Check network tab for connection issues
   - Monitor console for errors

## Future Enhancements

- **Single Sign-On**: Implement authentication between apps
- **Data Sharing**: Share state/data between applications
- **Embedded Mode**: Option to embed PROJECT B in iframe
- **Real-time Sync**: Synchronize data between apps
- **Mobile Optimization**: Responsive design improvements

## Support

For issues or questions:
1. Check this README first
2. Review browser console for errors
3. Verify both applications are running
4. Test navigation flow step by step

---

**Last Updated**: 2025-01-31  
**Version**: 1.0.0  
**Author**: BrandBloom Frontend Team

