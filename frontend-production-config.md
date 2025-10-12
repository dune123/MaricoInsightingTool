# Frontend Production Configuration

## Backend URLs for MMM and General Analysis

Your deployed backends:
- **Python Backend (Render):** https://maricoinsightingtool.onrender.com
- **Node.js Backend (Vercel):** https://marico-insighting-tool-wkji.vercel.app

## Configuration Steps

### 1. Create Production Environment File

Create `frontend/.env.production` with:

```env
# Production Environment Configuration
# Backend URLs for deployed services

# Python Backend (Render) - Data processing, file operations, analytics
VITE_PYTHON_API_URL=https://maricoinsightingtool.onrender.com

# Node.js Backend (Vercel) - State management, metadata operations
VITE_NODEJS_API_URL=https://marico-insighting-tool-wkji.vercel.app

# Dashboard URL (if using PROJECTB)
VITE_DASHBOARD_URL=https://brandbloom-dashboard.azurestaticapps.net

# Debug mode (disable in production)
VITE_DEBUG_MODE=false

# Environment
NODE_ENV=production
```

### 2. Update API Configuration

Update `frontend/src/config/apiConfig.ts` to use environment variables:

```typescript
// Add at the top of the file
const PYTHON_API_URL = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:8000';
const NODEJS_API_URL = import.meta.env.VITE_NODEJS_API_URL || 'http://localhost:3001';

// Update BACKEND_OPTIONS
const BACKEND_OPTIONS: BackendConfig[] = [
  {
    name: 'Python FastAPI',
    baseUrl: PYTHON_API_URL,
    healthEndpoint: '/health'
  },
  {
    name: 'Node.js Express',
    baseUrl: NODEJS_API_URL,
    healthEndpoint: '/health'
  }
];

// Update getStateApiUrl function
export function getStateApiUrl(): string {
  return `${NODEJS_API_URL}/api`;
}

// Update getDataApiUrl function
export function getDataApiUrl(): string {
  return `${PYTHON_API_URL}/api`;
}
```

### 3. Update Node.js Client

Update `frontend/src/utils/nodejsClient.ts`:

```typescript
// Update NODEJS_CONFIG
export const NODEJS_CONFIG = {
  BASE_URL: import.meta.env.VITE_NODEJS_API_URL + '/api' || 'http://localhost:3001/api',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
} as const;
```

### 4. Update Hardcoded URLs

Find and replace these hardcoded URLs in your frontend:

**Replace:**
- `http://localhost:8000` → `import.meta.env.VITE_PYTHON_API_URL`
- `http://localhost:3001` → `import.meta.env.VITE_NODEJS_API_URL`

**Files to update:**
- `frontend/src/analysis/nonmmm/services/NonMMMChartAnalysisService.ts`
- `frontend/src/analysis/mmm/steps/DataConcatenationStep.tsx`
- Any other files with hardcoded localhost URLs

### 5. Build and Deploy Frontend

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Build for production
npm run build

# Deploy to Vercel
vercel --prod
```

## Testing Your Configuration

### Test Python Backend
```bash
curl https://maricoinsightingtool.onrender.com/health
```

### Test Node.js Backend
```bash
curl https://marico-insighting-tool-wkji.vercel.app/health
```

### Test Frontend Integration
1. Open your deployed frontend
2. Try MMM analysis workflow
3. Try General Analysis workflow
4. Check browser console for any API errors

## Expected Workflow

### MMM Analysis Flow:
1. **Frontend** → **Node.js Backend (Vercel)** → State management, metadata
2. **Frontend** → **Python Backend (Render)** → File processing, data analysis

### General Analysis Flow:
1. **Frontend** → **Node.js Backend (Vercel)** → State management, metadata
2. **Frontend** → **Python Backend (Render)** → Data processing, modeling

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Ensure both backends have CORS enabled for your frontend domain
2. **API Timeouts**: Render has request timeouts, may need to optimize heavy operations
3. **File Upload Issues**: Vercel doesn't support file storage, may need to use external storage

### Debug Steps:

1. Check browser console for API errors
2. Test backend endpoints directly
3. Verify environment variables are loaded
4. Check network tab for failed requests

## Next Steps

1. **Create the environment file** with the URLs above
2. **Update the hardcoded URLs** in your frontend code
3. **Test locally** with production URLs
4. **Deploy frontend** to Vercel
5. **Test full integration** with MMM and General Analysis
