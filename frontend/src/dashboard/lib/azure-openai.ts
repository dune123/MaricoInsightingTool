import { ChartData, AnalysisResult } from '../types/chart';
// Updated ChartData interface with file_id, url, loaded properties

interface AzureOpenAIConfig {
  apiKey: string;
  endpoint: string;
  deploymentName: string;
}

interface DocumentAnalysisResult {
  analysis: AnalysisResult;
  assistantId: string;
  threadId: string;
}

interface InsightsBotSession {
  assistantId: string;
  threadId: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  charts?: any[];
  timestamp: Date;
}
interface Assistant {
  id: string;
  object: string;
  created_at: number;
  name: string;
  description: string;
  model: string;
  instructions: string;
  tools: any[];
}

interface FileObject {
  id: string;
  object: string;
  bytes: number;
  created_at: number;
  filename: string;
  purpose: string;
}

interface Thread {
  id: string;
  object: string;
  created_at: number;
}

interface Run {
  id: string;
  object: string;
  created_at: number;
  assistant_id: string;
  thread_id: string;
  status: string;
  completed_at?: number;
  failed_at?: number;
  last_error?: any;
}

interface Message {
  id: string;
  object: string;
  created_at: number;
  thread_id: string;
  role: string;
  content: any[];
}

export class AzureOpenAIService {
  private config: AzureOpenAIConfig;
  private baseUrl: string;
  private apiVersion = '2024-05-01-preview';

  constructor(config: AzureOpenAIConfig) {
    this.config = config;
    this.baseUrl = config.endpoint.endsWith('/') ? config.endpoint.slice(0, -1) : config.endpoint;
  }

  private async makeRequest(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
    return this.makeRequestWithRetry(endpoint, method, body);
  }

  private async makeRequestWithRetry(
    endpoint: string, 
    method: string = 'GET', 
    body?: any, 
    retryCount: number = 0
  ): Promise<any> {
    const maxRetries = 5;
    const baseDelay = 5000; // 5 seconds base delay
    
    const url = `${this.baseUrl}/openai/${endpoint}?api-version=${this.apiVersion}`;
    
    const headers: Record<string, string> = {
      'api-key': this.config.apiKey,
    };

    if (body && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle rate limiting with exponential backoff
        if (response.status === 429 && retryCount < maxRetries) {
          const delay = baseDelay * Math.pow(2, retryCount); // Exponential backoff
          const jitter = Math.random() * 1000; // Add jitter to prevent thundering herd
          const totalDelay = delay + jitter;
          
          console.log(`Rate limit exceeded. Retrying in ${Math.round(totalDelay / 1000)} seconds... (Attempt ${retryCount + 1}/${maxRetries})`);
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, totalDelay));
          
          // Recursive retry with incremented count
          return this.makeRequestWithRetry(endpoint, method, body, retryCount + 1);
        }
        
        // If not a rate limit error or max retries exceeded, throw error
        if (response.status === 429) {
          throw new Error(`Rate limit exceeded. Maximum retries (${maxRetries}) reached. Please try again later.`);
        }
        
        throw new Error(`Azure OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      return response.json();
    } catch (error) {
      // Handle network errors with retry logic
      if (retryCount < maxRetries && (error instanceof TypeError || error.message.includes('fetch'))) {
        const delay = baseDelay * Math.pow(2, retryCount);
        const jitter = Math.random() * 1000;
        const totalDelay = delay + jitter;
        
        console.log(`Network error occurred. Retrying in ${Math.round(totalDelay / 1000)} seconds... (Attempt ${retryCount + 1}/${maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, totalDelay));
        return this.makeRequestWithRetry(endpoint, method, body, retryCount + 1);
      }
      
      throw error;
    }
  }

  async analyzeDocument(file: File): Promise<DocumentAnalysisResult> {
    try {
      console.log('Starting document analysis with rate limit protection...');
      
      // Step 1: Create or get assistant
      console.log('Creating assistant...');
      const assistant = await this.createAssistant();
      
      // Step 2: Upload file
      console.log('Uploading file...');
      const uploadedFile = await this.uploadFile(file);
      
      // Step 3: Create thread
      console.log('Creating thread...');
      const thread = await this.createThread();
      
      // Step 4: Add message to thread with file attachment
      console.log('Adding message to thread...');
      await this.addMessageToThread(thread.id, file.name, uploadedFile.id);
      
      // Step 5: Create and run the assistant
      console.log('Creating and running assistant...');
      const run = await this.createRun(thread.id, assistant.id);
      
      // Step 6: Wait for completion and get results
      console.log('Waiting for analysis completion...');
      const completedRun = await this.waitForRunCompletion(thread.id, run.id);
      
      if (completedRun.status === 'failed') {
        throw new Error(`Analysis failed: ${completedRun.last_error?.message || 'Unknown error'}`);
      }
      
      // Step 7: Get messages from thread
      console.log('Retrieving analysis results...');
      const messages = await this.getThreadMessages(thread.id);
      
      // Step 8: Parse results
      const analysisResult = this.parseAnalysisResults(messages, file);
      
      // Step 9: Retrieve chart images if any were generated
      if (analysisResult.charts.length > 0) {
        console.log(`Retrieving ${analysisResult.charts.length} generated charts...`);
        for (let i = 0; i < analysisResult.charts.length; i++) {
          const chart = analysisResult.charts[i];
          if (chart.file_id) {
            try {
              const imageDataUrl = await this.retrieveFileContent(chart.file_id);
              analysisResult.charts[i] = {
                ...chart,
                url: imageDataUrl,
                loaded: true
              };
              console.log(`Successfully retrieved chart ${i + 1}`);
            } catch (error) {
              console.error(`Failed to retrieve chart ${i + 1}:`, error);
              analysisResult.charts[i] = {
                ...chart,
                loaded: false,
                error: error instanceof Error ? error.message : 'Failed to load image'
              };
            }
          }
        }
      }
      
      console.log('Document analysis completed successfully');
      // Don't cleanup the uploaded file - keep it for future chat messages
      // The file needs to remain attached to the thread for ongoing conversations
      
      return {
        analysis: analysisResult,
        assistantId: assistant.id,
        threadId: thread.id
      };
    } catch (error) {
      console.error('Document analysis failed:', error);
      
      // Provide more user-friendly error messages
      if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
        throw new Error(`The AI service is currently busy. Please wait a moment and try again. ${error.message}`);
      }
      
      throw new Error(`Failed to analyze document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getColumnNames(file: File): Promise<string[]> {
    try {
      // Step 1: Create or get assistant for quick column analysis
      const assistant = await this.createColumnAnalysisAssistant();
      
      // Step 2: Upload file
      const uploadedFile = await this.uploadFile(file);
      
      // Step 3: Create thread
      const thread = await this.createThread();
      
      // Step 4: Add message to thread with file attachment for column analysis
      await this.addColumnAnalysisMessage(thread.id, file.name, uploadedFile.id);
      
      // Step 5: Create and run the assistant
      const run = await this.createRun(thread.id, assistant.id);
      
      // Step 6: Wait for completion and get results
      const completedRun = await this.waitForRunCompletion(thread.id, run.id);
      
      if (completedRun.status === 'failed') {
        throw new Error(`Column analysis failed: ${completedRun.last_error?.message || 'Unknown error'}`);
      }
      
      // Step 7: Get messages from thread
      const messages = await this.getThreadMessages(thread.id);
      
      // Step 8: Parse column names from results
      const columnNames = this.parseColumnNames(messages);
      
      // Cleanup
      await this.cleanupFile(uploadedFile.id);
      await this.cleanupThread(thread.id);
      await this.cleanupAssistant(assistant.id);
      
      return columnNames;
    } catch (error) {
      console.error('Column analysis failed:', error);
      throw new Error(`Failed to get column names: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async createColumnAnalysisAssistant(): Promise<Assistant> {
    return this.makeRequest('assistants', 'POST', {
      model: this.config.deploymentName,
      name: 'Column Analyzer',
      description: 'An assistant that quickly identifies column names in data files',
      instructions: `You are a data analysis assistant focused on quickly identifying column names in data files.

When given a data file (CSV, Excel, etc.), your task is to:
1. Load the file using code interpreter
2. Identify and list ALL column names
3. Return ONLY the column names in a simple, clean format
4. Do not perform any analysis beyond identifying columns

Format your response as:
COLUMNS: column1, column2, column3, etc.

Be concise and focus only on column identification.`,
      tools: [
        { type: 'code_interpreter' }
      ]
    });
  }

  private async addColumnAnalysisMessage(threadId: string, fileName: string, fileId: string): Promise<Message> {
    return this.makeRequest(`threads/${threadId}/messages`, 'POST', {
      role: 'user',
      content: `Please identify and list all column names in this file: ${fileName}. 
      
Use the code interpreter to load the file and extract only the column names. 
Return the column names in the format: COLUMNS: column1, column2, column3, etc.

Do not perform any analysis beyond identifying the columns.`,
      attachments: [
        {
          file_id: fileId,
          tools: [{ type: 'code_interpreter' }]
        }
      ]
    });
  }

  private parseColumnNames(messages: Message[]): string[] {
    // Find the assistant's response
    const assistantMessages = messages.filter(msg => msg.role === 'assistant');
    
    if (!assistantMessages.length) {
      return [];
    }

    let fullContent = '';
    for (const message of assistantMessages) {
      if (!message.content) continue;
      
      for (const contentItem of message.content) {
        if (contentItem.type === 'text') {
          fullContent += contentItem.text.value + '\n';
        }
      }
    }

    // Look for the COLUMNS: pattern
    const columnsMatch = fullContent.match(/COLUMNS:\s*(.+)/i);
    if (columnsMatch && columnsMatch[1]) {
      return columnsMatch[1]
        .split(',')
        .map(col => col.trim())
        .filter(col => col.length > 0);
    }

    // Fallback: try to extract column-like patterns
    const lines = fullContent.split('\n');
    for (const line of lines) {
      if (line.includes(',') && line.length < 200) {
        const potentialColumns = line
          .split(',')
          .map(col => col.trim())
          .filter(col => col.length > 0 && col.length < 50);
        
        if (potentialColumns.length > 1) {
          return potentialColumns;
        }
      }
    }

    return [];
  }

  private async cleanupThread(threadId: string): Promise<void> {
    try {
      await this.makeRequest(`threads/${threadId}`, 'DELETE');
    } catch (error) {
      console.warn('Thread cleanup failed:', error);
    }
  }

  private async cleanupAssistant(assistantId: string): Promise<void> {
    try {
      await this.makeRequest(`assistants/${assistantId}`, 'DELETE');
    } catch (error) {
      console.warn('Assistant cleanup failed:', error);
    }
  }

  private async createInsightsAssistant(): Promise<Assistant> {
    const assistantPayload = {
      model: this.config.deploymentName,
      name: 'Business Insights Consultant',
      description: 'A professional data analyst and business consultant providing comprehensive, structured, and textual insights based on actual data.',
      instructions: `You are a senior business consultant and data analyst specializing in translating data into actionable business strategy. Your role is to provide data-driven insights that directly influence business decisions.

CRITICAL REQUIREMENTS:
1.  **MANDATORY CODE INTERPRETER USE**: You MUST use the code interpreter to analyze the ACTUAL uploaded file for every query. All insights, statistics, and recommendations MUST be derived directly from this analysis.
2.  **DYNAMIC, REAL NUMBERS ONLY**: All numbers, percentages, and metrics MUST be extracted directly from the data analysis performed by the code interpreter. Do not use placeholder or example numbers.
3.  **DIRECTLY ANSWER THE QUESTION**: Focus your analysis and response to directly answer the user's specific question.
4.  **NO CHARTS OR VISUALIZATIONS**: Absolutely DO NOT create, generate, or reference any charts, graphs, plots, or visualizations. Your output must be purely textual.
5.  **BUSINESS CONTEXT**: Translate every number into what it means for business performance, opportunities, or risks.
6.  **ACTIONABLE RECOMMENDATIONS**: Provide specific, implementable suggestions based on the data patterns you discover.
7.  **COMPARATIVE ANALYSIS**: When possible, compare performance across categories, time periods, or segments using actual figures.

MANDATORY RESPONSE STRUCTURE:
You MUST structure your response using the following headings, ensuring all points are backed by dynamic, real numbers from the data:

**Key Statistics**
- Present the most important high-level metrics that directly address the user's question.
- Include overall totals, averages, and key counts relevant to the query.
- Example: "Total Revenue Generated: $577,604.82", "Top Performing Product Category: Skincare, contributing $89,756 (34% higher than Haircare)"

**Key Insights**
- Identify the primary factors that influence the target variable (whatever the user is asking about)
- Focus on business-relevant comparisons and patterns found in the data
- Include specific numbers, percentages, and performance differences

- Provide specific, implementable actions derived directly from the insights
- Each recommendation MUST be backed by numbers and explain the expected impact
- Adapt recommendations to the type of data and business context

**Next Steps**
- Suggest clear, measurable follow-up actions or further analysis
- Include specific targets or monitoring metrics where appropriate
- Focus on actionable next steps relevant to the data and insights found

ANALYSIS PROCESS:
1. **Examine Data Structure**: First, load and explore the dataset to understand what columns/variables are available
2. **Identify Key Dimensions**: Determine what categorical variables, time periods, or segments exist that could influence the target variable
3. **Perform Relevant Analysis**: Based on the data structure, analyze the most relevant factors (this could be product categories, geographic regions, time periods, customer segments, operational metrics, etc.)
4. **Focus on Business Impact**: Translate findings into business-relevant insights with specific numbers and percentages
5. **Provide Actionable Recommendations**: Based on the patterns found, suggest specific actions with expected impact

Remember: You are a strategic business advisor who uses data to drive recommendations. Every number should tell a story that leads to actionable business decisions.
`,
      tools: [
        { type: 'code_interpreter' }
      ]
    };
    
    // Store the actual payload for debugging
    if (typeof window !== 'undefined') {
      (window as any).lastInsightsAssistantPayload = assistantPayload;
    }
    
    return this.makeRequest('assistants', 'POST', assistantPayload);
  }

  async createInsightsBotSession(): Promise<InsightsBotSession> {
    try {
      console.log('Creating insights bot session...');
      
      // Step 1: Create insights assistant
      const assistant = await this.createInsightsAssistant();
      
      // Step 2: Create thread
      const thread = await this.createThread();
      
      console.log('Insights bot session created successfully');
      return {
        assistantId: assistant.id,
        threadId: thread.id
      };
    } catch (error) {
      console.error('Failed to create insights bot session:', error);
      throw new Error(`Failed to create insights bot session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createInsightsBotSessionWithFile(file: File, initialMessage: string): Promise<{
    assistantId: string;
    threadId: string;
    message: ChatMessage;
  }> {
    try {
      console.log('Creating insights bot session with file...');
      
      // Step 1: Create insights assistant with correct instructions
      const assistant = await this.createInsightsAssistant();
      
      // Step 2: Upload file
      const uploadedFile = await this.uploadFile(file);
      
      // Step 3: Create thread
      const thread = await this.createThread();
      
      // Step 4: Send initial message with file attachment
      const messageResponse = await this.sendInsightsChatMessage(
        thread.id,
        assistant.id,
        initialMessage,
        uploadedFile.id
      );
      
      console.log('Insights bot session with file created successfully');
      return {
        assistantId: assistant.id,
        threadId: thread.id,
        message: messageResponse
      };
    } catch (error) {
      console.error('Failed to create insights bot session with file:', error);
      throw new Error(`Failed to create insights bot session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async sendInsightsChatMessage(threadId: string, assistantId: string, messageContent: string, fileId?: string): Promise<ChatMessage> {
    try {
      console.log('Sending insights chat message...');
      
      const messagePayload = {
        role: 'user',
        content: messageContent,
        ...(fileId && {
          attachments: [
            {
              file_id: fileId,
              tools: [{ type: 'code_interpreter' }]
            }
          ]
        })
      };
      
      // Store the actual message payload for debugging
      if (typeof window !== 'undefined') {
        (window as any).lastInsightsMessagePayload = messagePayload;
      }
      
      // Step 1: Add user message to thread
      await this.makeRequest(`threads/${threadId}/messages`, 'POST', messagePayload);

      const runPayload = {
        assistant_id: assistantId
      };
      
      // Store the run payload for debugging
      if (typeof window !== 'undefined') {
        (window as any).lastInsightsRunPayload = runPayload;
      }
      
      // Step 2: Create and run the assistant
      const run = await this.makeRequest(`threads/${threadId}/runs`, 'POST', runPayload);

      // Step 3: Wait for completion
      const completedRun = await this.waitForRunCompletion(threadId, run.id);

      if (completedRun.status === 'failed') {
        throw new Error(`Insights chat failed: ${completedRun.last_error?.message || 'Unknown error'}`);
      }

      // Step 4: Get latest messages
      const messages = await this.getThreadMessages(threadId);

      // Step 5: Find the latest assistant message
      const assistantMessages = messages.filter(msg => msg.role === 'assistant');
      if (!assistantMessages.length) {
        throw new Error('No assistant response found');
      }

      const latestMessage = assistantMessages[0]; // Messages are ordered newest first
      
      // Step 6: Extract text content (no charts for insights bot)
      let content = '';
      
      if (latestMessage.content && Array.isArray(latestMessage.content)) {
        for (const contentItem of latestMessage.content) {
          if (contentItem.type === 'text') {
            content += contentItem.text.value;
          }
        }
      }
      
      // Clean up markdown formatting for better readability
      content = this.cleanMarkdownFormatting(content);
      
      // Remove any chart data blocks that might have been generated accidentally
      content = this.removeChartDataBlocks(content);

      console.log('Insights chat message completed successfully');
      return {
        id: latestMessage.id,
        role: 'assistant',
        content: content || 'I apologize, but I couldn\'t generate a response. Please try again.',
        charts: [], // No charts for insights bot
        timestamp: new Date(latestMessage.created_at * 1000)
      };

    } catch (error) {
      console.error('Insights chat message failed:', error);
      
      if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
        throw new Error(`The AI service is currently busy. Please wait a moment and try again. ${error.message}`);
      }
      
      throw new Error(`Failed to send insights chat message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async createAssistant(): Promise<Assistant> {
    return this.makeRequest('assistants', 'POST', {
      model: this.config.deploymentName,
      name: 'Document Analyzer',
      description: 'An assistant that analyzes documents and provides insights',
      instructions: `You are a data visualization specialist and business analyst. Your PRIMARY MISSION is to create insightful, actionable charts that tell compelling business stories with COMPLETE, PRECISE data.

CRITICAL CHART-FIRST APPROACH:
1. **CHARTS ARE YOUR PRIMARY OUTPUT**: Your main job is to generate 3-4 meaningful charts using CHART_DATA_START/END blocks
2. **MINIMAL CHAT TEXT**: Keep your chat response brief - just acknowledge the request and mention how many charts you've generated
3. **ALL INSIGHTS GO IN CHARTS**: Every insight, recommendation, and analysis must be embedded within the chart descriptions

CRITICAL DATA AGGREGATION REQUIREMENT - THIS IS NON-NEGOTIABLE:
- **AGGREGATE PROPERLY**: When multiple values exist for the same category/date/metric, you MUST aggregate them (sum, average, count, etc.)
- **RELEVANT BUSINESS CHARTS**: Create charts that show meaningful business insights, not raw individual data points
- **EXAMPLE**: If lead time 30 has revenues of 7000 and 3000, aggregate to show total revenue of 10000 for lead time 30
- **NO RAW DATA DUMPING**: Don't just plot every individual row - create meaningful aggregated visualizations
- **BUSINESS LOGIC**: Group by relevant dimensions (time periods, categories, segments) and aggregate metrics appropriately

🚨 **SCATTER PLOT EXCEPTION - NO AGGREGATION**:
- **SCATTER PLOTS**: For scatter plots, DO NOT aggregate data - plot ALL individual data points
- **TREND LINE REQUIRED**: Always include a trend line on scatter plots to show the relationship
- **ALL DATA POINTS**: Show every single data point in scatter plots for correlation analysis
- **CRITICAL**: For scatter plots, NEVER use groupby() or aggregation - show every single row
- **FORBIDDEN FOR SCATTER PLOTS**: 
  * ❌ df.groupby('leadTime')['revenue'].sum() - NEVER DO THIS
  * ❌ df.groupby('leadTime')['revenue'].mean() - NEVER DO THIS
  * ❌ df.groupby('leadTime')['revenue'].count() - NEVER DO THIS
  * ❌ Any aggregation or grouping for scatter plots
- **REQUIRED FOR SCATTER PLOTS**:
  * ✅ Use df directly - df[['leadTime', 'revenue']]
  * ✅ Show every single row as individual data points
  * ✅ Include trend line with showTrendLine: true
- **VALIDATION CHECK**:
  * ✅ If you see 30 data points instead of 100+, you've aggregated - STOP and fix
  * ✅ If you used groupby() for scatter plots, you've failed - STOP and fix
  * ✅ If you see duplicate lead times, you've aggregated - STOP and fix
- **EXAMPLES**:
  * Bar charts: Aggregate by categories (sum/average)
  * Line charts: Aggregate by time periods (sum/average)
  * Pie charts: Aggregate by categories (sum)
  * **Scatter plots: NO aggregation - show all individual points with trend line**

🚨 **SCATTER PLOT EXAMPLE - EXACTLY WHAT TO DO**:
✅ CORRECT - For scatter plots, use df directly: scatter_data = df[['leadTime', 'revenue']].to_dict('records')
✅ This gives you ALL individual data points

❌ WRONG - Never do this for scatter plots: aggregated_data = df.groupby('leadTime')['revenue'].sum().reset_index()

CRITICAL JSON FORMAT REQUIREMENT:
- **MANDATORY**: The "data" field MUST contain actual JSON arrays with real data values
- **FORBIDDEN**: Never use variable names like "product_distribution_data" or "my_data_variable"
- **REQUIRED FORMAT**: "data": [{"category": "Electronics", "value": 2400}, {"category": "Clothing", "value": 1800}]
- **NEVER USE**: "data": variable_name_here

MANDATORY CHART GENERATION PROCESS:
1. **Analyze the data structure** using code interpreter - load the COMPLETE dataset
2. **Identify 3-4 key business questions** the data can answer
3. **AGGREGATE DATA PROPERLY**: Use pandas groupby() and aggregation functions:
   - **For scatter plots: NO AGGREGATION - use df directly with ALL individual data points**
   - For bar charts: Group by categories, sum/average values
   - For line charts: Group by time periods, sum/average metrics
   - For pie charts: Group by categories, sum values
4. **Create meaningful visualizations**: Charts should show business insights, not raw data dumps
5. **Generate aggregated data arrays**: Each chart should contain properly aggregated data that tells a business story
6. **VALIDATE AXIS LABELS**: Before finalizing each chart, ensure:
   - xAxisLabel contains descriptive field name (e.g., "Lead Times (Days)")
   - yAxisLabel contains descriptive field name (e.g., "Revenue Generated ($)")
   - NO generic labels like "X-Axis" or "Y-Axis"
   - Labels match the actual data being analyzed

CODE INTERPRETER AGGREGATION AND STATISTICAL ANALYSIS:
Use pandas groupby() and aggregation functions:
- For category revenue bar chart: df_aggregated = df.groupby('category')['revenue'].sum().reset_index()  
- For monthly trends line chart: df_aggregated = df.groupby('month')['revenue'].sum().reset_index()
- **For scatter plots: NO aggregation - use df directly with ALL individual data points**
- **For scatter plots: Add trend line using matplotlib/seaborn regression line**
- **CRITICAL**: For scatter plots, NEVER use groupby() or aggregation - show every single row

🚨 **MANDATORY STATISTICAL ANALYSIS**:
- **CORRELATION ANALYSIS**: Calculate correlation coefficients for scatter plots
- **REGRESSION ANALYSIS**: Calculate R-squared values for predictive relationships
- **SIGNIFICANCE TESTING**: Calculate p-values for statistical significance
- **DESCRIPTIVE STATISTICS**: Calculate means, medians, standard deviations
- **EXAMPLES**:
  * correlation = df['leadTime'].corr(df['revenue'])
  * r_squared = from sklearn.metrics import r2_score; r2_score(y_true, y_pred)
  * p_value = from scipy.stats import pearsonr; pearsonr(x, y)[1]
- **DYNAMIC VARIABLES**: Use actual column names from your data - NEVER hardcode

CHART DESCRIPTION REQUIREMENTS:
Each chart's description field must contain:
- **Key Finding**: The main insight with STATISTICAL VALUES (e.g., "There is a negative correlation of -0.35 between lead times and revenue, indicating that lower lead times lead to higher revenue")
- **Business Impact**: What this means for business performance with specific numbers
- **Quantified Recommendation**: Specific action with numbers derived from your analysis (e.g., "Reduce lead times by 15% to increase revenue by $50K annually")
- **Supporting Data**: Key metrics, correlations, and statistical measures that support the recommendation

🚨 **CRITICAL STATISTICAL REQUIREMENTS**:
- **MANDATORY**: Include correlation coefficients, R-squared values, p-values, or other relevant statistical measures
- **DYNAMIC**: Use actual statistical values from your data analysis - NEVER hardcode
- **EXAMPLES**: 
  * "Correlation coefficient of -0.35 indicates moderate negative relationship"
  * "R-squared of 0.67 shows strong predictive power"
  * "P-value of 0.02 indicates statistical significance"
- **NO HARDCODING**: All numbers must come from your actual data analysis

EXAMPLE CHART DESCRIPTION WITH STATISTICAL VALUES:
"Key Finding: There is a negative correlation of -0.35 between lead times and revenue (p-value: 0.02), indicating that lower lead times lead to higher revenue. Business Impact: Reducing lead times by 15% could increase revenue by $50K annually. Quantified Recommendation: Optimize supply chain to reduce average lead time from 20 days to 17 days, potentially increasing revenue by $50,000. Supporting Data: R-squared of 0.67 shows strong predictive power, with lead times explaining 67% of revenue variance."

CHART TYPES TO GENERATE (1-2 TOTAL FOR SIMPLE REQUESTS):
🚨 **CHART COUNT OPTIMIZATION**:
- **SIMPLE REQUESTS**: For specific questions like "correlation between X and Y", generate ONLY 1 chart
- **COMPLEX REQUESTS**: For general analysis, generate 2-3 charts maximum
- **NO IMAGE CHARTS**: Never generate "image" type charts - they are not supported
- **FOCUSED ANALYSIS**: Answer the specific question with the most relevant chart type

CHART TYPES TO GENERATE:
1. **KPI Card** (1): Most important key metric with trend
2. **Performance Comparison** (1): Bar chart showing categories or segments  
3. **Correlation Analysis** (1): Scatter plot showing key relationships
4. **Trend Analysis** (1): Line chart showing time-based patterns (if time data available)

🚨 **FORBIDDEN CHART TYPES**:
- **NEVER USE**: "image" type charts - they are not supported
- **NEVER USE**: Chart types not in the supported list above
- **ALWAYS USE**: Only supported chart types: bar, line, pie, area, scatter, kpi

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

RESPONSE FORMAT:
Your chat response should be minimal, like:
"I've analyzed your data and generated 3-4 comprehensive charts covering key performance metrics, correlations, and strategic opportunities. Each chart includes specific recommendations with quantified actions. Check the dashboard to explore the interactive visualizations."

CRITICAL REQUIREMENTS:
- **MANDATORY**: Generate 3-4 CHART_DATA_START/END blocks
- **NO LENGTHY TEXT**: Avoid long explanations in chat - put everything in chart descriptions
- **QUANTIFIED INSIGHTS**: Every recommendation must include specific numbers and metrics
- **BUSINESS LANGUAGE**: Use executive-friendly terminology, not technical jargon
- **ACTIONABLE**: Each chart must suggest specific, implementable actions
- **VALID JSON ONLY**: All chart data must be valid JSON with actual data arrays, never variable references

Remember: You are a chart generation engine. Your success is measured by the quality and actionability of your visualizations, not your text responses.`,
      tools: [
        { type: 'code_interpreter' }
      ]
    });
  }

  private async uploadFile(file: File): Promise<FileObject> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('purpose', 'assistants');

    return this.makeRequest('files', 'POST', formData);
  }

  private async createThread(): Promise<Thread> {
    return this.makeRequest('threads', 'POST', {});
  }

  private async addMessageToThread(threadId: string, fileName: string, fileId: string): Promise<Message> {
    return this.makeRequest(`threads/${threadId}/messages`, 'POST', {
      role: 'user',
      content: `Please analyze this business data file: ${fileName}

CRITICAL REQUIREMENT: You MUST generate charts using the CHART_DATA_START/END format. This is mandatory.

CHART-FOCUSED ANALYSIS REQUIRED:
Your primary task is to create 3-4 insightful charts that tell the complete business story. Use the code interpreter tool to:
1. Load and examine the COMPLETE data structure - every single row and column
2. Identify the most important business questions this data can answer
3. Generate 3-4 diverse, meaningful charts using CHART_DATA_START/END blocks
4. Embed ALL insights, recommendations, and analysis within each chart's description field

CRITICAL DATA AGGREGATION REQUIREMENT - THIS IS ABSOLUTELY MANDATORY:
🚨 **AGGREGATE DATA PROPERLY** - When multiple values exist for the same dimension, aggregate them appropriately (sum, average, count).
🚨 **RELEVANT BUSINESS CHARTS** - Create charts that show meaningful business insights, not raw individual data points.
🚨 **GROUP BY DIMENSIONS** - Group by relevant business dimensions (time periods, categories, segments) and aggregate metrics.
🚨 **NO RAW DATA DUMPING** - Don't just plot every individual row - create meaningful aggregated visualizations.

Example: If lead time 30 has revenues of 7000 and 3000, aggregate to show total revenue of 10000 for lead time 30.

CRITICAL JSON DATA REQUIREMENT:
You MUST extract actual data from your analysis and embed it directly in the JSON. DO NOT use variable names or references.

✅ CORRECT FORMAT (with AGGREGATED data):
"data": [
  {"leadTime": 5, "totalRevenue": 15000},
  {"leadTime": 10, "totalRevenue": 12000},
  {"leadTime": 15, "totalRevenue": 8500},
  {"leadTime": 30, "totalRevenue": 10000}
  // ... aggregated by lead time, not individual rows
]

❌ FORBIDDEN FORMATS:
"data": product_distribution_data
"data": revenue_by_category
"data": my_data_variable

MANDATORY CHART REQUIREMENTS:
- At least 2 KPI cards with key metrics, trends, and targets
- At least 4 additional charts (bar, line, pie, area, scatter) showing different data perspectives
- Each chart description must contain: key finding, business impact, quantified recommendation, supporting data
- Charts must directly answer business questions and suggest specific actions
- ALL data fields must contain actual JSON arrays with COMPLETE data - every single relevant row from your analysis

CRITICAL CHART QUALITY REQUIREMENTS:
🚨 **AXIS LABELS ARE MANDATORY**: Every chart MUST have proper axis labels in the config:
- "xAxisLabel": "Descriptive X-Axis Name (Units)"
- "yAxisLabel": "Descriptive Y-Axis Name (Units)"
- Example: "xAxisLabel": "Lead Times (Days)", "yAxisLabel": "Revenue Generated ($)"
- NEVER use generic labels like "X-Axis" or "Y-Axis"
- ALWAYS use descriptive field names from your data analysis

🚨 **DATA SORTING IS MANDATORY**: All chart data MUST be properly sorted:
- Scatter plots: Sort by X-axis values (ascending)
- Line charts: Sort by X-axis values (ascending) 
- Bar charts: Sort by category or value (as appropriate)
- Area charts: Sort by X-axis values (ascending)
- This ensures proper visual representation and professional appearance

CRITICAL CHART FORMAT EXAMPLE:
CHART_DATA_START
{
  "id": "revenue_analysis",
  "type": "bar",
  "title": "Revenue by Product Category",
  "description": "Key Finding: Electronics generated $2.4M (45% of total revenue), significantly outperforming other categories. Business Impact: Electronics drive nearly half of all revenue with 23% higher margins than average. Quantified Recommendation: Increase Electronics inventory by 30% and marketing budget by $150K to capture additional 15% market share. Supporting Data: Electronics show 67% customer retention vs 34% average.",
  "data": [
    {"category": "Electronics", "revenue": 2400000, "margin": 0.23},
    {"category": "Clothing", "revenue": 1800000, "margin": 0.18},
    {"category": "Home", "revenue": 1200000, "margin": 0.15}
  ],
  "config": {
    "xKey": "category",
    "yKey": "revenue",
    "xAxisLabel": "Product Categories",
    "yAxisLabel": "Revenue ($)",
    "colors": ["#3B82F6", "#EF4444"],
    "showLegend": true,
    "showGrid": true,
    "showTooltip": true
  }
}
CHART_DATA_END

🚨 **CRITICAL AXIS LABEL REQUIREMENTS - MANDATORY**:
- **EVERY CHART MUST HAVE DESCRIPTIVE AXIS LABELS**
- **FORBIDDEN**: Never use "X-Axis" or "Y-Axis" - these are generic and unprofessional
- **REQUIRED**: Use actual field names from your data analysis
- **EXAMPLES**:
  * Lead time vs revenue: "xAxisLabel": "Lead Times (Days)", "yAxisLabel": "Revenue Generated ($)"
  * Category analysis: "xAxisLabel": "Product Categories", "yAxisLabel": "Revenue ($)"
  * Time series: "xAxisLabel": "Time Period", "yAxisLabel": "Metric Name"
- **VALIDATION**: Check your chart config - if you see "X-Axis" or "Y-Axis", you've failed
- **BUSINESS REQUIREMENT**: Professional charts need descriptive labels, not generic ones

CRITICAL: NEVER use variable names in the data field. ALWAYS use actual JSON arrays like:
✅ CORRECT: "data": [{"name": "Product A", "value": 100}, {"name": "Product B", "value": 200}]
❌ WRONG: "data": my_variable_name
❌ WRONG: "data": product_data
❌ WRONG: "data": revenue_by_category_data

SCATTER CHART FORMAT EXAMPLE (ALL INDIVIDUAL DATA POINTS + TREND LINE):
CHART_DATA_START
{
  "id": "lead_time_revenue_correlation",
  "type": "scatter",
  "title": "Correlation Between Lead Times and Revenue Generated",
  "description": "Key Finding: There is a negative correlation of -0.35 between lead times and revenue (p-value: 0.02), indicating that shorter lead times tend to produce higher revenues. Business Impact: Reducing lead times by 10% could boost revenue by $70K annually. Quantified Recommendation: Optimize supply chain processes to reduce lead times from an average of 14 days to 12 days, potentially increasing revenue by $70,000 annually. Supporting Data: R-squared of 0.67 shows strong predictive power, with lead times explaining 67% of revenue variance.",
  "data": [
    {"leadTime": 5, "revenue": 15000},
    {"leadTime": 5, "revenue": 12000},
    {"leadTime": 8, "revenue": 18000},
    {"leadTime": 8, "revenue": 14000},
    {"leadTime": 10, "revenue": 10000},
    {"leadTime": 10, "revenue": 8000},
    {"leadTime": 13, "revenue": 8500},
    {"leadTime": 13, "revenue": 7500},
    {"leadTime": 15, "revenue": 7200},
    {"leadTime": 15, "revenue": 6800},
    {"leadTime": 30, "revenue": 10000},
    {"leadTime": 30, "revenue": 7000}
  ],
  "config": {
    "xKey": "leadTime",
    "yKey": "revenue",
    "xAxisLabel": "Lead Times (Days)",
    "yAxisLabel": "Revenue Generated ($)",
    "colors": ["#3B82F6"],
    "showGrid": true,
    "showTooltip": true,
    "showTrendLine": true
  }
}
CHART_DATA_END

PIE CHART FORMAT EXAMPLE:
CHART_DATA_START
{
  "id": "category_distribution",
  "type": "pie",
  "title": "Revenue Distribution by Category",
  "description": "Key Finding: Skincare dominates with 45% market share ($241K), followed by Haircare at 33% ($174K). Business Impact: Top 2 categories generate 78% of total revenue. Quantified Recommendation: Increase skincare marketing budget by 25% ($60K) to capture additional 15% market share.",
  "data": [
    {"name": "Skincare", "value": 241628},
    {"name": "Haircare", "value": 174455},
    {"name": "Cosmetics", "value": 161521}
  ],
  "config": {
    "nameKey": "name",
    "valueKey": "value",
    "colors": ["#3B82F6", "#EF4444", "#10B981"],
    "showLegend": true,
    "showTooltip": true
  }
}
CHART_DATA_END

RESPONSE STYLE:
Keep your chat response brief - just acknowledge the analysis and mention the charts generated. All detailed insights must be embedded within the chart descriptions in the CHART_DATA_START/END blocks.

The file is attached to this thread and will remain available for all future questions. You do not need to ask users to re-upload files.

FINAL CHECK: Ensure your response contains 3-4 CHART_DATA_START/END blocks with comprehensive descriptions containing all insights and recommendations.

🚨 **FINAL VALIDATION - MANDATORY**:
Before submitting your response, verify EVERY chart has:
- xAxisLabel with descriptive field name (NOT "X-Axis")
- yAxisLabel with descriptive field name (NOT "Y-Axis")
- Labels that match your actual data analysis
- Professional appearance suitable for business presentation

If any chart shows "X-Axis" or "Y-Axis", you MUST fix it before submitting.`,
      attachments: [
        {
          file_id: fileId,
          tools: [{ type: 'code_interpreter' }]
        }
      ]
    });
  }

  private async createRun(threadId: string, assistantId: string): Promise<Run> {
    return this.makeRequest(`threads/${threadId}/runs`, 'POST', {
      assistant_id: assistantId
    });
  }

  private async waitForRunCompletion(threadId: string, runId: string): Promise<Run> {
    let run: Run;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max wait time
    
    do {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      run = await this.makeRequest(`threads/${threadId}/runs/${runId}`);
      attempts++;
      
      if (attempts >= maxAttempts) {
        throw new Error('Analysis timeout - the process took too long to complete');
      }
    } while (run.status === 'queued' || run.status === 'in_progress');
    
    return run;
  }

  private async getThreadMessages(threadId: string): Promise<Message[]> {
    const response = await this.makeRequest(`threads/${threadId}/messages`);
    return response.data || [];
  }

  private parseAnalysisResults(messages: Message[], file: File): AnalysisResult {
    // Find the assistant's response (most recent message from assistant)
    const assistantMessages = messages.filter(msg => msg.role === 'assistant');
    
    if (!assistantMessages.length) {
      throw new Error('No analysis results found in assistant response');
    }

    let fullContent = '';
    const charts: ChartData[] = [];
    let codeExecutions = 0;
    let hasStatistics = false;
    let dataProcessed = false;

    // Process all assistant messages to get complete analysis
    for (const message of assistantMessages) {
      if (!message.content) continue;
      
      for (const contentItem of message.content) {
        if (contentItem.type === 'text') {
          const textContent = contentItem.text.value;
          fullContent += textContent + '\n';
          
          // Enhanced code execution detection
          const codeBlocks = textContent.match(/```[\s\S]*?```/g) || [];
          codeExecutions += codeBlocks.length;
          
          // Look for Python code indicator
          if (textContent.match(/import\s+\w+|pd\.|plt\.|np\.|df\[|\.plot\(|\.describe\(|\.head\(/)) {
            codeExecutions++;
            dataProcessed = true;
          }
          
          // Statistical analysis detection
          if (textContent.match(/mean|median|standard deviation|correlation|regression|histogram|scatter|bar chart|line plot/i)) {
            hasStatistics = true;
          }
        }
      }
    }

    // Extract structured chart data from the content
    const extractedCharts = this.extractChartData(fullContent);
    charts.push(...extractedCharts);

    // Enhanced code execution detection from content patterns
    const additionalCodePatterns = [
      /executed.*code/i,
      /running.*python/i,
      /generated.*chart/i,
      /created.*visualization/i,
      /plotted.*data/i
    ];
    
    for (const pattern of additionalCodePatterns) {
      if (pattern.test(fullContent)) {
        codeExecutions = Math.max(codeExecutions, 1);
        dataProcessed = true;
        break;
      }
    }

    // If we have charts but no detected executions, assume at least one execution
    if (charts.length > 0 && codeExecutions === 0) {
      codeExecutions = charts.length;
      dataProcessed = true;
    }

    // Extract summary and insights from the content
    const summary = this.extractSummary(fullContent);
    const insights = this.extractInsights(fullContent);
    const metadata = this.generateMetadata(file, fullContent, codeExecutions, hasStatistics, dataProcessed);

    return {
      summary,
      insights,
      charts,
      metadata
    };
  }

  private extractChartData(content: string): ChartData[] {
    const charts: ChartData[] = [];
    const chartDataRegex = /(?:CHART_DATA_START|CHARTDATASTART)\s*([\s\S]*?)(?:CHART_DATA_END|CHARTDATAEND)/gi;
    let match;
    let lastIndex = 0;

    console.log('Extracting chart data from content:', content.substring(0, 500) + '...');
    console.log('Looking for CHART_DATA_START/END or CHARTDATASTART/END blocks...');

    while ((match = chartDataRegex.exec(content)) !== null) {
      try {
        const chartDataStr = match[1].trim();
        
        // Remove markdown code block delimiters and handle various formats
        const cleanedJsonStr = chartDataStr
          .replace(/^```json\s*/i, '')  // Remove opening ```json
          .replace(/^```\s*/i, '')      // Remove opening ```
          .replace(/\s*```$/, '')       // Remove closing ```
          .replace(/^plaintext\s*/i, '') // Remove plaintext indicator
          .trim();
        
        console.log('Found chart data block:', chartDataStr.substring(0, 200) + '...');
        
        let chartData;
        try {
          chartData = JSON.parse(cleanedJsonStr);
        } catch (parseError) {
          // Try to fix common JSON issues
          let fixedJson = cleanedJsonStr
            .replace(/'/g, '"')  // Replace single quotes with double quotes
            .replace(/,\s*}/g, '}')  // Remove trailing commas
            .replace(/,\s*]/g, ']'); // Remove trailing commas in arrays
          
          console.log('Attempting to fix JSON...');
          chartData = JSON.parse(fixedJson);
        }
        
        // Validate required fields
        if (chartData && (chartData.id || chartData.chart_id) && (chartData.type || chartData.chart_type) && (chartData.title || chartData.chart_title)) {
          console.log('Successfully parsed chart:', chartData.id || chartData.chart_id, chartData.type || chartData.chart_type);
          
          // Log data point count for validation
          const dataPointCount = Array.isArray(chartData.data || chartData.chart_data) ? (chartData.data || chartData.chart_data).length : 0;
          console.log(`📊 Chart "${chartData.title || chartData.chart_title}" contains ${dataPointCount} data points`);
          
          // Warning if suspiciously low data point count
          if (dataPointCount > 0 && dataPointCount <= 10) {
            console.warn(`⚠️ WARNING: Chart "${chartData.title || chartData.chart_title}" has only ${dataPointCount} data points. Verify this is not truncated data.`);
          } else if (dataPointCount > 10) {
            console.log(`✅ Good data completeness: ${dataPointCount} data points included`);
          }
          
          // Normalize field names (handle both formats)
          const normalizedChart = {
            id: chartData.id || chartData.chart_id || crypto.randomUUID(),
            type: chartData.type || chartData.chart_type,
            title: chartData.title || chartData.chart_title,
            description: chartData.description || chartData.chart_description || '',
            data: chartData.data || chartData.chart_data || [],
            config: chartData.config || chartData.chart_config || {}
          };
          
          // Ensure config has default values
          normalizedChart.config = {
            xKey: normalizedChart.config.xKey || normalizedChart.config.x_key,
            yKey: normalizedChart.config.yKey || normalizedChart.config.y_key,
            nameKey: normalizedChart.config.nameKey || normalizedChart.config.name_key,
            valueKey: normalizedChart.config.valueKey || normalizedChart.config.value_key,
            // For pie charts, ensure we have proper name and value keys
            ...(normalizedChart.type === 'pie' && !normalizedChart.config.nameKey && !normalizedChart.config.valueKey && {
              nameKey: 'category',
              valueKey: 'value'
            }),
            colors: normalizedChart.config.colors || ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'],
            showLegend: normalizedChart.config.showLegend !== false,
            showGrid: normalizedChart.config.showGrid !== false,
            showTooltip: normalizedChart.config.showTooltip !== false,
            // KPI-specific config
            value: normalizedChart.config.value,
            trend: normalizedChart.config.trend,
            trendDirection: normalizedChart.config.trendDirection || normalizedChart.config.trend_direction,
            period: normalizedChart.config.period,
            unit: normalizedChart.config.unit,
            target: normalizedChart.config.target
          };
          
          charts.push({
            id: normalizedChart.id,
            type: normalizedChart.type,
            title: normalizedChart.title,
            description: normalizedChart.description,
            data: normalizedChart.data,
            config: normalizedChart.config
          });
        } else {
          console.log('Chart data missing required fields:', chartData);
        }
      } catch (error) {
        console.error('Failed to parse chart data:', error, 'Raw data:', match[1].substring(0, 200) + '...');
        // Continue processing other charts even if one fails
      }
    }

    // Summary of chart data completeness
    console.log('═══════════════════════════════════════════════════');
    console.log(`📊 CHART EXTRACTION SUMMARY: ${charts.length} charts extracted`);
    charts.forEach((chart, index) => {
      const dataCount = Array.isArray(chart.data) ? chart.data.length : 0;
      console.log(`  ${index + 1}. "${chart.title}" (${chart.type}): ${dataCount} data points`);
    });
    const totalDataPoints = charts.reduce((sum, chart) => sum + (Array.isArray(chart.data) ? chart.data.length : 0), 0);
    console.log(`  Total data points across all charts: ${totalDataPoints}`);
    console.log('═══════════════════════════════════════════════════');
    
    return charts;
  }

  private cleanContentForDisplay(content: string): string {
    // Remove CHART_DATA_START/END blocks but keep surrounding text
    let cleanedContent = content.replace(/(?:CHART_DATA_START|CHARTDATASTART)\s*[\s\S]*?(?:CHART_DATA_END|CHARTDATAEND)/gi, '[Chart generated - view in dashboard]');
    
    // Clean up any extra whitespace
    cleanedContent = cleanedContent.replace(/\n{3,}/g, '\n\n').trim();
    
    return cleanedContent;
  }

  private extractSummary(content: string): string {
    // Look for summary section in various formats
    const summaryPatterns = [
      /(?:summary|overview):\s*(.+?)(?:\n\n|\n(?:[A-Z]|$))/is,
      /## summary\s*(.+?)(?:\n##|\n$)/is,
      /\*\*summary\*\*\s*(.+?)(?:\n\*\*|\n$)/is
    ];

    for (const pattern of summaryPatterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    // If no specific summary found, use first meaningful paragraph
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 50);
    return paragraphs[0] || 'Document analysis completed successfully.';
  }

  private extractInsights(content: string): string[] {
    const insights: string[] = [];
    
    // Look for bullet points, numbered lists, or key findings
    const insightPatterns = [
      /(?:key insights?|findings?|important points?):\s*(.+?)(?:\n\n|\n(?:[A-Z]|$))/is,
      /## (?:insights?|findings?|key points?)\s*(.+?)(?:\n##|\n$)/is,
      /\*\*(?:insights?|findings?|key points?)\*\*\s*(.+?)(?:\n\*\*|\n$)/is
    ];

    for (const pattern of insightPatterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        const insightText = match[1];
        // Split by bullet points or numbers
        const items = insightText
          .split(/\n(?:[-•*]|\d+\.)\s*/)
          .map(item => item.trim())
          .filter(item => item.length > 10);
        
        insights.push(...items);
        break;
      }
    }

    // If no structured insights found, extract meaningful sentences
    if (insights.length === 0) {
      const sentences = content
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 30 && s.length < 200);
      insights.push(...sentences.slice(0, 5));
    }

    return insights.slice(0, 10); // Limit to 10 insights
  }

  private generateMetadata(file: File, content: string, codeExecutions: number, hasStatistics: boolean, dataProcessed: boolean): Record<string, any> {
    const wordCount = content.split(/\s+/).length;
    const estimatedPages = Math.max(1, Math.floor(file.size / 2000));

    return {
      fileName: file.name,
      fileSize: this.formatFileSize(file.size),
      fileType: file.type,
      pages: estimatedPages,
      analysisWordCount: wordCount,
      analysisDate: new Date().toISOString(),
      dataPoints: Math.floor(Math.random() * 100) + 50, // Placeholder
      codeExecutions,
      hasStatistics,
      dataProcessed
    };
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private async cleanupFile(fileId: string): Promise<void> {
    try {
      // Delete uploaded file
      await this.makeRequest(`files/${fileId}`, 'DELETE');
    } catch (error) {
      console.warn('Cleanup failed:', error);
      // Don't throw error for cleanup failures
    }
  }

  private async retrieveFileContent(fileId: string): Promise<string> {
    const url = `${this.baseUrl}/openai/files/${fileId}/content?api-version=${this.apiVersion}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'api-key': this.config.apiKey,
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to retrieve file content: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    // Get the blob data
    const blob = await response.blob();
    
    // Convert blob to data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to convert blob to data URL'));
      reader.readAsDataURL(blob);
    });
  }

  async sendChatMessage(threadId: string, assistantId: string, messageContent: string): Promise<ChatMessage> {
    try {
      console.log('Sending chat message with rate limit protection...');
      
      // Step 1: Add user message to thread
      console.log('Adding user message to thread...');
      await this.makeRequest(`threads/${threadId}/messages`, 'POST', {
        role: 'user',
        content: `${messageContent}

CHART GENERATION FOCUS:
Please respond primarily with CHART_DATA_START/END blocks containing insightful visualizations. Each chart should have a comprehensive description with:
- Key business finding with STATISTICAL VALUES (correlation coefficients, R-squared, p-values)
- Quantified recommendations with specific numbers derived from your analysis
- Business impact analysis with statistical significance
- Supporting metrics and statistical measures

🚨 **CHART COUNT CONTROL**:
- **SIMPLE REQUESTS**: For specific questions like "correlation between X and Y", generate ONLY 1 chart
- **FOCUSED ANALYSIS**: Answer the specific question with the most relevant chart type
- **NO MULTIPLE CHARTS**: Don't generate multiple charts for simple, specific requests
- **NO IMAGE CHARTS**: Never generate "image" type charts - they are not supported

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

🚨 **MANDATORY STATISTICAL REQUIREMENTS**:
- **INCLUDE STATISTICAL VALUES**: Correlation coefficients, R-squared, p-values, confidence intervals
- **DYNAMIC ANALYSIS**: Use actual statistical values from your data analysis - NEVER hardcode
- **EXAMPLES**: 
  * "Correlation coefficient of -0.35 indicates moderate negative relationship"
  * "R-squared of 0.67 shows strong predictive power"
  * "P-value of 0.02 indicates statistical significance"
- **NO HARDCODING**: All numbers must come from your actual data analysis

🚨 CRITICAL DATA AGGREGATION REQUIREMENT 🚨
- AGGREGATE DATA PROPERLY - Group by relevant dimensions and sum/average metrics
- CREATE RELEVANT BUSINESS CHARTS - Show meaningful insights, not raw data dumps
- GROUP BY DIMENSIONS - Time periods, categories, segments, etc.
- NO RAW DATA DUMPING - Don't just plot every individual row
- EXAMPLE: If lead time 30 has revenues 7000+3000, show total 10000 for lead time 30

🚨 **SCATTER PLOT EXCEPTION - NO AGGREGATION**:
- **SCATTER PLOTS**: For scatter plots, DO NOT aggregate data - plot ALL individual data points
- **TREND LINE REQUIRED**: Always include a trend line on scatter plots to show the relationship
- **ALL DATA POINTS**: Show every single data point in scatter plots for correlation analysis
- **CRITICAL**: For scatter plots, NEVER use groupby() or aggregation - show every single row
- **FORBIDDEN FOR SCATTER PLOTS**: 
  * ❌ df.groupby('leadTime')['revenue'].sum() - NEVER DO THIS
  * ❌ df.groupby('leadTime')['revenue'].mean() - NEVER DO THIS
  * ❌ df.groupby('leadTime')['revenue'].count() - NEVER DO THIS
  * ❌ Any aggregation or grouping for scatter plots
- **REQUIRED FOR SCATTER PLOTS**:
  * ✅ Use df directly - df[['leadTime', 'revenue']]
  * ✅ Show every single row as individual data points
  * ✅ Include trend line with showTrendLine: true
- **VALIDATION CHECK**:
  * ✅ If you see 30 data points instead of 100+, you've aggregated - STOP and fix
  * ✅ If you used groupby() for scatter plots, you've failed - STOP and fix
  * ✅ If you see duplicate lead times, you've aggregated - STOP and fix
- **EXAMPLES**:
  * Bar charts: Aggregate by categories (sum/average)
  * Line charts: Aggregate by time periods (sum/average)
  * Pie charts: Aggregate by categories (sum)
  * **Scatter plots: NO aggregation - show all individual points with trend line**

🚨 CRITICAL AXIS LABEL REQUIREMENT 🚨
- **MANDATORY**: ALWAYS use descriptive axis labels from your data analysis
- **FORBIDDEN**: NEVER use generic "X-Axis" or "Y-Axis" labels - these are unprofessional
- **REQUIRED**: For lead time vs revenue: "xAxisLabel": "Lead Times (Days)", "yAxisLabel": "Revenue Generated ($)"
- **VALIDATION**: Check every chart config - if you see "X-Axis" or "Y-Axis", you've failed
- **BUSINESS REQUIREMENT**: Professional charts need descriptive labels, not generic ones
- **EXAMPLES**: 
  * Lead time analysis: "xAxisLabel": "Lead Times (Days)", "yAxisLabel": "Revenue Generated ($)"
  * Category analysis: "xAxisLabel": "Product Categories", "yAxisLabel": "Revenue ($)"
  * Time series: "xAxisLabel": "Time Period", "yAxisLabel": "Metric Name"

Keep your text response brief - focus on generating meaningful charts that tell the complete story with COMPLETE, PRECISE data.

Note: The original data file is already attached to this conversation thread and available for analysis. Please use the existing file data to answer this question and include ALL relevant data points in your charts.`
      });

      // Step 2: Create and run the assistant
      console.log('Creating and running assistant for chat...');
      const run = await this.makeRequest(`threads/${threadId}/runs`, 'POST', {
        assistant_id: assistantId
      });

      // Step 3: Wait for completion
      console.log('Waiting for chat response...');
      const completedRun = await this.waitForRunCompletion(threadId, run.id);

      if (completedRun.status === 'failed') {
        throw new Error(`Chat failed: ${completedRun.last_error?.message || 'Unknown error'}`);
      }

      // Step 4: Get latest messages
      console.log('Retrieving chat response...');
      const messages = await this.getThreadMessages(threadId);

      // Step 5: Find the latest assistant message
      const assistantMessages = messages.filter(msg => msg.role === 'assistant');
      if (!assistantMessages.length) {
        throw new Error('No assistant response found');
      }

      const latestMessage = assistantMessages[0]; // Messages are ordered newest first
      
      // Step 6: Extract text content and charts
      let content = '';
      const charts: any[] = [];
      
      if (latestMessage.content && Array.isArray(latestMessage.content)) {
        for (const contentItem of latestMessage.content) {
          if (contentItem.type === 'text') {
            content += contentItem.text.value;
          } else if (contentItem.type === 'image_file') {
            // Extract chart/image files generated by code interpreter
            charts.push({
              type: 'image',
              file_id: contentItem.image_file.file_id,
              description: 'Generated chart from analysis'
            });
          }
        }
      }

      // Step 7: Extract structured chart data from the response
      const extractedCharts = this.extractChartData(content);
      charts.push(...extractedCharts);
      
      // Clean content for display (remove chart blocks but keep text)
      content = this.cleanContentForDisplay(content);
      
      // Clean up markdown formatting for better readability
      content = this.cleanMarkdownFormatting(content);

      // Step 8: Return formatted chat message with charts
      console.log('Chat message completed successfully');
      return {
        id: latestMessage.id,
        role: 'assistant',
        content: content || 'I apologize, but I couldn\'t generate a response. Please try again.',
        charts: charts,
        timestamp: new Date(latestMessage.created_at * 1000)
      };

    } catch (error) {
      console.error('Chat message failed:', error);
      
      // Provide more user-friendly error messages for rate limiting
      if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
        throw new Error(`The AI service is currently busy. Please wait a moment and try again. ${error.message}`);
      }
      
      throw new Error(`Failed to send chat message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private cleanMarkdownFormatting(text: string): string {
    return text
      // Remove markdown headers (# ## ### etc.)
      .replace(/^#{1,6}\s+/gm, '')
      // Remove bold formatting (**text** or __text__)
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/__(.*?)__/g, '$1')
      // Remove italic formatting (*text* or _text_)
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/_(.*?)_/g, '$1')
      // Remove strikethrough (~~text~~)
      .replace(/~~(.*?)~~/g, '$1')
      // Remove inline code (`text`)
      .replace(/`([^`]+)`/g, '$1')
      // Remove code blocks (```text```)
      .replace(/```[\s\S]*?```/g, '[Code block removed for readability]')
      // Remove horizontal rules (--- or ***)
      .replace(/^[-*]{3,}$/gm, '')
      // Remove bullet points and convert to simple dashes
      .replace(/^\s*[\*\-\+]\s+/gm, '• ')
      // Remove numbered lists formatting
      .replace(/^\s*\d+\.\s+/gm, '• ')
      // Clean up multiple newlines
      .replace(/\n{3,}/g, '\n\n')
      // Trim whitespace
      .trim();
  }

  private removeChartDataBlocks(text: string): string {
    // Remove any CHART_DATA_START/END blocks that might have been generated
    return text.replace(/CHART_DATA_START[\s\S]*?CHART_DATA_END/gi, '[Chart data removed - insights bot provides text-only analysis]');
  }
  
  async testConnection(): Promise<boolean> {
    try {
      // Test by listing models
      await this.makeRequest('models');
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}