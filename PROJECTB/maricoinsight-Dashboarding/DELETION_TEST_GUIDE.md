# Individual Deletion Test Guide

## How to Test Individual Deletion Functionality

### 1. **Chart Deletion** (Deletes Everything)
- **What to do**: Click the X button on the main chart area
- **What happens**: The entire chart AND all its insights (key findings + recommendations) are removed
- **Console message**: `🗑️ DELETING ENTIRE CHART: {chartId, dashboardId}`
- **Tooltip**: "Delete Entire Chart (Chart + All Insights)"

### 2. **Key Finding Deletion** (Deletes Only Key Finding)
- **What to do**: Click the X button on the Key Finding card (amber/yellow card)
- **What happens**: Only the Key Finding is removed, the chart and recommendation remain
- **Console message**: `🗑️ DELETING KEYFINDING ONLY: {chartId, insightType, dashboardId}`
- **Tooltip**: "Delete Key Finding Only (Chart Remains)"

### 3. **Recommendation Deletion** (Deletes Only Recommendation)
- **What to do**: Click the X button on the Recommendation card (green card)
- **What happens**: Only the Recommendation is removed, the chart and key finding remain
- **Console message**: `🗑️ DELETING RECOMMENDATION ONLY: {chartId, insightType, dashboardId}`
- **Tooltip**: "Delete Recommendation Only (Chart Remains)"

## Test Scenarios

### Scenario 1: Delete Only Key Finding
1. Create a dashboard with a chart that has both key finding and recommendation
2. Click X on the Key Finding card
3. Verify: Chart remains, Recommendation remains, Key Finding is gone

### Scenario 2: Delete Only Recommendation
1. Create a dashboard with a chart that has both key finding and recommendation
2. Click X on the Recommendation card
3. Verify: Chart remains, Key Finding remains, Recommendation is gone

### Scenario 3: Delete Entire Chart
1. Create a dashboard with a chart that has both key finding and recommendation
2. Click X on the main chart area
3. Verify: Everything is gone (chart + key finding + recommendation)

### Scenario 4: Mixed Deletions
1. Create a dashboard with multiple charts, each having insights
2. Delete individual insights from different charts
3. Delete entire charts
4. Verify: Each deletion works independently

## Console Debugging

Open browser console to see detailed deletion logs:
- Chart deletions show what's being removed
- Insight deletions show which specific insight type
- All deletions include chart and dashboard IDs for tracking

## Visual Indicators

- **Chart X buttons**: Located in top-right of chart area
- **Key Finding X buttons**: Located in top-right of amber/yellow insight cards
- **Recommendation X buttons**: Located in top-right of green insight cards
- **Hover effects**: All X buttons turn red on hover
- **Tooltips**: Hover over X buttons to see what will be deleted
