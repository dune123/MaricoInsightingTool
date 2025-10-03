# CosmosDB Integration Setup Guide

This guide will help you set up Azure CosmosDB integration for your BrandBloom Insights application.

## Prerequisites

1. Azure account with CosmosDB access
2. Node.js and npm installed
3. Your Vite React application running

## Step 1: Create Azure CosmosDB Account

1. Go to [Azure Portal](https://portal.azure.com)
2. Create a new CosmosDB account:
   - Choose "Core (SQL)" API
   - Select your preferred region
   - Choose appropriate pricing tier

## Step 2: Create Database and Containers

1. In your CosmosDB account, create a new database named `brandbloom-insights`
2. Create the following containers:
   - `chats` (for chat history)
   - `charts` (for chart data)
   - `dashboards` (for dashboard data)
   - `analysis` (for analysis results)

## Step 3: Environment Configuration

Create a `.env` file in your project root with the following variables:

```env
# CosmosDB Configuration
VITE_COSMOSDB_ENDPOINT=https://your-cosmosdb-account.documents.azure.com:443/
VITE_COSMOSDB_KEY=your-cosmosdb-primary-key
VITE_COSMOSDB_DATABASE_ID=brandbloom-insights
VITE_COSMOSDB_CONTAINER_ID=data

# Optional: User and Session Management
VITE_USER_ID=default-user
VITE_SESSION_ID=default-session
```

## Step 4: Install Dependencies

```bash
npm install @azure/cosmos
```

## Step 5: Usage Examples

### Saving Chat History

```typescript
import { useCosmosChatHistory } from './hooks/useCosmosDB';

const { saveChat, chats, loading, error } = useCosmosChatHistory();

// Save a new chat
const newChat = await saveChat({
  title: "Analysis Discussion",
  summary: "Discussed sales trends",
  chatType: "analysis",
  messageCount: 5,
  lastMessage: "What are the key insights?",
  messages: [...]
});
```

### Saving Charts

```typescript
import { useCosmosCharts } from './hooks/useCosmosDB';

const { saveChart, charts, loading, error } = useCosmosCharts();

// Save a chart
const savedChart = await saveChart({
  chartData: chartData,
  tags: ['sales', 'quarterly'],
  isPublic: false
});
```

### Saving Dashboards

```typescript
import { useCosmosDashboards } from './hooks/useCosmosDB';

const { saveDashboard, dashboards, loading, error } = useCosmosDashboards();

// Save a dashboard
const savedDashboard = await saveDashboard({
  name: "Q4 Sales Dashboard",
  charts: [chart1, chart2, chart3],
  tags: ['sales', 'quarterly'],
  isPublic: false
});
```

## Data Models

### Chat History Document
```typescript
interface ChatHistoryDocument {
  id: string;
  type: 'chat';
  title: string;
  summary: string;
  timestamp: string;
  chatType: 'analysis' | 'charting' | 'insights' | 'general';
  messageCount: number;
  lastMessage: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  userId?: string;
  sessionId?: string;
}
```

### Chart Document
```typescript
interface ChartDocument {
  id: string;
  type: 'chart';
  chartData: ChartData;
  analysisId?: string;
  dashboardId?: string;
  userId?: string;
  sessionId?: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  isPublic?: boolean;
}
```

### Dashboard Document
```typescript
interface DashboardDocument {
  id: string;
  type: 'dashboard';
  name: string;
  description?: string;
  charts: ChartData[];
  layout?: Array<{
    chartId: string;
    x: number;
    y: number;
    w: number;
    h: number;
  }>;
  userId?: string;
  sessionId?: string;
  createdAt: string;
  updatedAt: string;
  isPublic?: boolean;
  tags?: string[];
}
```

## Security Considerations

1. **Never commit your `.env` file** - Add it to `.gitignore`
2. **Use environment-specific keys** for different deployments
3. **Implement proper user authentication** before using in production
4. **Set up proper RBAC** (Role-Based Access Control) in CosmosDB

## Troubleshooting

### Common Issues

1. **Connection Errors**: Verify your endpoint and key are correct
2. **Permission Errors**: Ensure your key has read/write permissions
3. **Container Not Found**: Make sure containers are created in your database
4. **Rate Limiting**: Implement retry logic for production use

### Debug Mode

Enable debug logging by setting:
```env
VITE_DEBUG_COSMOSDB=true
```

## Production Deployment

1. Use Azure Key Vault for secure key management
2. Implement proper error handling and retry logic
3. Set up monitoring and alerting
4. Configure backup and disaster recovery
5. Implement data retention policies

## Cost Optimization

1. Use appropriate partition keys
2. Implement data archiving for old records
3. Monitor RU (Request Unit) consumption
4. Use serverless tier for development
5. Implement caching where appropriate
