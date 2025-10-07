# Scatter Plot No Aggregation + Trend Line Implementation

## Issue
For scatter plots, the AI was aggregating data (summing/averaging multiple values for the same X-axis value), but scatter plots should show ALL individual data points to properly analyze correlations and relationships.

## Requirements
1. **No Aggregation for Scatter Plots**: Show all individual data points, not aggregated values
2. **Trend Line Required**: Always include a trend line on scatter plots to show the relationship
3. **All Data Points**: Show every single data point in scatter plots for correlation analysis

## Changes Made

### 1. Updated AI Instructions (`azure-openai.ts`)

**Added Scatter Plot Exception to Main Instructions** (lines 619-627):
```typescript
🚨 **SCATTER PLOT EXCEPTION - NO AGGREGATION**:
- **SCATTER PLOTS**: For scatter plots, DO NOT aggregate data - plot ALL individual data points
- **TREND LINE REQUIRED**: Always include a trend line on scatter plots to show the relationship
- **ALL DATA POINTS**: Show every single data point in scatter plots for correlation analysis
- **EXAMPLES**:
  * Bar charts: Aggregate by categories (sum/average)
  * Line charts: Aggregate by time periods (sum/average)
  * Pie charts: Aggregate by categories (sum)
  * **Scatter plots: NO aggregation - show all individual points with trend line**
```

**Updated Code Interpreter Examples** (lines 655-656):
```typescript
- **For scatter plots: NO aggregation - use df directly with all individual data points**
- **For scatter plots: Add trend line using matplotlib/seaborn regression line**
```

**Updated Chat Message Instructions** (lines 1320-1328):
```typescript
🚨 **SCATTER PLOT EXCEPTION - NO AGGREGATION**:
- **SCATTER PLOTS**: For scatter plots, DO NOT aggregate data - plot ALL individual data points
- **TREND LINE REQUIRED**: Always include a trend line on scatter plots to show the relationship
- **ALL DATA POINTS**: Show every single data point in scatter plots for correlation analysis
```

**Updated Scatter Chart Example** (lines 839-871):
```typescript
SCATTER CHART FORMAT EXAMPLE (ALL INDIVIDUAL DATA POINTS + TREND LINE):
{
  "id": "lead_time_revenue_correlation",
  "type": "scatter",
  "title": "Correlation Between Lead Times and Revenue Generated",
  "data": [
    {"leadTime": 5, "revenue": 15000},
    {"leadTime": 5, "revenue": 12000},  // Multiple points for same X value
    {"leadTime": 8, "revenue": 18000},
    {"leadTime": 8, "revenue": 14000},  // Multiple points for same X value
    // ... all individual data points
  ],
  "config": {
    "xKey": "leadTime",
    "yKey": "revenue",
    "xAxisLabel": "Lead Times (Days)",
    "yAxisLabel": "Revenue Generated ($)",
    "showTrendLine": true  // New property for trend line
  }
}
```

### 2. Updated Frontend Chart Types (`types/chart.ts`)

**Added showTrendLine Property** (line 18):
```typescript
config: {
  // ... existing properties
  showTrendLine?: boolean;
  // ... other properties
}
```

### 3. Updated Frontend Chart Rendering (`DashboardCharts.tsx`)

**Added ReferenceLine Import** (line 20):
```typescript
import {
  // ... existing imports
  ReferenceLine
} from 'recharts';
```

**Added Trend Line Support to Scatter Plot** (lines 626-638):
```typescript
<Scatter fill={colors[0]} />
{chart.config.showTrendLine && (
  <ReferenceLine 
    segment={[
      { x: Math.min(...sortedScatterData.map(d => Number(d[safeConfig.xKey || 'x']))), 
        y: Math.min(...sortedScatterData.map(d => Number(d[safeConfig.yKey as string]))) },
      { x: Math.max(...sortedScatterData.map(d => Number(d[safeConfig.xKey || 'x']))), 
        y: Math.max(...sortedScatterData.map(d => Number(d[safeConfig.yKey as string]))) }
    ]}
    stroke="#ef4444"
    strokeWidth={2}
    strokeDasharray="5 5"
  />
)}
```

## Result

### For Scatter Plots:
- ✅ **No Aggregation**: All individual data points are plotted, not aggregated values
- ✅ **Trend Line**: Red dashed trend line is displayed on scatter plots
- ✅ **All Data Points**: Every single data point from the dataset is shown
- ✅ **Correlation Analysis**: Proper correlation analysis with all data points

### For Other Chart Types:
- ✅ **Aggregation Still Applied**: Bar charts, line charts, and pie charts still aggregate data appropriately
- ✅ **Business Insights**: Other chart types continue to show meaningful business insights through aggregation

## Examples

### Before (Aggregated Scatter Plot):
```json
{
  "data": [
    {"leadTime": 5, "totalRevenue": 27000},   // Aggregated: 15000 + 12000
    {"leadTime": 8, "totalRevenue": 32000},   // Aggregated: 18000 + 14000
    {"leadTime": 10, "totalRevenue": 18000}   // Aggregated: 10000 + 8000
  ]
}
```

### After (All Individual Data Points):
```json
{
  "data": [
    {"leadTime": 5, "revenue": 15000},       // Individual point 1
    {"leadTime": 5, "revenue": 12000},       // Individual point 2
    {"leadTime": 8, "revenue": 18000},       // Individual point 3
    {"leadTime": 8, "revenue": 14000},       // Individual point 4
    {"leadTime": 10, "revenue": 10000},      // Individual point 5
    {"leadTime": 10, "revenue": 8000}        // Individual point 6
  ],
  "config": {
    "showTrendLine": true
  }
}
```

## Date
2025-01-07
