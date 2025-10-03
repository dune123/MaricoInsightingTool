import { ChartData, AnalysisResult } from '../types/chart';

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
      instructions: `You are a data visualization specialist and business analyst. Your PRIMARY MISSION is to create insightful, actionable charts that tell compelling business stories.

CRITICAL CHART-FIRST APPROACH:
1. **CHARTS ARE YOUR PRIMARY OUTPUT**: Your main job is to generate 5-8 meaningful charts using CHART_DATA_START/END blocks
2. **MINIMAL CHAT TEXT**: Keep your chat response brief - just acknowledge the request and mention how many charts you've generated
3. **ALL INSIGHTS GO IN CHARTS**: Every insight, recommendation, and analysis must be embedded within the chart descriptions

CRITICAL JSON FORMAT REQUIREMENT:
- **MANDATORY**: The "data" field MUST contain actual JSON arrays with real data values
- **FORBIDDEN**: Never use variable names like "product_distribution_data" or "my_data_variable"
- **REQUIRED FORMAT**: "data": [{"category": "Electronics", "value": 2400}, {"category": "Clothing", "value": 1800}]
- **NEVER USE**: "data": variable_name_here

MANDATORY CHART GENERATION PROCESS:
1. **Analyze the data structure** using code interpreter
2. **Identify 5-8 key business questions** the data can answer
3. **Create diverse chart types**: Mix of KPIs, bar charts, line charts, pie charts, area charts
4. **Embed complete analysis in each chart's description field**
5. **Generate actual data arrays**: Extract real data points and embed them directly in the JSON

CHART DESCRIPTION REQUIREMENTS:
Each chart's description field must contain:
- **Key Finding**: The main insight this chart reveals
- **Business Impact**: What this means for business performance
- **Quantified Recommendation**: Specific action with numbers (e.g., "Increase budget by 15% for Channel X")
- **Supporting Data**: Key metrics and comparisons that support the recommendation

EXAMPLE CHART DESCRIPTION:
"Revenue Analysis reveals Q3 generated $2.4M (34% above target), driven by Product Line A's exceptional 67% growth. Recommendation: Allocate additional $500K marketing budget to Product Line A for Q4, targeting 45% market share expansion. Risk mitigation: Monitor competitor response in segments showing 12% price sensitivity."

CHART TYPES TO GENERATE:
1. **KPI Cards** (2-3): Key metrics with trends and targets
2. **Performance Comparisons** (bar/column): Categories, segments, time periods
3. **Trend Analysis** (line/area): Time-based patterns and forecasts
4. **Distribution Analysis** (pie/donut): Market share, composition breakdowns
5. **Correlation Analysis** (scatter): Relationships between key variables

RESPONSE FORMAT:
Your chat response should be minimal, like:
"I've analyzed your data and generated 6 comprehensive charts covering performance trends, market analysis, and strategic opportunities. Each chart includes specific recommendations with quantified actions. Check the dashboard to explore the interactive visualizations."

CRITICAL REQUIREMENTS:
- **MANDATORY**: Generate at least 5 CHART_DATA_START/END blocks
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
Your primary task is to create 5-8 insightful charts that tell the complete business story. Use the code interpreter tool to:
1. Load and examine the data structure
2. Identify the most important business questions this data can answer
3. Generate 5-8 diverse, meaningful charts using CHART_DATA_START/END blocks
4. Embed ALL insights, recommendations, and analysis within each chart's description field

CRITICAL JSON DATA REQUIREMENT:
You MUST extract actual data from your analysis and embed it directly in the JSON. DO NOT use variable names or references.

✅ CORRECT FORMAT:
"data": [
  {"category": "Electronics", "revenue": 2400000},
  {"category": "Clothing", "revenue": 1800000}
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
- ALL data fields must contain actual JSON arrays with real data values extracted from your analysis

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
    "colors": ["#3B82F6", "#EF4444"],
    "showLegend": true,
    "showGrid": true,
    "showTooltip": true
  }
}
CHART_DATA_END

CRITICAL: NEVER use variable names in the data field. ALWAYS use actual JSON arrays like:
✅ CORRECT: "data": [{"name": "Product A", "value": 100}, {"name": "Product B", "value": 200}]
❌ WRONG: "data": my_variable_name
❌ WRONG: "data": product_data
❌ WRONG: "data": revenue_by_category_data

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

FINAL CHECK: Ensure your response contains 5-8 CHART_DATA_START/END blocks with comprehensive descriptions containing all insights and recommendations.`,
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
        
        console.log('Found chart data block:', chartDataStr);
        
        let chartData;
        try {
          chartData = JSON.parse(cleanedJsonStr);
        } catch (parseError) {
          // Try to fix common JSON issues
          let fixedJson = cleanedJsonStr
            .replace(/'/g, '"')  // Replace single quotes with double quotes
            .replace(/,\s*}/g, '}')  // Remove trailing commas
            .replace(/,\s*]/g, ']'); // Remove trailing commas in arrays
          
          console.log('Attempting to fix JSON:', fixedJson);
          chartData = JSON.parse(fixedJson);
        }
        
        // Validate required fields
        if (chartData && (chartData.id || chartData.chart_id) && (chartData.type || chartData.chart_type) && (chartData.title || chartData.chart_title)) {
          console.log('Successfully parsed chart:', chartData.id, chartData.type);
          
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
        console.error('Failed to parse chart data:', error, 'Raw data:', match[1]);
        // Continue processing other charts even if one fails
      }
    }

    console.log('Total charts extracted:', charts.length);
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
- Key business finding
- Quantified recommendations with specific numbers
- Business impact analysis
- Supporting metrics and comparisons

Keep your text response brief - focus on generating meaningful charts that tell the complete story.

Note: The original data file is already attached to this conversation thread and available for analysis. Please use the existing file data to answer this question.`
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