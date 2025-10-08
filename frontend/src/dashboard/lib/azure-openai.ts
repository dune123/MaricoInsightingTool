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
  private requestQueue: Promise<any>[] = [];
  private maxConcurrentRequests = 2;
  private apiVersion = '2024-05-01-preview';
  private apiCallCount = 0; // Track total API calls
  private sessionStartTime = Date.now(); // Track session duration

  constructor(config: AzureOpenAIConfig) {
    this.config = config;
    this.baseUrl = config.endpoint.endsWith('/') ? config.endpoint.slice(0, -1) : config.endpoint;
  }

  private async makeRequest(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
    // Track API calls for monitoring
    this.apiCallCount++;
    const sessionDuration = Math.round((Date.now() - this.sessionStartTime) / 1000);
    
    console.log(`📡 API Call #${this.apiCallCount} (${method} ${endpoint}) - Session: ${sessionDuration}s`);
    
    // Add a small delay only for non-GET requests to prevent rate limiting
    if (method !== 'GET') {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay for POST/PUT/DELETE
    }
    
    // Queue requests to prevent overwhelming the API
    return this.queueRequest(() => this.makeRequestWithRetry(endpoint, method, body));
  }

  private async queueRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    // Wait for queue to have space
    while (this.requestQueue.length >= this.maxConcurrentRequests) {
      await Promise.race(this.requestQueue);
    }

    // Add request to queue
    const requestPromise = requestFn().finally(() => {
      // Remove from queue when complete
      const index = this.requestQueue.indexOf(requestPromise);
      if (index > -1) {
        this.requestQueue.splice(index, 1);
      }
    });

    this.requestQueue.push(requestPromise);
    return requestPromise;
  }

  private async makeRequestWithRetry(
    endpoint: string, 
    method: string = 'GET', 
    body?: any, 
    retryCount: number = 0
  ): Promise<any> {
    const maxRetries = 5; // Increased retries for better recovery
    const baseDelay = 3000; // Reduced to 3 seconds base delay
    
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
        
        // Handle rate limiting with server-specified delay
        if (response.status === 429 && retryCount < maxRetries) {
          const retryAfter = response.headers.get('retry-after');
          const serverDelay = retryAfter ? parseInt(retryAfter) * 1000 : null;
          
          // Use server delay if available, otherwise exponential backoff
          const delay = serverDelay || (baseDelay * Math.pow(1.5, retryCount));
          const jitter = Math.random() * 500; // Reduced jitter
          const totalDelay = Math.min(delay + jitter, 30000); // Cap at 30 seconds
          
          console.log(`Rate limit exceeded. Retrying in ${Math.round(totalDelay / 1000)} seconds... (Attempt ${retryCount + 1}/${maxRetries})`);
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, totalDelay));
          
          // Recursive retry with incremented count
          return this.makeRequestWithRetry(endpoint, method, body, retryCount + 1);
        }
        
        // Handle rate limit error specifically
        if (response.status === 429) {
          const retryAfter = response.headers.get('retry-after');
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 30000; // Default 30 seconds
          
          if (retryCount < maxRetries) {
            console.log(`Rate limit exceeded. Waiting ${waitTime}ms before retry ${retryCount + 1}/${maxRetries}`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            return this.makeRequestWithRetry(endpoint, method, body, retryCount + 1);
          } else {
            const waitSeconds = Math.ceil(waitTime / 1000);
            throw new Error(`Rate limit exceeded. Please wait ${waitSeconds} seconds before trying again. The system is processing your request in the background.`);
          }
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
      
      // Cleanup (non-blocking to avoid delays)
      this.cleanupResources(uploadedFile.id, thread.id, assistant.id).catch(error => {
        console.warn('Background cleanup failed:', error);
      });
      
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

🚨 **CRITICAL CHART TYPE-SPECIFIC DATA HANDLING** 🚨

**FOR SCATTER PLOTS (CORRELATION ANALYSIS) - ABSOLUTE PRIORITY**:
- **🚫 NEVER AGGREGATE SCATTER PLOT DATA**: Scatter plots MUST show EVERY individual data point
- **📊 ALL DATA POINTS REQUIRED**: If dataset has 100 rows, scatter plot MUST have exactly 100 data points
- **🔗 CORRELATION ANALYSIS**: Individual points are needed to show relationships and correlations
- **📈 TREND LINE MANDATORY**: Always include trend line - set "showTrendLine": true in config
- **✅ VALIDATION REQUIRED**: After generating scatter plot, verify data point count matches total dataset rows
- **🚫 NO GROUPBY() OR AGGREGATION**: Use df directly with ALL individual data points
- **📋 EXAMPLE**: For lead time vs revenue correlation, show ALL 100 individual (leadTime, revenue) pairs

**FOR OTHER CHART TYPES (BAR, LINE, PIE, AREA) - AGGREGATION REQUIRED**:
- **📊 AGGREGATE PROPERLY**: When multiple values exist for the same category/date/metric, aggregate them (sum, average, count)
- **📈 RELEVANT BUSINESS CHARTS**: Create charts that show meaningful business insights, not raw individual data points
- **🔄 GROUP BY DIMENSIONS**: Group by relevant business dimensions (time periods, categories, segments)
- **📋 EXAMPLES**:
  * Bar charts: Group by categories, sum/average values
  * Line charts: Group by time periods, sum/average metrics  
  * Pie charts: Group by categories, sum values
  * **Scatter plots: NO aggregation - show ALL individual points with trend line**

CRITICAL JSON FORMAT REQUIREMENT:
- **MANDATORY**: The "data" field MUST contain actual JSON arrays with real data values
- **FORBIDDEN**: Never use variable names like "product_distribution_data" or "my_data_variable"
- **REQUIRED FORMAT**: "data": [{"category": "Electronics", "value": 2400}, {"category": "Clothing", "value": 1800}]
- **NEVER USE**: "data": variable_name_here
- **🚫 NO COMMENTS**: Never include // comments or /* */ comments in JSON - they are invalid JSON syntax
- **✅ VALID JSON ONLY**: Ensure all JSON is valid and parseable by JSON.parse()

MANDATORY CHART GENERATION PROCESS:
1. **Analyze the data structure** using code interpreter - load the COMPLETE dataset
2. **Identify 3-4 key business questions** the data can answer
3. **APPLY CHART TYPE-SPECIFIC DATA HANDLING**:
   - **🚫 FOR SCATTER PLOTS: NO AGGREGATION** - Use df directly with ALL individual data points for correlation analysis
   - **📊 FOR BAR CHARTS: Aggregate** - Group by categories, sum/average values
   - **📈 FOR LINE CHARTS: Aggregate** - Group by time periods, sum/average metrics
   - **🥧 FOR PIE CHARTS: Aggregate** - Group by categories, sum values
4. **Create meaningful visualizations**: Charts should show business insights appropriate to their type
5. **Generate appropriate data arrays**: 
   - Scatter plots: ALL individual data points for correlation analysis
   - Other charts: Aggregated data that tells a business story
6. **VALIDATE DATA COMPLETENESS**: Before finalizing each chart, ensure:
   - **For scatter plots**: Print len(df) and verify scatter plot data contains ALL rows from the dataset
   - **For scatter plots**: If dataset has 100 rows, scatter plot MUST have exactly 100 data points
   - **For scatter plots**: NEVER truncate or limit scatter plot data to just a few points
   - **For other charts**: Verify aggregated data makes business sense
7. **VALIDATE AXIS LABELS**: Before finalizing each chart, ensure:
   - xAxisLabel contains descriptive field name (e.g., "Lead Times (Days)")
   - yAxisLabel contains descriptive field name (e.g., "Revenue Generated ($)")
   - NO generic labels like "X-Axis" or "Y-Axis"
   - Labels match the actual data being analyzed

CODE INTERPRETER DATA HANDLING BY CHART TYPE:

**🚫 FOR SCATTER PLOTS - NO AGGREGATION**:
- **CRITICAL**: NEVER use groupby() or aggregation for scatter plots
- **ALL DATA POINTS**: Use df directly with ALL individual data points
- **TREND LINE**: Add trend line using matplotlib/seaborn regression line
- **DATA COMPLETENESS**: Use df.to_dict('records') to ensure ALL rows are included
- **VALIDATION**: Print len(df) before creating scatter plot to confirm total row count matches data points
- **EXAMPLE**: scatter_data = df[['leadTime', 'revenue']].to_dict('records')  # ALL rows

**📊 FOR OTHER CHART TYPES - AGGREGATION REQUIRED**:
- For category revenue bar chart: df_aggregated = df.groupby('category')['revenue'].sum().reset_index()  
- For monthly trends line chart: df_aggregated = df.groupby('month')['revenue'].sum().reset_index()
- For pie chart distribution: df_aggregated = df.groupby('category')['value'].sum().reset_index()

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

🚨 **CRITICAL CHART TYPE-SPECIFIC DATA HANDLING** 🚨

**🚫 FOR SCATTER PLOTS - NO AGGREGATION (ABSOLUTE PRIORITY)**:
- **NEVER AGGREGATE**: Scatter plots MUST show EVERY individual data point for correlation analysis
- **ALL DATA POINTS**: If dataset has 100 rows, scatter plot MUST have exactly 100 data points
- **CORRELATION ANALYSIS**: Individual points are needed to show relationships and correlations
- **NO GROUPBY() OR AGGREGATION**: Use df directly with ALL individual data points
- **EXAMPLE**: For lead time vs revenue correlation, show ALL 100 individual (leadTime, revenue) pairs

**📊 FOR OTHER CHART TYPES - AGGREGATION REQUIRED**:
- **AGGREGATE DATA PROPERLY**: When multiple values exist for the same dimension, aggregate them appropriately (sum, average, count)
- **RELEVANT BUSINESS CHARTS**: Create charts that show meaningful business insights, not raw individual data points
- **GROUP BY DIMENSIONS**: Group by relevant business dimensions (time periods, categories, segments) and aggregate metrics
- **EXAMPLE**: If lead time 30 has revenues of 7000 and 3000, aggregate to show total revenue of 10000 for lead time 30

CRITICAL JSON DATA REQUIREMENT:
You MUST extract actual data from your analysis and embed it directly in the JSON. DO NOT use variable names or references.
🚫 **NO COMMENTS**: Never include // comments or /* */ comments in JSON - they are invalid JSON syntax
✅ **VALID JSON ONLY**: Ensure all JSON is valid and parseable by JSON.parse()

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
🚨 **CRITICAL**: This example shows 12 data points. If your dataset has 50+ rows, include ALL 50+ data points in your scatter plot!
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
    const maxAttempts = 30; // Reduced from 60 to 30 (2.5 minutes max wait time)
    
    do {
      // Implement exponential backoff: start at 5s, increase gradually, cap at 15s
      const baseDelay = 5000; // 5 seconds base
      const exponentialDelay = Math.min(baseDelay * Math.pow(1.2, attempts), 15000); // Cap at 15 seconds
      const jitter = Math.random() * 1000; // Add 0-1s random jitter to prevent thundering herd
      const totalDelay = exponentialDelay + jitter;
      
      console.log(`⏳ Polling run status (attempt ${attempts + 1}/${maxAttempts}) - waiting ${Math.round(totalDelay / 1000)}s...`);
      
      await new Promise(resolve => setTimeout(resolve, totalDelay));
      run = await this.makeRequest(`threads/${threadId}/runs/${runId}`);
      attempts++;
      
      console.log(`📊 Run status: ${run.status} (attempt ${attempts})`);
      
      if (attempts >= maxAttempts) {
        throw new Error(`Analysis timeout - the process took too long to complete (${attempts} attempts, ${Math.round(attempts * 7.5 / 60)} minutes)`);
      }
    } while (run.status === 'queued' || run.status === 'in_progress');
    
    console.log(`✅ Run completed after ${attempts} attempts (${Math.round(attempts * 7.5 / 60)} minutes)`);
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
    const lastIndex = 0;

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
          console.log('Initial JSON parse failed, attempting to fix common issues...');
          
          // Enhanced JSON cleaning to fix common issues
          const fixedJson = cleanedJsonStr
            // Remove JavaScript-style comments (// and /* */)
            .replace(/\/\/.*$/gm, '')  // Remove single-line comments
            .replace(/\/\*[\s\S]*?\*\//g, '')  // Remove multi-line comments
            // Remove any remaining comment-like patterns
            .replace(/\/\/[^"\n]*$/gm, '')  // Remove trailing comments
            .replace(/\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\//g, '')  // Remove block comments
            // Fix common JSON syntax issues
            .replace(/'/g, '"')  // Replace single quotes with double quotes
            .replace(/,\s*}/g, '}')  // Remove trailing commas before }
            .replace(/,\s*]/g, ']')  // Remove trailing commas before ]
            .replace(/,\s*,/g, ',')  // Remove double commas
            // Remove any remaining invalid characters that might cause issues
            .replace(/[^\x20-\x7E\s]/g, '')  // Remove non-printable characters except whitespace
            .replace(/\s+/g, ' ')  // Normalize whitespace
            .trim();
          
          console.log('Attempting to parse cleaned JSON...');
          console.log('Cleaned JSON preview:', fixedJson.substring(0, 200) + '...');
          
          try {
            chartData = JSON.parse(fixedJson);
          } catch (secondError) {
            console.error('❌ Failed to parse chart data after cleaning:', secondError);
            console.error('Raw data:', chartDataStr.substring(0, 500) + '...');
            console.error('Cleaned data:', fixedJson.substring(0, 500) + '...');
            
            // Try one more aggressive cleaning approach
            try {
              console.log('Attempting aggressive JSON cleaning...');
              const aggressiveFixed = fixedJson
                // Remove any remaining problematic characters
                .replace(/[^\x20-\x7E]/g, '')  // Remove all non-ASCII characters
                .replace(/\s*\/\/.*$/gm, '')  // Remove any remaining comments
                .replace(/\s*\/\*.*?\*\//gs, '')  // Remove any remaining block comments
                .replace(/,(\s*[}\]])/g, '$1')  // Remove trailing commas more aggressively
                .replace(/([{\[])\s*,/g, '$1')  // Remove leading commas
                .replace(/,\s*,+/g, ',')  // Remove multiple consecutive commas
                .trim();
              
              console.log('Aggressively cleaned JSON preview:', aggressiveFixed.substring(0, 200) + '...');
              chartData = JSON.parse(aggressiveFixed);
              console.log('✅ Successfully parsed after aggressive cleaning');
            } catch (finalError) {
              console.error('❌ Final attempt failed:', finalError);
              console.error('This chart data block will be skipped');
              // Continue processing other charts even if one fails
              continue;
            }
          }
        }
        
        // Validate required fields
        if (chartData && (chartData.id || chartData.chart_id) && (chartData.type || chartData.chart_type) && (chartData.title || chartData.chart_title)) {
          console.log('Successfully parsed chart:', chartData.id || chartData.chart_id, chartData.type || chartData.chart_type);
          
          // Log data point count for validation
          const dataPointCount = Array.isArray(chartData.data || chartData.chart_data) ? (chartData.data || chartData.chart_data).length : 0;
          console.log(`📊 Chart "${chartData.title || chartData.chart_title}" contains ${dataPointCount} data points`);
          
          // Enhanced validation for scatter plots
          if (chartData.type === 'scatter' || chartData.chart_type === 'scatter') {
            if (dataPointCount > 0 && dataPointCount <= 10) {
              console.error(`🚨 CRITICAL ERROR: Scatter plot "${chartData.title || chartData.chart_title}" has only ${dataPointCount} data points. Scatter plots MUST show ALL individual data points - this appears to be truncated data!`);
            } else if (dataPointCount > 10 && dataPointCount <= 20) {
              console.warn(`⚠️ WARNING: Scatter plot "${chartData.title || chartData.chart_title}" has ${dataPointCount} data points. If your dataset has more rows, ensure ALL data points are included.`);
            } else if (dataPointCount > 20) {
              console.log(`✅ Good scatter plot data completeness: ${dataPointCount} data points included`);
            }
          } else {
            // Standard validation for other chart types
            if (dataPointCount > 0 && dataPointCount <= 10) {
              console.warn(`⚠️ WARNING: Chart "${chartData.title || chartData.chart_title}" has only ${dataPointCount} data points. Verify this is not truncated data.`);
            } else if (dataPointCount > 10) {
              console.log(`✅ Good data completeness: ${dataPointCount} data points included`);
            }
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
            // Scatter plot trend line - enable by default for scatter plots
            showTrendLine: normalizedChart.type === 'scatter' 
              ? (normalizedChart.config.showTrendLine !== false) // Default to true for scatter plots unless explicitly false
              : normalizedChart.config.showTrendLine,
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
          console.log('Available fields:', Object.keys(chartData || {}));
        }
      } catch (error) {
        console.error('❌ Failed to parse chart data:', error);
        console.error('Raw data preview:', match[1].substring(0, 200) + '...');
        console.error('Error details:', error.message);
        // Continue processing other charts even if one fails
      }
    }

    // Summary of chart data completeness
    console.log('═══════════════════════════════════════════════════');
    console.log(`📊 CHART EXTRACTION SUMMARY: ${charts.length} charts extracted`);
    charts.forEach((chart, index) => {
      const dataCount = Array.isArray(chart.data) ? chart.data.length : 0;
      const scatterWarning = chart.type === 'scatter' && dataCount <= 10 ? ' 🚨 LOW DATA COUNT' : '';
      console.log(`  ${index + 1}. "${chart.title}" (${chart.type}): ${dataCount} data points${scatterWarning}`);
    });
    const totalDataPoints = charts.reduce((sum, chart) => sum + (Array.isArray(chart.data) ? chart.data.length : 0), 0);
    const scatterCharts = charts.filter(chart => chart.type === 'scatter');
    const lowDataScatterCharts = scatterCharts.filter(chart => Array.isArray(chart.data) && chart.data.length <= 10);
    console.log(`  Total data points across all charts: ${totalDataPoints}`);
    if (lowDataScatterCharts.length > 0) {
      console.log(`🚨 CRITICAL: ${lowDataScatterCharts.length} scatter plot(s) have ≤10 data points - this may indicate data truncation!`);
    }
    console.log('═══════════════════════════════════════════════════');
    
    return charts;
  }

  private cleanContentForDisplay(content: string, chartsCount?: number): string {
    // Remove CHART_DATA_START/END blocks but keep surrounding text
    const countText = typeof chartsCount === 'number'
      ? `${chartsCount} chart${chartsCount !== 1 ? 's' : ''} generated`
      : 'Charts generated';
    let cleanedContent = content.replace(
      /(?:CHART_DATA_START|CHARTDATASTART)\s*[\s\S]*?(?:CHART_DATA_END|CHARTDATAEND)/gi,
      `[${countText}]`
    );
    
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

  private async cleanupResources(fileId: string, threadId: string, assistantId: string): Promise<void> {
    // Run cleanup operations in parallel to reduce total time
    const cleanupPromises = [
      this.cleanupFile(fileId),
      this.cleanupThread(threadId),
      this.cleanupAssistant(assistantId)
    ];
    
    // Wait for all cleanup operations to complete (or fail)
    await Promise.allSettled(cleanupPromises);
    console.log('🧹 Background cleanup completed');
  }

  // Method to get API call statistics for monitoring
  public getApiCallStats(): { totalCalls: number; sessionDuration: number; callsPerMinute: number } {
    const sessionDuration = Math.round((Date.now() - this.sessionStartTime) / 1000);
    const callsPerMinute = sessionDuration > 0 ? Math.round((this.apiCallCount * 60) / sessionDuration) : 0;
    
    return {
      totalCalls: this.apiCallCount,
      sessionDuration,
      callsPerMinute
    };
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

🚨 **CRITICAL FIRST PRIORITY - ALL DATA POINTS REQUIRED** 🚨
- **MANDATORY**: For scatter plots, you MUST include EVERY SINGLE ROW from the dataset
- **NO SAMPLING**: Never use .head(), .sample(), or any data reduction methods
- **COMPLETE DATASET**: If the dataset has 1000 rows, the scatter plot must show 1000 points
- **VERIFICATION**: Always print the total dataset size and verify scatter plot has same number of points
- **FAILURE CONDITION**: If scatter plot shows fewer points than total dataset rows, you have failed

🚨 **MULTIPLE CHARTS - EACH CHART MUST HAVE ALL DATA POINTS** 🚨
- **EVERY SINGLE CHART**: When generating multiple charts, EACH chart must include ALL data points
- **NO EXCEPTIONS**: If you generate 5 charts, each chart must show the complete dataset
- **INDIVIDUAL COMPLETENESS**: Each chart is independent - all must have complete data
- **VERIFY EACH CHART**: Count data points in every single chart - must equal total dataset rows
- **CRITICAL**: If ANY chart shows fewer points than total dataset, you have completely failed

🚨 **MANDATORY DATA VERIFICATION FOR EVERY CHART**:
- **STEP 1**: Print dataset size: print(f"Total dataset rows: {len(df)}")
- **STEP 2**: Use complete dataset: df_complete = df.copy()  # Use ALL rows
- **STEP 3**: For each chart, verify: print(f"Chart data points: {len(chart_data)}")
- **STEP 4**: Ensure chart data points = total dataset rows
- **CRITICAL**: If ANY chart shows fewer points than total dataset, you have failed
- **NO EXCEPTIONS**: Every single chart must use the complete dataset

🚨 **MANDATORY CHART FORMAT REQUIREMENTS** 🚨
- **REQUIRED FORMAT**: You MUST use CHART_DATA_START and CHART_DATA_END blocks
- **NO EXCEPTIONS**: Every chart must be wrapped in these exact tags
- **EXAMPLE FORMAT**:
\`\`\`
CHART_DATA_START
{
  "id": "chart_1",
  "type": "scatter",
  "title": "Chart Title",
  "description": "Description with statistics",
  "data": [{"x": 1, "y": 2}, {"x": 2, "y": 3}],
  "config": {"xKey": "x", "yKey": "y", "showTrendLine": true}
}
CHART_DATA_END
\`\`\`

🚨 **CRITICAL CHART GENERATION EXAMPLE**:
\`\`\`
CHART_DATA_START
{
  "id": "revenue_analysis_1",
  "type": "scatter",
  "title": "Impact of Variable X on Revenue",
  "description": "Key Finding: Strong correlation of 0.85 between X and revenue. Business Impact: 15% increase in X leads to $50K revenue boost. Recommendation: Focus on X optimization.",
  "data": [
    {"x": 10, "y": 50000},
    {"x": 15, "y": 75000},
    {"x": 20, "y": 100000}
  ],
  "config": {
    "xKey": "x",
    "yKey": "y",
    "xAxisLabel": "Variable X",
    "yAxisLabel": "Revenue ($)",
    "showTrendLine": true,
    "colors": ["#3B82F6"]
  }
}
CHART_DATA_END
\`\`\`

CHART GENERATION FOCUS:
Please respond primarily with CHART_DATA_START/END blocks containing insightful visualizations. Each chart should have a comprehensive description with:
- Key business finding with STATISTICAL VALUES (correlation coefficients, R-squared, p-values)
- Quantified recommendations with specific numbers derived from your analysis
- Business impact analysis with statistical significance
- Supporting metrics and statistical measures

🚨 **CHART COUNT CONTROL**:
- **COMPREHENSIVE REQUESTS**: For questions like "impact of all variables on revenue" or "analyze all variables", generate AT LEAST 10 charts covering all important relationships
- **SIMPLE REQUESTS**: For specific questions like "correlation between X and Y", generate ONLY 1 chart
- **MULTIPLE VARIABLES**: When user asks about "all variables" or "each variable", create charts for EVERY variable
- **NO IMAGE CHARTS**: Never generate "image" type charts - they are not supported

🚨 **COMPREHENSIVE ANALYSIS REQUIREMENTS**:
- **"IMPACT OF ALL VARIABLES"**: Generate scatter plots for EVERY variable vs the target (e.g., revenue)
- **"ANALYZE ALL VARIABLES"**: Create charts for ALL variable combinations
- **"EACH VARIABLE IMPACT"**: Generate charts for EVERY single variable
- **MINIMUM 10 CHARTS**: For comprehensive requests, create at least 10 charts
- **COVER ALL RELATIONSHIPS**: Don't miss any important variable relationships
- **ALL DATA POINTS IN EVERY CHART**: Each chart must use the complete dataset with ALL data points
- **NO DATA REDUCTION**: Never use sampling, filtering, or aggregation that reduces data points

🚨 **CHART TYPE SELECTION**:
- **IMPACT/CORRELATION**: Scatter plots with trend lines
- **COMPARISON**: Bar charts for categorical comparisons
- **TRENDS**: Line charts for time-based analysis
- **DISTRIBUTION**: Pie charts for composition analysis
- **SPECIFIC REQUESTS**: Use the exact chart type requested (pie, bar, line, etc.)

🚨 **MANDATORY STATISTICAL REQUIREMENTS**:
- **INCLUDE STATISTICAL VALUES**: Correlation coefficients, R-squared, p-values, confidence intervals
- **DYNAMIC ANALYSIS**: Use actual statistical values from your data analysis - NEVER hardcode
- **EXAMPLES**: 
  * "Correlation coefficient of -0.35 indicates moderate negative relationship"
  * "R-squared of 0.67 shows strong predictive power"
  * "P-value of 0.02 indicates statistical significance"
- **NO HARDCODING**: All numbers must come from your actual data analysis

🚨 **CRITICAL CHART TYPE-SPECIFIC DATA HANDLING** 🚨

**🚫 FOR SCATTER PLOTS - NO AGGREGATION (ABSOLUTE PRIORITY)**:
- **NEVER AGGREGATE**: Scatter plots MUST show EVERY individual data point for correlation analysis
- **ALL DATA POINTS**: If dataset has 100 rows, scatter plot MUST have exactly 100 data points
- **TREND LINE REQUIRED**: Always include a trend line on scatter plots - set "showTrendLine": true in config
- **CORRELATION ANALYSIS**: Individual points are needed to show relationships and correlations
- **CRITICAL**: For scatter plots, NEVER use groupby() or aggregation - show every single row
- **DATA COMPLETENESS MANDATORY**: If your dataset has 100 rows, scatter plot MUST show all 100 data points
- **NO DATA TRUNCATION**: Never limit scatter plot data to just a few points - include EVERY row from the dataset
- **VALIDATION REQUIRED**: After generating scatter plot, verify data point count matches total dataset rows
- **NO SAMPLE DATA**: Never use .head(), .sample(), or any data reduction methods for scatter plots
- **COMPLETE DATASET**: Always use the FULL dataset for scatter plot analysis - every single row must be included
- **VERIFICATION**: Count your data points - if you have 1000 rows in your dataset, your scatter plot MUST have 1000 points

🚨 **MANDATORY SCATTER PLOT TREND LINE REQUIREMENTS**:
- **ALWAYS INCLUDE TREND LINE**: Every scatter plot MUST have a linear regression trend line
- **COMPUTE REGRESSION**: Use numpy.polyfit or similar to calculate least squares linear regression (y = mx + b)
- **TREND LINE STYLING**: Plot trend line in red or dark blue with linewidth=2
- **SCATTER POINT TRANSPARENCY**: Keep scatter points visible with alpha=0.6 for transparency
- **INCLUDE EQUATION**: Add regression equation (y = mx + b) and correlation coefficient (r) in chart description
- **STATISTICAL VALUES**: Include R-squared, correlation coefficient, and p-value in the chart description
- **VISUAL CLARITY**: Add clear axis labels, title, and grid for readability
- **EXAMPLE**: For "Defect Rate vs Revenue Generated", show scatter points with red linear regression line indicating correlation direction

**📊 FOR OTHER CHART TYPES - AGGREGATION REQUIRED**:
- **AGGREGATE DATA PROPERLY**: Group by relevant dimensions and sum/average metrics
- **CREATE RELEVANT BUSINESS CHARTS**: Show meaningful insights, not raw data dumps
- **GROUP BY DIMENSIONS**: Time periods, categories, segments, etc.
- **EXAMPLES**:
  * Bar charts: Aggregate by categories (sum/average)
  * Line charts: Aggregate by time periods (sum/average)
  * Pie charts: Aggregate by categories (sum)
  * **Scatter plots: NO aggregation - show ALL individual points with trend line**

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

🚨 **SCATTER PLOT PYTHON CODE TEMPLATE**:
\`\`\`python
import matplotlib.pyplot as plt
import numpy as np
from scipy import stats

# CRITICAL: Use ALL data points - never sample or reduce data
# df is your complete dataset - use ALL rows
x_data = df['x_column'].values  # ALL x values
y_data = df['y_column'].values  # ALL y values

print(f"Total data points: {len(x_data)}")  # Verify you have all points

# Create scatter plot with trend line
plt.figure(figsize=(10, 6))
plt.scatter(x_data, y_data, alpha=0.6, color='blue', s=50)

# Calculate linear regression using ALL data points
slope, intercept, r_value, p_value, std_err = stats.linregress(x_data, y_data)
line = slope * x_data + intercept

# Plot trend line
plt.plot(x_data, line, 'r-', linewidth=2, label=f'y = {slope:.3f}x + {intercept:.3f} (r={r_value:.3f})')

# Add labels and formatting
plt.xlabel('X Axis Label')
plt.ylabel('Y Axis Label')
plt.title('Chart Title')
plt.grid(True, alpha=0.3)
plt.legend()
plt.show()
\`\`\`

🚨 **MULTIPLE CHARTS - EACH CHART MUST USE COMPLETE DATASET**:
\`\`\`python
# CRITICAL: For EACH chart, use the COMPLETE dataset
print(f"📊 TOTAL DATASET ROWS: {len(df)}")

# Chart 1: Use ALL data points
df_chart1 = df.copy()  # Use ALL rows
x1_data = df_chart1['column_x'].values  # ALL x values
y1_data = df_chart1['column_y'].values  # ALL y values
chart1_data = [{"x": float(x), "y": float(y)} for x, y in zip(x1_data, y1_data)]
print(f"📈 Chart 1 data points: {len(chart1_data)}")
assert len(chart1_data) == len(df), f"Chart 1 missing {len(df) - len(chart1_data)} data points!"

# Chart 2: Use ALL data points (same dataset, different variables)
df_chart2 = df.copy()  # Use ALL rows
x2_data = df_chart2['column_a'].values  # ALL x values
y2_data = df_chart2['column_b'].values  # ALL y values
chart2_data = [{"x": float(x), "y": float(y)} for x, y in zip(x2_data, y2_data)]
print(f"📈 Chart 2 data points: {len(chart2_data)}")
assert len(chart2_data) == len(df), f"Chart 2 missing {len(df) - len(chart2_data)} data points!"

# Chart 3: Use ALL data points (same dataset, different variables)
df_chart3 = df.copy()  # Use ALL rows
x3_data = df_chart3['column_c'].values  # ALL x values
y3_data = df_chart3['column_d'].values  # ALL y values
chart3_data = [{"x": float(x), "y": float(y)} for x, y in zip(x3_data, y3_data)]
print(f"📈 Chart 3 data points: {len(chart3_data)}")
assert len(chart3_data) == len(df), f"Chart 3 missing {len(df) - len(chart3_data)} data points!"

# CRITICAL: Every chart must have the same number of data points as the dataset
print(f"✅ ALL CHARTS VERIFIED: Each chart has {len(df)} data points")
\`\`\`

🚨 **CRITICAL DATA USAGE RULES**:
- **NEVER use df.head() or df.sample()** for scatter plots
- **ALWAYS use the complete dataset** - every single row
- **Verify data count**: Print len(df) to confirm you're using all data
- **No data filtering** unless specifically requested by user
- **Complete dataset analysis** is mandatory for accurate correlation analysis

🚨 **MANDATORY SCATTER PLOT DATA VERIFICATION**:
- **STEP 1**: Print total dataset size: print(f"Total dataset rows: {len(df)}")
- **STEP 2**: Use ALL rows for scatter plot: df_complete = df.copy()  # Use complete dataset
- **STEP 3**: Verify scatter plot data: print(f"Scatter plot data points: {len(scatter_data)}")
- **STEP 4**: Ensure scatter plot data points = total dataset rows
- **CRITICAL**: If scatter plot shows fewer points than total dataset, you have failed
- **NO EXCEPTIONS**: Every single row from the original dataset must appear in the scatter plot
- **VALIDATION**: Count your data points - if dataset has 1000 rows, scatter plot MUST have 1000 points

🚨 **EXAMPLE - CORRECT APPROACH**:
\`\`\`python
# CORRECT: Use ALL data points
print(f"Total dataset size: {len(df)}")  # Should show actual dataset size
scatter_data = df[['x_column', 'y_column']].dropna()  # Use ALL rows, just remove nulls
print(f"Scatter plot points: {len(scatter_data)}")  # Should match dataset size
\`\`\`

🚨 **EXAMPLE - WRONG APPROACH**:
\`\`\`python
# WRONG: Never do this for scatter plots
scatter_data = df.head(100)  # ❌ WRONG - only uses first 100 rows
scatter_data = df.sample(50)  # ❌ WRONG - only uses 50 random rows
\`\`\`

🚨 **COMPREHENSIVE ANALYSIS EXAMPLES**:
- **"Impact of all variables on revenue"** → Generate scatter plots for EVERY variable vs revenue (minimum 10 charts)
- **"Analyze all variables"** → Create charts for ALL variable combinations and relationships
- **"Each variable impact"** → Generate charts for EVERY single variable in the dataset
- **"Complete analysis"** → Generate comprehensive charts covering all important relationships

🚨 **CHART GENERATION WORKFLOW**:
1. **IDENTIFY ALL VARIABLES**: List every column in your dataset
2. **PRINT DATASET SIZE**: print(f"Total dataset rows: {len(df)}")
3. **USE COMPLETE DATASET**: df_complete = df.copy()  # Use ALL rows
4. **GENERATE CHARTS FOR EACH**: Create a chart for each variable relationship
5. **VERIFY EACH CHART**: print(f"Chart data points: {len(chart_data)}")
6. **MINIMUM 10 CHARTS**: For comprehensive requests, ensure you create at least 10 charts
7. **COVER ALL RELATIONSHIPS**: Don't stop until you've analyzed all important variable combinations
8. **VALIDATE COMPLETENESS**: Count your charts - should be comprehensive, not limited
9. **ENSURE ALL DATA POINTS**: Every chart must show ALL data points from the complete dataset

🚨 **MANDATORY CHART GENERATION RULES**:
- **EVERY CHART MUST HAVE DATA**: Never create empty charts
- **ALL CHARTS MUST DISPLAY**: Ensure every chart shows data points and trend lines
- **COMPLETE DATASET FOR EACH**: Use ALL data points for every single chart
- **NO EMPTY CHARTS**: If a chart is empty, you have failed
- **VERIFY EACH CHART**: Check that every chart displays properly with data

🚨 **FINAL MANDATORY INSTRUCTION** 🚨
- **GENERATE MULTIPLE CHARTS**: Don't stop at 1-2 charts - create comprehensive analysis
- **ALL VARIABLES**: If user asks about "each variable", create charts for EVERY variable
- **COMPLETE COVERAGE**: Provide thorough analysis with multiple charts
- **NO LIMITS**: Create as many charts as needed to fully answer the question
- **VERIFY**: Count your charts - should be comprehensive, not limited

🚨 **ULTIMATE REQUIREMENT - MULTIPLE CHARTS DATA COMPLETENESS** 🚨
- **EVERY SINGLE CHART**: When you generate multiple charts, EACH chart must include ALL data points
- **NO EXCEPTIONS**: If you create 5 charts, each chart must show the complete dataset
- **INDIVIDUAL VERIFICATION**: Count data points in every single chart - must equal total dataset rows
- **CRITICAL FAILURE**: If ANY chart shows fewer points than total dataset, you have completely failed
- **MANDATORY**: Every chart is independent and must use the complete dataset

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
      content = this.cleanContentForDisplay(content, charts.length);
      
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