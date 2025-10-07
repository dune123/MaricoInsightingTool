# Chart Type Consistency Fix

## Issue
When users asked about "Impact of lead times on revenue generated" vs "correlation between lead times and revenue generated", they were getting different charts. The AI was treating "impact" and "correlation" as different types of analysis.

## Solution
Updated AI instructions to ensure both "impact" and "correlation" requests generate the same type of scatter plot chart.

## Changes Made

### File: `frontend/src/dashboard/lib/azure-openai.ts`

**Lines 683-692**: Added chart type consistency requirements to main assistant instructions
```typescript
🚨 **CRITICAL CHART TYPE CONSISTENCY REQUIREMENT**:
- **IMPACT ANALYSIS**: When user asks about "impact of X on Y", ALWAYS create a scatter plot showing correlation between X and Y
- **CORRELATION ANALYSIS**: When user asks about "correlation between X and Y", ALWAYS create a scatter plot showing correlation between X and Y
- **SAME CHART TYPE**: Both "impact" and "correlation" requests should generate IDENTICAL scatter plot charts
- **NO DIFFERENTIATION**: Don't treat "impact" and "correlation" as different analysis types - they are the same
- **EXAMPLES**:
  * "Impact of lead times on revenue" → Scatter plot (lead time vs revenue)
  * "Correlation between lead times and revenue" → Scatter plot (lead time vs revenue)
  * "Impact of price on sales" → Scatter plot (price vs sales)
  * "Correlation between price and sales" → Scatter plot (price vs sales)
```

**Lines 1264-1273**: Added chart type consistency requirements to chat message instructions
```typescript
🚨 **CRITICAL CHART TYPE CONSISTENCY REQUIREMENT**:
- **IMPACT ANALYSIS**: When user asks about "impact of X on Y", ALWAYS create a scatter plot showing correlation between X and Y
- **CORRELATION ANALYSIS**: When user asks about "correlation between X and Y", ALWAYS create a scatter plot showing correlation between X and Y
- **SAME CHART TYPE**: Both "impact" and "correlation" requests should generate IDENTICAL scatter plot charts
- **NO DIFFERENTIATION**: Don't treat "impact" and "correlation" as different analysis types - they are the same
- **EXAMPLES**:
  * "Impact of lead times on revenue" → Scatter plot (lead time vs revenue)
  * "Correlation between lead times and revenue" → Scatter plot (lead time vs revenue)
  * "Impact of price on sales" → Scatter plot (price vs sales)
  * "Correlation between price and sales" → Scatter plot (price vs sales)
```

## Result
- Both "impact" and "correlation" requests now generate identical scatter plot charts
- Consistent chart types regardless of how the user phrases their request
- Better user experience with predictable chart generation
- AI treats "impact" and "correlation" as the same analysis type

## Date
2025-01-07
