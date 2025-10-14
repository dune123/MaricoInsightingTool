import { AzureOpenAIService } from './azure-openai';
import { AzureOpenAIConfig, DocumentAnalysisResult } from './types/chart';

export class AutoAnalysisService {
  private azureService: AzureOpenAIService;

  constructor(config: AzureOpenAIConfig) {
    this.azureService = new AzureOpenAIService(config);
  }

  async analyzeFileOnUpload(file: File): Promise<DocumentAnalysisResult> {
    const analysisPrompt = `
🚨 CRITICAL DATA ANALYSIS REQUIREMENTS:

**STEP 1: LOAD AND EXAMINE THE DATA**
- First, load the uploaded CSV file using pandas
- Print the shape of the dataset (rows, columns)
- Print the first 5 rows to verify data structure
- Print column names and data types
- Verify you have access to ALL rows of data

**STEP 2: COMPREHENSIVE ANALYSIS**
1. **Data Overview**: Complete structure, all columns, data types, and key statistics
2. **Key Insights**: Important patterns, trends, and findings from ALL data
3. **Visualizations**: Generate 3-5 relevant charts using ACTUAL data from the file
4. **Analysis Opportunities**: Suggest specific questions for deeper analysis

**STEP 3: CHART GENERATION REQUIREMENTS**
- **USE ALL DATA POINTS**: For scatter plots, include EVERY single row from the dataset
- **NO PLACEHOLDER DATA**: Never use example values - use actual data from the CSV
- **NO SAMPLING**: Include all 100+ rows, not just 5 data points
- **ACTUAL VALUES**: Extract real Price, Revenue, Lead Time values from the CSV
- **TREND LINES**: Always include trend lines for correlation analysis

**STEP 4: MANDATORY FORMAT**
You MUST use the CHART_DATA_START/CHART_DATA_END format for all charts. No exceptions.

**STEP 5: CHAT RESPONSE REQUIREMENTS**
- **HIDE DATA POINTS**: Never show raw data points in chat responses
- **SHOW METADATA ONLY**: Display chart titles, descriptions, and insights
- **KEEP DATA PRIVATE**: Data points should only be in CHART_DATA_START/END blocks
- **USER-FRIENDLY**: Show chart summaries, not raw numbers
- **NO RAW DATA**: Do not display {"x": value, "y": value} arrays in chat

**EXAMPLE FOR SCATTER PLOTS:**
CHART_DATA_START
{
  "id": "revenue_vs_price",
  "type": "scatter", 
  "title": "Revenue vs Price Analysis",
  "description": "Analysis of relationship between product prices and revenue generation",
  "data": [{"x": 69.81, "y": 8661.99}, {"x": 14.84, "y": 7460.90}, {"x": 11.32, "y": 9577.75}],
  "config": {
    "xKey": "x",
    "yKey": "y", 
    "xAxisLabel": "Price ($)",
    "yAxisLabel": "Revenue ($)",
    "showTrendLine": true,
    "colors": ["#3B82F6"]
  }
}
CHART_DATA_END

**CRITICAL**: Use actual data values from your CSV file, not placeholder examples.
    `;

    try {
      const result = await this.azureService.analyzeDocument(file, analysisPrompt);
      
      // Ensure charts array exists and is valid
      if (!result.charts || !Array.isArray(result.charts)) {
        console.warn('Analysis result missing charts array, creating fallback');
        result.charts = [];
      }
      
      return result;
    } catch (error) {
      console.error('Auto-analysis failed:', error);
      
      // Return a fallback result with basic structure
      return {
        summary: 'Analysis failed - please try asking a specific question about your data.',
        insights: ['Unable to generate automatic analysis. Please ask specific questions about your data.'],
        charts: [],
        assistantId: '',
        threadId: '',
        metadata: {
          error: true,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  async getQuickInsights(file: File): Promise<DocumentAnalysisResult> {
    const quickPrompt = `
🚨 QUICK ANALYSIS - USE ALL DATA POINTS:

**STEP 1: LOAD DATA**
- Load CSV: df = pd.read_csv('filename.csv')
- Print shape: print(f"Dataset: {df.shape[0]} rows, {df.shape[1]} columns")

**STEP 2: QUICK ANALYSIS**
- Data structure summary from ALL rows
- Key metrics and statistics from complete dataset
- 2-3 most important visualizations using ALL data points
- Top 3 insights from full dataset analysis

**STEP 3: CHART REQUIREMENTS**
- Use ALL data points for scatter plots
- NO placeholder data - use actual CSV values
- Include trend lines for correlation analysis
- Use CHART_DATA_START/CHART_DATA_END format

**CRITICAL**: Include all 100+ rows in your analysis, not just samples.
    `;

    return await this.azureService.analyzeDocument(file, quickPrompt);
  }

  async getComprehensiveAnalysis(file: File): Promise<DocumentAnalysisResult> {
    const comprehensivePrompt = `
🚨 COMPREHENSIVE DATA ANALYSIS - USE ALL DATA POINTS:

**MANDATORY DATA LOADING STEPS:**
1. Load CSV: df = pd.read_csv('filename.csv')
2. Print shape: print(f"Dataset: {df.shape[0]} rows, {df.shape[1]} columns")
3. Print columns: print("Available columns:", df.columns.tolist())
4. Print sample: print(df.head())

**ANALYSIS REQUIREMENTS:**
1. **Executive Summary**: Key findings from ALL data points
2. **Data Quality**: Complete assessment of all rows and columns
3. **Statistical Analysis**: Correlations using ALL data points (not samples)
4. **Business Insights**: Revenue opportunities from complete dataset
5. **Strategic Recommendations**: Based on full data analysis
6. **Visualizations**: 5-7 charts using ALL data points from the CSV

**CHART GENERATION - CRITICAL:**
- For scatter plots: Include ALL rows from the dataset
- Use actual values: df[['Price', 'Revenue']].values for all data points
- NO sampling, NO placeholder data, NO examples
- Include trend lines for correlation analysis

**EXAMPLE - REVENUE VS PRICE (using ALL data):**
CHART_DATA_START
{
  "id": "revenue_vs_price_full",
  "type": "scatter",
  "title": "Revenue vs Price - Complete Dataset Analysis", 
  "description": "Full correlation analysis using all data points from the CSV file",
  "data": [{"x": 69.81, "y": 8661.99}, {"x": 14.84, "y": 7460.90}, {"x": 11.32, "y": 9577.75}, {"x": 61.16, "y": 7766.84}, {"x": 4.81, "y": 2686.51}],
  "config": {
    "xKey": "x",
    "yKey": "y",
    "xAxisLabel": "Price ($)",
    "yAxisLabel": "Revenue ($)", 
    "showTrendLine": true,
    "colors": ["#3B82F6"]
  }
}
CHART_DATA_END

**CRITICAL**: Replace the example data above with ACTUAL data from your CSV file. Include ALL 100+ rows.

**CHAT RESPONSE REQUIREMENTS:**
- **HIDE DATA POINTS**: Never show raw data points in chat responses
- **SHOW METADATA ONLY**: Display chart titles, descriptions, and insights
- **KEEP DATA PRIVATE**: Data points should only be in CHART_DATA_START/END blocks
- **USER-FRIENDLY**: Show chart summaries, not raw numbers
    `;

    return await this.azureService.analyzeDocument(file, comprehensivePrompt);
  }

  async analyzeAllDataPoints(file: File): Promise<DocumentAnalysisResult> {
    const allDataPrompt = `
🚨 CRITICAL: ANALYZE ALL DATA POINTS - NO SAMPLING ALLOWED:

**MANDATORY STEPS:**
1. Load CSV: df = pd.read_csv('filename.csv')
2. Print: print(f"FULL DATASET: {df.shape[0]} rows, {df.shape[1]} columns")
3. Print: print("Columns:", df.columns.tolist())
4. Print: print("First 10 rows:"); print(df.head(10))

**ANALYSIS REQUIREMENTS:**
- Use ALL ${100}+ rows for scatter plots
- NO sampling, NO aggregation, NO placeholder data
- Extract actual values: df[['Price', 'Revenue generated']].values
- Include trend lines for correlation analysis
- Generate 3-5 charts showing ALL data points

**EXAMPLE CHART FORMAT:**
CHART_DATA_START
{
  "id": "revenue_vs_price_all_data",
  "type": "scatter",
  "title": "Revenue vs Price - Complete Dataset (${100}+ points)",
  "description": "Full correlation analysis using ALL data points from CSV",
  "data": [{"x": 69.81, "y": 8661.99}, {"x": 14.84, "y": 7460.90}, {"x": 11.32, "y": 9577.75}],
  "config": {
    "xKey": "x",
    "yKey": "y",
    "xAxisLabel": "Price ($)",
    "yAxisLabel": "Revenue ($)",
    "showTrendLine": true,
    "colors": ["#3B82F6"]
  }
}
CHART_DATA_END

**CRITICAL**: Replace example data with ACTUAL data from your CSV. Include ALL rows.

**CHAT RESPONSE REQUIREMENTS:**
- **HIDE DATA POINTS**: Never show raw data points in chat responses
- **SHOW METADATA ONLY**: Display chart titles, descriptions, and insights
- **KEEP DATA PRIVATE**: Data points should only be in CHART_DATA_START/END blocks
- **USER-FRIENDLY**: Show chart summaries, not raw numbers
    `;

    return await this.azureService.analyzeDocument(file, allDataPrompt);
  }
}
