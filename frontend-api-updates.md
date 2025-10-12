# Frontend API Updates for Production

## 1. Create Environment File

Create `frontend/.env.production`:

```env
VITE_PYTHON_API_URL=https://maricoinsightingtool.onrender.com
VITE_NODEJS_API_URL=https://marico-insighting-tool-wkji.vercel.app
VITE_DEBUG_MODE=false
```

## 2. Update apiConfig.ts

Replace the hardcoded URLs in `frontend/src/config/apiConfig.ts`:

```typescript
// Add at the top after imports
const PYTHON_API_URL = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:8000';
const NODEJS_API_URL = import.meta.env.VITE_NODEJS_API_URL || 'http://localhost:3001';

// Update BACKEND_OPTIONS array
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

## 3. Update nodejsClient.ts

Update `frontend/src/utils/nodejsClient.ts`:

```typescript
export const NODEJS_CONFIG = {
  BASE_URL: (import.meta.env.VITE_NODEJS_API_URL || 'http://localhost:3001') + '/api',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
} as const;
```

## 4. Update Hardcoded URLs

### In NonMMMChartAnalysisService.ts:
Replace line 210:
```typescript
// OLD:
const apiUrl = `http://localhost:8000/api/nonmmm/chart-data/${request.filename}?brand=${encodeURIComponent(request.brand)}&target_variable=${encodeURIComponent(request.targetVariable)}&trendline_type=linear`;

// NEW:
const apiUrl = `${import.meta.env.VITE_PYTHON_API_URL}/api/nonmmm/chart-data/${request.filename}?brand=${encodeURIComponent(request.brand)}&target_variable=${encodeURIComponent(request.targetVariable)}&trendline_type=linear`;
```

### In DataConcatenationStep.tsx:
Replace line 349:
```typescript
// OLD:
const dataResponse = await fetch(`http://localhost:8000/api/data/filtered?brand=${encodeURIComponent(selectedBrand)}`, {

// NEW:
const dataResponse = await fetch(`${import.meta.env.VITE_PYTHON_API_URL}/api/data/filtered?brand=${encodeURIComponent(selectedBrand)}`, {
```

## 5. Quick Test Commands

```bash
# Test Python backend
curl https://maricoinsightingtool.onrender.com/health

# Test Node.js backend  
curl https://marico-insighting-tool-wkji.vercel.app/health

# Build and deploy frontend
cd frontend
npm run build
vercel --prod
```

## Summary

Your setup will be:
- **Frontend**: Vercel (React app)
- **Python Backend**: Render (Data processing, file operations)
- **Node.js Backend**: Vercel (State management, metadata)

The frontend will route:
- **File operations** → Python backend (Render)
- **State management** → Node.js backend (Vercel)
- **Data processing** → Python backend (Render)
