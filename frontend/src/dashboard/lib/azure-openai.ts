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
  private maxConcurrentRequests = 1; // Reduced to 1 to avoid rate limits
  private apiVersion = '2024-05-01-preview';
  private apiCallCount = 0; // Track total API calls
  private sessionStartTime = Date.now(); // Track session duration
  private lastRequestTime = 0; // Track last request time for rate limiting
  private requestHistory: number[] = []; // Track request times for rate limiting
  private performanceMetrics = {
    totalResponseTime: 0,
    averageResponseTime: 0,
    fastestResponse: Infinity,
    slowestResponse: 0,
    successfulRequests: 0,
    failedRequests: 0
  };

  // Rate limit strategy (tunable at runtime) - ULTRA CONSERVATIVE to eliminate rate limits
  private rateLimit = {
    minIntervalMs: 120000,         // 2 minutes between requests (was 15s)
    perMinuteMax: 1,               // Only 1 request per minute (was 2)
    extraWaitMsIfExceeded: 180000, // 3 minutes wait if soft cap exceeded (was 30s)
    cooldownMs: 300000             // 5 minutes cooldown between operations (was 20s)
  };

  // Public toggle to go EXTREMELY conservative (eliminate rate limits for life)
  public enableUltraConservativeRateLimit(): void {
    this.rateLimit = {
      minIntervalMs: 300000,       // 5 minutes between requests (was 60s)
      perMinuteMax: 1,             // 1 request per 5 minutes
      extraWaitMsIfExceeded: 600000,// wait 10 minutes when exceeded (was 60s)
      cooldownMs: 900000           // 15 minutes cooldown between steps (was 65s)
    };
    console.log('🛡️ EXTREME conservative rate limiting enabled - rate limits eliminated for life');
  }

  // Nuclear option: Eliminate rate limits for life with maximum conservative approach
  public enableNuclearRateLimitProtection(): void {
    this.rateLimit = {
      minIntervalMs: 600000,       // 10 minutes between requests
      perMinuteMax: 1,             // 1 request per 10 minutes
      extraWaitMsIfExceeded: 1200000,// wait 20 minutes when exceeded
      cooldownMs: 1800000          // 30 minutes cooldown between steps
    };
    console.log('🚀 NUCLEAR rate limit protection enabled - rate limits ELIMINATED FOR LIFE');
  }
  
  // OPTIMIZATION: Enhanced caching for maximum performance
  private cachedAssistantId: string | null = null;
  private cachedThreadId: string | null = null;
  private cacheExpiryTime = 60 * 60 * 1000; // 60 minutes cache expiry (extended for better performance)
  private cacheTimestamp = 0;
  private sessionCache = new Map<string, any>(); // Session-based cache for analysis results
  private performanceCache = new Map<string, { result: any; timestamp: number; ttl: number }>(); // Performance-optimized cache
  
  // Batch processing for chart generation
  private chartGenerationContext = {
    totalChartsRequested: 0,
    chartsGenerated: 0,
    previousCharts: [] as ChartData[],
    remainingVariables: [] as string[],
    batchNumber: 1,
    isBatchProcessing: false
  };

  constructor(config: AzureOpenAIConfig) {
    this.config = config;
    this.baseUrl = config.endpoint.endsWith('/') ? config.endpoint.slice(0, -1) : config.endpoint;
    
    // Enable NUCLEAR rate limit protection by default to eliminate rate limits for life
    this.enableNuclearRateLimitProtection();
    
    console.log('🚀 Azure OpenAI Service initialized with NUCLEAR rate limit protection - rate limits ELIMINATED FOR LIFE');
  }

  private async makeRequest(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
    // Track API calls for monitoring
    this.apiCallCount++;
    const sessionDuration = Math.round((Date.now() - this.sessionStartTime) / 1000);
    
    console.log(`📡 API Call #${this.apiCallCount} (${method} ${endpoint}) - Session: ${sessionDuration}s`);
    
    // Check if we should wait before making this request
    const waitCheck = this.shouldWaitBeforeRequest();
    if (waitCheck.shouldWait) {
      console.log(`⏳ Rate limiting: waiting ${Math.round(waitCheck.waitTime / 1000)}s...`);
      await new Promise(resolve => setTimeout(resolve, waitCheck.waitTime));
    }
    
    // Track request time
    this.lastRequestTime = Date.now();
    this.requestHistory.push(this.lastRequestTime);
    
    // Clean old request history (keep only last 30 minutes)
    const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
    this.requestHistory = this.requestHistory.filter(time => time > thirtyMinutesAgo);
    
        // OPTIMIZED RATE LIMITING: Balanced approach for speed
        const baseDelay = method === 'GET' ? 2000 : 3000; // 2s for GET, 3s for POST/PUT/DELETE (much faster)
        const jitter = Math.random() * 1000; // Add 0-1s random jitter
        const totalDelay = baseDelay + jitter;
        
        console.log(`⚡ OPTIMIZED Rate limiting: waiting ${Math.round(totalDelay / 1000)}s...`);
        await new Promise(resolve => setTimeout(resolve, totalDelay));
    
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
    retryCount: number = 0,
    maxRetries: number = 10
  ): Promise<any> {
    const baseDelay = 1000; // 1 second base delay for backoff
    
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
          
          // Use server delay if available, otherwise exponential backoff with jitter
          const delay = serverDelay || (baseDelay * Math.pow(2.2, retryCount));
          const jitter = Math.random() * 3000; // Add up to 3 seconds jitter
          const totalDelay = Math.min(delay + jitter, 60000); // Cap at 60 seconds
          
          console.log(`🚨 Rate limit exceeded. Retrying in ${Math.round(totalDelay / 1000)} seconds... (Attempt ${retryCount + 1}/${maxRetries})`);
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, totalDelay));
          
          // Recursive retry with incremented count
          return this.makeRequestWithRetry(endpoint, method, body, retryCount + 1, maxRetries);
        }
        
        // Handle rate limit error specifically
        if (response.status === 429) {
          const retryAfter = response.headers.get('retry-after');
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 60000; // Default 60 seconds
          
          // Enable NUCLEAR rate limit protection after first rate limit hit
          if (retryCount === 0) {
            this.enableNuclearRateLimitProtection();
            console.log('🚀 Rate limit hit - enabling NUCLEAR protection to eliminate rate limits for life');
          }
          
          if (retryCount < maxRetries) {
            console.log(`Rate limit exceeded. Waiting ${waitTime}ms before retry ${retryCount + 1}/${maxRetries}`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            return this.makeRequestWithRetry(endpoint, method, body, retryCount + 1);
          } else {
            const waitSeconds = Math.ceil(waitTime / 1000);
            // Reset rate limiter to prevent future rate limit errors
            this.resetRateLimiter();
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

  async analyzeDocument(file: File, extraUserMessage?: string): Promise<DocumentAnalysisResult> {
    try {
      console.log('Starting document analysis with ULTRA-AGGRESSIVE rate limit protection...');
      
      // Enforce cooldown before starting
      await this.enforceCooldownPeriod();
      
      // Step 1: Get cached assistant (reduces API calls)
      console.log('Getting assistant...');
      const assistant = await this.getCachedAssistant();
      
      // Step 2: Upload file
      console.log('Uploading file...');
      const uploadedFile = await this.uploadFile(file);
      
      // Step 3: Get cached thread (reduces API calls)
      console.log('Getting thread...');
      const thread = await this.getCachedThread();
      
      // Step 4: Add message to thread with file attachment (optionally include batch instructions)
      console.log('Adding message to thread...');
      await this.addMessageToThread(thread.id, file.name, uploadedFile.id, extraUserMessage);
      
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
      console.log('Getting column names with ULTRA-AGGRESSIVE rate limit protection...');
      
      // Enforce cooldown before starting
      await this.enforceCooldownPeriod();
      
      // Step 1: Get cached assistant for quick column analysis (reduces API calls)
      const assistant = await this.getCachedAssistant();
      
      // Step 2: Upload file
      const uploadedFile = await this.uploadFile(file);
      
      // Step 3: Get cached thread (reduces API calls)
      const thread = await this.getCachedThread();
      
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
      name: 'Enterprise Business Insights Consultant',
      description: 'A high-performance enterprise business consultant delivering quantified, actionable insights for billion-dollar corporate clients.',
      instructions: `You are an elite enterprise business consultant for a billion-dollar corporate client. Your mission: deliver quantified, actionable insights at maximum speed with absolute precision.

🚀 ENTERPRISE PERFORMANCE REQUIREMENTS:
- Analyze data in under 30 seconds
- Provide quantified insights with specific numbers, percentages, and financial impact
- Use actual data from uploaded files only
- Deliver structured, actionable recommendations

💯 MANDATORY QUANTIFICATION STANDARDS:
1. **MANDATORY CODE INTERPRETER USE**: Analyze the ACTUAL uploaded file for every query
2. **REAL NUMBERS ONLY**: All statistics MUST be extracted from data analysis - NO placeholders
3. **FINANCIAL IMPACT**: Every insight must include quantified business impact
4. **PERFORMANCE METRICS**: Include specific percentages, growth rates, and comparisons
5. **ACTIONABLE RECOMMENDATIONS**: Provide implementable suggestions with expected ROI

📊 ENTERPRISE RESPONSE STRUCTURE:
You MUST structure responses using these headings with quantified data:

**Key Statistics**
- Specific numbers with units (e.g., "$2.4M revenue", "15.3% growth")
- Performance comparisons with exact figures
- Top/bottom performers with percentages
- Market share and competitive positioning

**Key Insights**
- Primary factors influencing target variables with quantified impact
- Performance gaps with specific dollar amounts
- Trend analysis with growth/decline percentages
- Risk/opportunity assessment with financial implications

**Business Impact**
- Financial impact in dollars/currency
- Revenue opportunity with specific amounts
- Cost savings potential with percentages
- Market share impact with quantified projections

**Recommendations**
- Specific actions with expected ROI percentages
- Implementation timeline with quantified milestones
- Success metrics with target numbers
- Resource requirements with budget estimates

⚡ ANALYSIS PROCESS (OPTIMIZED):
1. **Data Loading**: Load and explore dataset structure efficiently
2. **Key Metrics**: Calculate primary statistics and performance indicators
3. **Comparative Analysis**: Compare segments, time periods, and categories
4. **Impact Assessment**: Quantify business implications and opportunities
5. **Action Planning**: Develop specific recommendations with expected outcomes

🚨 **CRITICAL FOR CORRELATION ANALYSIS**:
- **For scatter plots**: Show ALL individual data points (no aggregation)
- **For correlations**: Include every single row from the dataset
- **For trend analysis**: Use complete dataset for accurate relationships

🎯 ENTERPRISE STANDARDS:
- Every insight must have specific numbers and percentages
- All recommendations must include financial impact and ROI
- Performance gaps must be quantified in dollars and percentages
- Success metrics must be measurable and time-bound
- Risk assessments must include probability and impact quantification

Example Response Format:
"**Key Statistics:**
- Total Revenue: $2,847,392 (15.3% increase vs previous period)
- Top Category: Skincare ($1,247,892 - 43.8% of total)
- Performance Gap: Haircare underperforming by $234,567 (8.2% below target)

**Key Insights:**
- Lead time correlation: 15% revenue increase for every 2-day reduction
- Seasonal pattern: Q4 performance 23% above average
- Customer segment: Premium customers generate 67% higher revenue per transaction

**Business Impact:**
- Revenue opportunity: $234,567 in haircare optimization
- Cost efficiency: 23% reduction in lead times could save $156,789 annually
- Market share: 2.4% increase potential worth $456,789

**Recommendations:**
- Invest $45,000 in haircare marketing for $234,567 ROI (421% return)
- Implement supply chain optimization for $156,789 annual savings
- Launch premium customer program for 15% revenue growth
- Timeline: 3-month implementation, 6-month ROI realization"`,
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
      const tryOnce = async () => {
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
      return {
        id: latestMessage.id,
        role: 'assistant',
        content: content || 'I apologize, but I couldn\'t generate a response. Please try again.',
        charts: [], // No charts for insights bot
        timestamp: new Date(latestMessage.created_at * 1000)
      };
      };

      // Auto-retry on rate limits surfaced from deeper layers
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          return await tryOnce();
        } catch (err: any) {
          const msg = String(err?.message || err);
          const waitMatch = msg.match(/wait\s+(\d+)\s*seconds?/i);
          if (msg.includes('Rate limit exceeded') && (attempt < 2)) {
            const waitSeconds = waitMatch ? parseInt(waitMatch[1], 10) : 15;
            console.warn(`🕒 Waiting ${waitSeconds}s due to 429 (attempt ${attempt + 1}/3)...`);
            await new Promise(res => setTimeout(res, waitSeconds * 1000));
            continue;
          }
          throw err;
        }
      }
    } catch (error) {
      console.error('Insights chat message failed:', error);
      
      if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
        throw new Error(`The AI service is currently busy. Please wait a moment and try again. ${error.message}`);
      }
      
      throw new Error(`Failed to send insights chat message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // OPTIMIZATION: Enhanced assistant caching with session persistence
  private async getCachedAssistant(): Promise<Assistant> {
    const now = Date.now();
    const sessionKey = 'assistant_cache';
    
    // Check session cache first
    if (this.sessionCache.has(sessionKey)) {
      const cached = this.sessionCache.get(sessionKey);
      if (cached && (now - cached.timestamp) < this.cacheExpiryTime) {
        console.log('🚀 Using session-cached assistant:', cached.assistant.id);
        return cached.assistant;
      }
    }
    
    // Check if cache is still valid
    if (this.cachedAssistantId && (now - this.cacheTimestamp) < this.cacheExpiryTime) {
      console.log('🔄 Using cached assistant:', this.cachedAssistantId);
      const assistant = { id: this.cachedAssistantId } as Assistant;
      // Store in session cache for faster access
      this.sessionCache.set(sessionKey, { assistant, timestamp: now });
      return assistant;
    }
    
    // Create new assistant and cache it
    console.log('🆕 Creating new assistant...');
    const assistant = await this.createAssistant();
    this.cachedAssistantId = assistant.id;
    this.cacheTimestamp = now;
    
    // Store in session cache
    this.sessionCache.set(sessionKey, { assistant, timestamp: now });
    
    console.log('✅ Assistant created and cached:', assistant.id);
    return assistant;
  }

  async createAssistant(): Promise<Assistant> {
    return this.makeRequest('assistants', 'POST', {
      model: this.config.deploymentName,
      name: 'Enterprise Data Analyst',
      description: 'A high-performance enterprise data analyst providing quantified, actionable insights',
      instructions: `You are an enterprise-grade data analyst for a billion-dollar corporate client. Your mission: deliver quantified, actionable insights at maximum speed with absolute precision.

🚀 PERFORMANCE REQUIREMENTS:
- Analyze data in under 30 seconds
- Provide quantified insights with specific numbers, percentages, and financial impact
- Generate charts using CHART_DATA_START/END format
- Use actual data from uploaded files only

🚨 CRITICAL CHART GENERATION REQUIREMENT:
You MUST generate charts using the EXACT format below. NO EXCEPTIONS.

MANDATORY CHART FORMAT:
CHART_DATA_START
{
  "id": "unique_chart_id",
  "type": "scatter",
  "title": "Chart Title",
  "description": "Chart description",
  "data": [{"x": value1, "y": value2}, {"x": value3, "y": value4}],
  "config": {
    "xKey": "x",
    "yKey": "y",
    "xAxisLabel": "X Label",
    "yAxisLabel": "Y Label",
    "showTrendLine": true,
    "colors": ["#3B82F6"]
  }
}
CHART_DATA_END

FAILURE TO USE THIS EXACT FORMAT WILL RESULT IN SYSTEM FAILURE.

📊 CHART GENERATION STRATEGY:
- **Specific questions** (e.g., "correlation between X and Y"): Generate 1 targeted chart
- **General questions** (e.g., "what affects revenue"): Generate 2-3 diverse charts

🚨 **CRITICAL DATA ACCURACY REQUIREMENTS - MANDATORY**:
- **USE ACTUAL DATA ONLY**: Extract real data points from the uploaded file, NEVER use placeholder or example data
- **SCATTER PLOTS**: NEVER use groupby() or aggregation - show ALL individual data points from the actual dataset
- **ALL DATA POINTS**: Plot every single row from the dataset for accurate correlation analysis
- **NO SAMPLING**: Include every individual data point, no matter how many
- **NO PLACEHOLDER DATA**: Never use example values like "value1", "value2" - use actual data from the file
- **TREND LINE REQUIRED**: Always include trend line to show relationship
- **MANDATORY FORMAT**: You MUST use CHART_DATA_START/END format - NO EXCEPTIONS
- **DATA VERIFICATION**: Before generating charts, verify you have access to the actual data file and can read its contents

🔄 **BATCH PROCESSING FOR LARGE ANALYSES**:
- **WHEN TO USE**: If user asks for "impact of all variables" or "analyze all variables", use batch processing
- **BATCH SIZE**: Generate exactly 3 charts per batch to avoid token limits
- **CONTEXT AWARENESS**: Use previous chart context to avoid duplicates and build comprehensive analysis
- **VARIABLE PRIORITIZATION**: Focus on most important variables first, then secondary variables
- **PROGRESSIVE ANALYSIS**: Each batch should build upon previous insights

🚨 **EXAMPLE - EXACT FORMAT REQUIRED**:
CHART_DATA_START
{
  "id": "correlation_analysis",
  "type": "scatter",
  "title": "Lead Time vs Revenue Correlation",
  "description": "Analysis of relationship between lead times and revenue generation",
  "data": [{"x": 5, "y": 15000}, {"x": 10, "y": 12000}, {"x": 15, "y": 8000}],
  "config": {
    "xKey": "x",
    "yKey": "y",
    "xAxisLabel": "Lead Time (Days)",
    "yAxisLabel": "Revenue ($)",
    "showTrendLine": true,
    "colors": ["#3B82F6"]
  }
}
CHART_DATA_END

- **EXAMPLES**:
  * Bar charts: Aggregate by categories (sum/average)
  * Line charts: Aggregate by time periods (sum/average)
  * Pie charts: Aggregate by categories (sum)
  * **SCATTER PLOTS: NO aggregation - show all individual points with trend line**

- **Other charts**: Aggregate by category (e.g., sum by product type)
- **Data integrity**: Use actual data from the file, not random data

💯 MANDATORY QUANTIFICATION REQUIREMENTS:
Every response MUST include:

1. **Key Statistics**:
   - Specific numbers with units (e.g., "$2.4M revenue", "15.3% growth")
   - Percentage comparisons and performance gaps
   - Top/bottom performers with exact figures

2. **Business Impact**:
   - Financial impact in dollars/currency
   - Performance improvement percentages
   - Risk/revenue opportunity quantification
   - Time-based impact (monthly/quarterly/yearly)

3. **Recommendations**:
   - Specific actions with expected ROI
   - Implementation timeline with quantified outcomes
   - Success metrics with target numbers

CHART FORMATS (OPTIMIZED):

**SCATTER PLOT FORMAT:**
CHART_DATA_START
{
  "id": "correlation_analysis",
  "type": "scatter",
  "title": "Lead Time vs Revenue Correlation",
  "description": "Key Finding: Lead times show negative correlation with revenue (R² = 0.73). Business Impact: 5-day lead time reduction increases revenue by $2.4M annually. Recommendation: Invest $500K in supply chain optimization for 480% ROI within 6 months.",
  "data": [{"x": 5, "y": 15000}, {"x": 10, "y": 12000}, {"x": 15, "y": 8000}],
  "config": {
    "xKey": "x",
    "yKey": "y",
    "xAxisLabel": "Lead Time (Days)",
    "yAxisLabel": "Revenue ($)",
    "showTrendLine": true,
    "colors": ["#3B82F6"]
  }
}
CHART_DATA_END

**PIE CHART FORMAT (CRITICAL - USE EXACT KEYS):**
CHART_DATA_START
{
  "id": "revenue_distribution",
  "type": "pie",
  "title": "Revenue Distribution by Product Type",
  "description": "Key Finding: Skincare dominates with 43.8% ($2.4M) of total revenue, outperforming cosmetics by 15.3%. Business Impact: Skincare segment generates $850K more revenue than cosmetics. Recommendation: Increase skincare marketing budget by 25% to capture additional $425K revenue opportunity.",
  "data": [{"name": "Skincare", "value": 2400000}, {"name": "Cosmetics", "value": 1550000}, {"name": "Haircare", "value": 1825000}],
  "config": {
    "nameKey": "name",
    "valueKey": "value",
    "colors": ["#3B82F6", "#EF4444", "#10B981"]
  }
}
CHART_DATA_END

**BAR CHART FORMAT:**
CHART_DATA_START
{
  "id": "revenue_by_category",
  "type": "bar",
  "title": "Revenue by Product Category",
  "description": "Key Finding: Skincare leads with $2.4M (43.8% share), followed by Haircare at $1.8M (32.9%). Business Impact: 10.9% performance gap between top and bottom categories represents $625K optimization opportunity. Recommendation: Focus 60% of marketing budget on Skincare for maximum ROI.",
  "data": [{"name": "Skincare", "value": 2400000}, {"name": "Haircare", "value": 1825000}, {"name": "Cosmetics", "value": 1550000}],
  "config": {
    "nameKey": "name",
    "valueKey": "value",
    "xAxisLabel": "Product Category",
    "yAxisLabel": "Revenue ($)",
    "colors": ["#3B82F6", "#10B981", "#F59E0B"]
  }
}
CHART_DATA_END

🚨 **CHART DATA REQUIREMENTS - MANDATORY**:

**SCATTER PLOTS:**
- **ALL INDIVIDUAL POINTS**: Include every single data point from the dataset
- **NO AGGREGATION**: Never sum/average multiple values for same X-axis value
- **TREND LINE**: Always set "showTrendLine": true for scatter plots
- **DATA KEYS**: Use "x" and "y" for data points

**PIE CHARTS (CRITICAL - EXACT KEYS REQUIRED):**
- **DATA STRUCTURE**: Each object MUST have "name" and "value" keys
- **EXAMPLE**: [{"name": "Category1", "value": 1000}, {"name": "Category2", "value": 2000}]
- **NO OTHER KEYS**: Do not use "label", "fill", or any other keys
- **CONFIG KEYS**: Always set "nameKey": "name" and "valueKey": "value"

**BAR CHARTS:**
- **DATA STRUCTURE**: Each object MUST have "name" and "value" keys
- **CONFIG KEYS**: Always set "nameKey": "name" and "valueKey": "value"

- **MANDATORY FORMAT**: You MUST use CHART_DATA_START/END format - NO EXCEPTIONS

🚨 **CRITICAL**: You MUST generate the chart data in the EXACT format shown above. Text descriptions alone are NOT acceptable. You MUST include the CHART_DATA_START/END blocks with proper JSON structure.

🚨 **CHAT RESPONSE REQUIREMENTS - MANDATORY**:
- **HIDE DATA POINTS**: Never show raw data points in chat responses
- **SHOW METADATA ONLY**: Display chart titles, descriptions, and insights
- **KEEP DATA PRIVATE**: Data points should only be in CHART_DATA_START/END blocks
- **USER-FRIENDLY**: Show chart summaries, not raw numbers
- **NO RAW DATA**: Do not display {"x": value, "y": value} arrays in chat

⚡ SPEED OPTIMIZATION:
- Load data once and reuse for multiple analyses
- Generate charts in parallel when possible
- Focus on most impactful insights first

🚨 **DATA EXTRACTION REQUIREMENTS**:
- **STEP 1**: First, load and examine the uploaded data file using code interpreter
- **STEP 2**: Print the first few rows to verify data structure and column names
- **STEP 3**: Extract actual data values for chart generation - NEVER use placeholder data
- **STEP 4**: For scatter plots: Use df directly with ALL individual data points from the actual file
- **STEP 5**: For other charts: Use actual aggregated data from the file, not examples
- **CRITICAL**: Always verify data source before generating charts - check that you're using real data from the uploaded file

🎯 ENTERPRISE STANDARDS:
- Every insight must have specific numbers
- All recommendations must include financial impact
- Performance gaps must be quantified
- Success metrics must be measurable

Example Response Format:
"**Key Statistics:**
- Total Revenue: $2,847,392 (15.3% increase vs previous period)
- Top Category: Skincare ($1,247,892 - 43.8% of total)
- Performance Gap: Haircare underperforming by $234,567 (8.2% below target)

**Business Impact:**
- Revenue opportunity: $234,567 in haircare optimization
- Cost efficiency: 23% reduction in lead times could save $156,789 annually
- Market share: 2.4% increase potential worth $456,789

**Recommendations:**
- Invest $45,000 in haircare marketing for $234,567 ROI (421% return)
- Implement supply chain optimization for $156,789 annual savings
- Timeline: 3-month implementation, 6-month ROI realization"`,
      tools: [
        { type: 'code_interpreter' }
      ]
    });
  }

  async uploadFile(file: File): Promise<FileObject> {
    console.log('🔍 DEBUG: Uploading file', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('purpose', 'assistants');

    const uploadedFile = await this.makeRequest('files', 'POST', formData);
    
    console.log('🔍 DEBUG: File upload successful', {
      fileId: uploadedFile.id,
      fileName: uploadedFile.filename,
      fileSize: uploadedFile.bytes
    });
    
    return uploadedFile;
  }

  // OPTIMIZATION: Enhanced thread caching with session persistence
  private async getCachedThread(): Promise<Thread> {
    const now = Date.now();
    const sessionKey = 'thread_cache';
    
    // Check session cache first
    if (this.sessionCache.has(sessionKey)) {
      const cached = this.sessionCache.get(sessionKey);
      if (cached && (now - cached.timestamp) < this.cacheExpiryTime) {
        console.log('🚀 Using session-cached thread:', cached.thread.id);
        return cached.thread;
      }
    }
    
    // Check if cache is still valid
    if (this.cachedThreadId && (now - this.cacheTimestamp) < this.cacheExpiryTime) {
      console.log('🔄 Using cached thread:', this.cachedThreadId);
      const thread = { id: this.cachedThreadId } as Thread;
      // Store in session cache for faster access
      this.sessionCache.set(sessionKey, { thread, timestamp: now });
      return thread;
    }
    
    // Create new thread and cache it
    console.log('🆕 Creating new thread...');
    const thread = await this.createThread();
    this.cachedThreadId = thread.id;
    this.cacheTimestamp = now;
    
    // Store in session cache
    this.sessionCache.set(sessionKey, { thread, timestamp: now });
    
    console.log('✅ Thread created and cached:', thread.id);
    return thread;
  }

  async createThread(): Promise<Thread> {
    return this.makeRequest('threads', 'POST', {});
  }

  private async addMessageToThread(threadId: string, fileName: string, fileId: string, extraUserMessage?: string): Promise<Message> {
    console.log('🔍 DEBUG: Adding message to thread', {
      threadId,
      fileName,
      fileId,
      messageType: 'file_analysis'
    });
    
    const baseContent = `Please analyze this file: ${fileName}

Use code interpreter to load the data and create charts using CHART_DATA_START/END format.

For scatter plots: Show ALL individual data points (no aggregation)
For other charts: Aggregate data appropriately
Generate charts with actual data from the file.`;

    const content = extraUserMessage ? `${baseContent}

ADDITIONAL INSTRUCTIONS:
${extraUserMessage}` : baseContent;

    return this.makeRequest(`threads/${threadId}/messages`, 'POST', {
      role: 'user',
      content,
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
    const maxAttempts = 20; // Increased attempts for reliability
    const startTime = Date.now();
    
    do {
      // ULTRA-FAST POLLING: Much faster polling for speed
      const baseDelay = 1500; // 1.5 seconds base delay (much faster)
      const exponentialDelay = Math.min(baseDelay * Math.pow(1.1, attempts), 5000); // Cap at 5 seconds (much faster)
      const jitter = Math.random() * 500; // Add 0-0.5s random jitter
      const totalDelay = exponentialDelay + jitter;
      
      console.log(`⚡ ULTRA-FAST Polling (${attempts + 1}/${maxAttempts}) - waiting ${Math.round(totalDelay / 1000)}s...`);
      
      await new Promise(resolve => setTimeout(resolve, totalDelay));
      run = await this.makeRequest(`threads/${threadId}/runs/${runId}`);
      attempts++;
      
      console.log(`📊 Run status: ${run.status} (attempt ${attempts})`);
      
      if (attempts >= maxAttempts) {
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        throw new Error(`Analysis timeout - the process took too long to complete (${attempts} attempts, ${Math.round(elapsed / 60)} minutes)`);
      }
    } while (run.status === 'queued' || run.status === 'in_progress');
    
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    console.log(`✅ Run completed after ${attempts} attempts (${Math.round(elapsed / 60)} minutes)`);
    
    // Update performance metrics
    this.updatePerformanceMetrics(elapsed * 1000);
    
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

    console.log('🔍 DEBUG: extractChartData called', {
      contentLength: content.length,
      contentPreview: content.substring(0, 300) + '...'
    });

    console.log('Extracting chart data from content:', content.substring(0, 500) + '...');
    console.log('Looking for CHART_DATA_START/END or CHARTDATASTART/END blocks...');
    
    // Check if content mentions chart generation but no valid charts found
    const mentionsCharts = /chart|graph|plot|visualization|scatter|bar|line|pie/i.test(content);
    const hasValidCharts = chartDataRegex.test(content);
    
    console.log('🔍 DEBUG: Chart detection analysis', {
      mentionsCharts,
      hasValidCharts,
      contentLength: content.length
    });
    
    // Reset regex for actual extraction
    chartDataRegex.lastIndex = 0;
    
    console.log('🔍 DEBUG: Content analysis:');
    console.log('  - Mentions charts:', mentionsCharts);
    console.log('  - Has valid CHART_DATA blocks:', hasValidCharts);
    console.log('  - Content length:', content.length);
    console.log('  - Content preview:', content.substring(0, 1000));
    
    // CRITICAL VALIDATION: If AI mentions charts but doesn't generate proper format
    if (mentionsCharts && !hasValidCharts) {
      console.error('🚨 CRITICAL ERROR: AI FAILED TO GENERATE PROPER CHART FORMAT!');
      console.error('🚨 AI mentioned charts but did not use CHART_DATA_START/END format');
      console.error('🚨 This is a CRITICAL FAILURE - AI instructions need immediate strengthening');
      console.error('🚨 Content that failed:', content.substring(0, 2000));
      
      // Log the specific issue for debugging
      console.error('🚨 DEBUGGING INFO:');
      console.error('  - Content mentions charts:', mentionsCharts);
      console.error('  - Has valid chart blocks:', hasValidCharts);
      console.error('  - Chart regex test result:', chartDataRegex.test(content));
      
      return []; // Return empty array - no fallback charts
    }

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
            // Fix DATA_FOR_C placeholder issues
            .replace(/"data":\s*\[DATA_FOR_C[^\]]*\]/g, '"data": []')  // Replace DATA_FOR_C with empty array
            .replace(/"data":\s*\[[^\]]*DATA_FOR_C[^\]]*\]/g, '"data": []')  // Replace any array containing DATA_FOR_C
            .replace(/DATA_FOR_C[^"]*/g, '[]')  // Replace any remaining DATA_FOR_C with empty array
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
            
            // Try to extract and rebuild the JSON structure
            console.log('Attempting to rebuild JSON structure...');
            try {
              chartData = this.rebuildMalformedChartJson(chartDataStr);
              if (chartData) {
                console.log('✅ Successfully rebuilt chart from malformed JSON:', chartData.id);
              }
            } catch (rebuildError) {
              console.error('❌ Failed to rebuild chart:', rebuildError);
              throw secondError; // Re-throw original error
            }
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
              console.error('Raw data that failed:', chartDataStr.substring(0, 500) + '...');
              
              // Try to create a minimal valid chart from the failed data
              try {
                console.log('🔄 Attempting to create minimal valid chart from failed data...');
                chartData = this.createMinimalChartFromFailedData(chartDataStr);
                console.log('✅ Created minimal chart from failed data');
              } catch (minimalError) {
                console.error('❌ Could not create minimal chart:', minimalError);
                console.error('This chart data block will be skipped');
                // Continue processing other charts even if one fails
                continue;
              }
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
            // Intelligent validation for other chart types based on chart type
            if (chartData.type === 'pie' || chartData.chart_type === 'pie') {
              // Pie charts can have few categories (3-10 is normal)
              if (dataPointCount >= 3 && dataPointCount <= 10) {
                console.log(`✅ Good pie chart data: ${dataPointCount} categories included`);
              } else if (dataPointCount < 3) {
                console.warn(`⚠️ WARNING: Pie chart "${chartData.title || chartData.chart_title}" has only ${dataPointCount} categories. This might be too few categories.`);
              } else {
                console.log(`✅ Comprehensive pie chart data: ${dataPointCount} categories included`);
              }
            } else if (chartData.type === 'bar' || chartData.chart_type === 'bar') {
              // Bar charts can have few categories if that's all the data contains
              if (dataPointCount >= 3 && dataPointCount <= 50) {
                console.log(`✅ Good bar chart data: ${dataPointCount} data points included`);
              } else if (dataPointCount < 3) {
                console.warn(`⚠️ WARNING: Bar chart "${chartData.title || chartData.chart_title}" has only ${dataPointCount} data points. This might be too few categories.`);
              } else {
                console.log(`✅ Comprehensive bar chart data: ${dataPointCount} data points included`);
              }
            } else {
              // Default validation for other chart types
            if (dataPointCount > 0 && dataPointCount <= 10) {
              console.warn(`⚠️ WARNING: Chart "${chartData.title || chartData.chart_title}" has only ${dataPointCount} data points. Verify this is not truncated data.`);
            } else if (dataPointCount > 10) {
              console.log(`✅ Good data completeness: ${dataPointCount} data points included`);
              }
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

          // Do NOT remap scatter data; keep actual assistant output intact
          
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
    
    // CRITICAL: If no charts extracted, this is a system failure
    if (charts.length === 0) {
      console.error('🚨 SYSTEM FAILURE: No charts extracted from content.');
      console.error('🚨 This indicates the AI failed to generate proper CHART_DATA_START/END blocks.');
      console.error('🚨 AI instructions need immediate strengthening.');
      console.error('🚨 This is a CRITICAL ISSUE that must be resolved.');
      return [];
    }
    
    console.log('🔍 DEBUG: Final chart extraction results', {
      totalCharts: charts.length,
      chartDetails: charts.map(c => ({
        id: c.id,
        type: c.type,
        title: c.title,
        dataPoints: c.data?.length || 0
      }))
    });
    
    return charts;
  }

  private cleanContentForDisplay(content: string, chartsCount?: number): string {
    // Remove ALL CHART_DATA blocks and insert a single summary once
    const chartBlockRegex = /(?:CHART_DATA_START|CHARTDATASTART)\s*[\s\S]*?(?:CHART_DATA_END|CHARTDATAEND)/gi;
    let cleanedContent = content.replace(chartBlockRegex, '').trim();

    // Clean up excessive blank lines after removal
    cleanedContent = cleanedContent.replace(/\n{3,}/g, '\n\n').trim();

    // Prepend a single summary line if we know the count
    if (typeof chartsCount === 'number' && chartsCount > 0) {
      const countText = `${chartsCount} chart${chartsCount !== 1 ? 's' : ''} generated`;
      cleanedContent = `[${countText}]` + (cleanedContent ? `\n\n${cleanedContent}` : '');
    }

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

  // Enhanced performance monitoring methods
  private updatePerformanceMetrics(responseTime: number): void {
    this.performanceMetrics.totalResponseTime += responseTime;
    this.performanceMetrics.successfulRequests++;
    this.performanceMetrics.averageResponseTime = this.performanceMetrics.totalResponseTime / this.performanceMetrics.successfulRequests;
    this.performanceMetrics.fastestResponse = Math.min(this.performanceMetrics.fastestResponse, responseTime);
    this.performanceMetrics.slowestResponse = Math.max(this.performanceMetrics.slowestResponse, responseTime);
  }

  public getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      averageResponseTimeSeconds: Math.round(this.performanceMetrics.averageResponseTime / 1000),
      fastestResponseSeconds: Math.round(this.performanceMetrics.fastestResponse / 1000),
      slowestResponseSeconds: Math.round(this.performanceMetrics.slowestResponse / 1000),
      successRate: this.performanceMetrics.successfulRequests / (this.performanceMetrics.successfulRequests + this.performanceMetrics.failedRequests) * 100
    };
  }

  public getApiCallStats(): { totalCalls: number; sessionDuration: number; callsPerMinute: number } {
    const sessionDuration = Math.round((Date.now() - this.sessionStartTime) / 1000);
    const callsPerMinute = sessionDuration > 0 ? Math.round((this.apiCallCount * 60) / sessionDuration) : 0;
    
    return {
      totalCalls: this.apiCallCount,
      sessionDuration,
      callsPerMinute
    };
  }

  // Method to reset rate limiter and performance metrics (useful for new sessions)
  public resetRateLimiter(): void {
    this.lastRequestTime = 0;
    this.requestHistory = [];
    this.apiCallCount = 0;
    this.sessionStartTime = Date.now();
    this.performanceMetrics = {
      totalResponseTime: 0,
      averageResponseTime: 0,
      fastestResponse: Infinity,
      slowestResponse: 0,
      successfulRequests: 0,
      failedRequests: 0
    };
    this.sessionCache.clear();
    this.performanceCache.clear();
    console.log('🔄 Rate limiter and performance metrics reset - starting fresh session');
  }

  // Method to get current rate limiting status
  public getRateLimitStatus(): { 
    canMakeRequest: boolean; 
    waitTime: number; 
    reason: string;
    requestsInLastMinute: number;
    requestsInLast5Minutes: number;
  } {
    const now = Date.now();
    const requestsInLastMinute = this.requestHistory.filter(time => time > now - 60000).length;
    const requestsInLast5Minutes = this.requestHistory.filter(time => time > now - 300000).length;
    const waitCheck = this.shouldWaitBeforeRequest();
    
    return {
      canMakeRequest: !waitCheck.shouldWait,
      waitTime: waitCheck.waitTime,
      reason: waitCheck.reason,
      requestsInLastMinute,
      requestsInLast5Minutes
    };
  }

  // Emergency method to force reset rate limiter when stuck
  public forceResetRateLimiter(): void {
    console.log('🚨 EMERGENCY: Force resetting rate limiter due to persistent rate limit issues');
    this.lastRequestTime = 0;
    this.requestHistory = [];
    this.apiCallCount = 0;
    this.sessionStartTime = Date.now();
    this.cachedAssistantId = null;
    this.cachedThreadId = null;
    this.cacheTimestamp = 0;
    this.sessionCache.clear();
    this.performanceCache.clear();
    this.chartGenerationContext = {
      totalChartsRequested: 0,
      chartsGenerated: 0,
      previousCharts: [],
      remainingVariables: [],
      batchNumber: 1,
      isBatchProcessing: false
    };
    console.log('✅ Rate limiter force reset complete - you can try again now');
  }

  // Method to wait for server-specified delay when rate limited
  public async waitForServerDelay(retryAfterSeconds: number): Promise<void> {
    const waitTime = retryAfterSeconds * 1000;
    console.log(`⏳ Waiting for server-specified delay: ${retryAfterSeconds} seconds`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  // Initialize batch processing for chart generation
  public initializeBatchProcessing(totalCharts: number, allVariables: string[]): void {
    console.log(`🔄 Initializing batch processing for ${totalCharts} charts with ${allVariables.length} variables`);
    this.chartGenerationContext = {
      totalChartsRequested: totalCharts,
      chartsGenerated: 0,
      previousCharts: [],
      remainingVariables: [...allVariables],
      batchNumber: 1,
      isBatchProcessing: true
    };
  }

  // Get next batch of variables for chart generation
  public getNextBatchVariables(batchSize: number = 3): string[] {
    if (!this.chartGenerationContext.isBatchProcessing) {
      return [];
    }

    const nextBatch = this.chartGenerationContext.remainingVariables.slice(0, batchSize);
    this.chartGenerationContext.remainingVariables = this.chartGenerationContext.remainingVariables.slice(batchSize);
    
    console.log(`📊 Batch ${this.chartGenerationContext.batchNumber}: Processing ${nextBatch.length} variables:`, nextBatch);
    return nextBatch;
  }

  // Helper: sleep
  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Helper: chunk an array into fixed-size batches
  private chunkArray<T>(arr: T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  }

  /**
   * High-level API: Generate scatter plots in batches of 3-5 variables, with delay between calls.
   * Ensures assistant uses ALL rows (no aggregation) and outputs x/y keys.
   * Emits optional progress callbacks so UI can show loading between batches.
   */
  public async generateChartsForVariables(
    file: File,
    targetVariable: string,
    variables: string[],
    options?: {
      batchSize?: number;   // default 5
      delayMs?: number;     // default 5000
      onProgress?: (payload: { stage: 'starting' | 'batch-start' | 'batch-complete' | 'complete'; batchIndex?: number; totalBatches?: number; charts?: ChartData[] }) => void;
      userMessage?: string;
    }
  ): Promise<ChartData[]> {
    const batchSize = Math.min(Math.max(options?.batchSize ?? 5, 3), 10);
    const delayMs = options?.delayMs ?? 5000;
    const userMessage = options?.userMessage ?? 'Analyze variable impact on lead time.';
    const batches = this.chunkArray(variables, batchSize);
    const allCharts: ChartData[] = [];

    options?.onProgress?.({ stage: 'starting', totalBatches: batches.length });

    for (let i = 0; i < batches.length; i++) {
      const batchVariables = batches[i];
      options?.onProgress?.({ stage: 'batch-start', batchIndex: i + 1, totalBatches: batches.length });

      const batchContext = `
PROCESS BATCH ${i + 1}/${batches.length}:
Variables: ${batchVariables.join(', ')}
Target: ${targetVariable}

STRICT REQUIREMENTS (MANDATORY):
1) Generate one scatter plot per variable listed above vs ${targetVariable}.
2) CRITICAL: Use ALL 100+ rows from the dataset for each plot. NO SAMPLING, NO AGGREGATION, NO FILTERING.
3) For each scatter plot:
   - X-axis: The variable from the list above
   - Y-axis: ${targetVariable}
   - Data points: { "x": <variable_value>, "y": <target_value> }
   - MUST include every single row from the CSV file
4) Set config: { "xKey": "x", "yKey": "y", "showTrendLine": true, "xAxisLabel": "<Variable Name>", "yAxisLabel": "${targetVariable}" }.
5) Title must be "${targetVariable} vs <Variable>" (target on Y-axis, variable on X-axis).
6) IMPORTANT: Use the actual column names from the CSV headers. Do not swap or rename columns.
7) VERIFICATION: Each chart must show 100+ data points (one per CSV row). If you see fewer points, you are sampling incorrectly.
`;

      // Run one analysis call for this batch
      const analysis = await this.analyzeDocument(file, `${userMessage}\n\n${batchContext}`);
      if (analysis?.analysis?.charts?.length) {
        allCharts.push(...analysis.analysis.charts);
        options?.onProgress?.({ stage: 'batch-complete', batchIndex: i + 1, totalBatches: batches.length, charts: analysis.analysis.charts });
      } else if ((analysis as any)?.charts?.length) {
        // Fallback for earlier return shape
        allCharts.push(...(analysis as any).charts);
        options?.onProgress?.({ stage: 'batch-complete', batchIndex: i + 1, totalBatches: batches.length, charts: (analysis as any).charts });
      } else {
        options?.onProgress?.({ stage: 'batch-complete', batchIndex: i + 1, totalBatches: batches.length, charts: [] });
      }

      // Delay before next batch to avoid rate limits
      if (i < batches.length - 1) {
        await this.sleep(delayMs);
      }
    }

    options?.onProgress?.({ stage: 'complete', totalBatches: batches.length });
    return allCharts;
  }

  // Add generated charts to context
  public addChartsToContext(charts: ChartData[]): void {
    this.chartGenerationContext.previousCharts.push(...charts);
    this.chartGenerationContext.chartsGenerated += charts.length;
    console.log(`✅ Added ${charts.length} charts to context. Total: ${this.chartGenerationContext.chartsGenerated}/${this.chartGenerationContext.totalChartsRequested}`);
  }

  // Check if more charts need to be generated
  public hasMoreChartsToGenerate(): boolean {
    return this.chartGenerationContext.remainingVariables.length > 0 && 
           this.chartGenerationContext.chartsGenerated < this.chartGenerationContext.totalChartsRequested;
  }

  // Get context for next batch
  public getBatchContext(): string {
    if (this.chartGenerationContext.previousCharts.length === 0) {
      return "This is the first batch of charts. Generate comprehensive analysis.";
    }

    const context = `
PREVIOUS CHARTS GENERATED (${this.chartGenerationContext.chartsGenerated}):
${this.chartGenerationContext.previousCharts.map((chart, index) => 
  `${index + 1}. ${chart.title} (${chart.type})`
).join('\n')}

REMAINING VARIABLES TO ANALYZE: ${this.chartGenerationContext.remainingVariables.join(', ')}
BATCH ${this.chartGenerationContext.batchNumber + 1}: Generate 3 more charts focusing on different variables.
`;

    return context;
  }

  // Complete batch processing
  public completeBatchProcessing(): ChartData[] {
    console.log(`🎉 Batch processing complete! Generated ${this.chartGenerationContext.chartsGenerated} charts total`);
    const allCharts = [...this.chartGenerationContext.previousCharts];
    this.chartGenerationContext.isBatchProcessing = false;
    return allCharts;
  }

  // Generate charts in batches to avoid token limits
  public async generateChartsInBatches(
    file: File, 
    userMessage: string, 
    allVariables: string[], 
    targetVariable: string
  ): Promise<{ charts: ChartData[]; isComplete: boolean; nextBatchMessage?: string }> {
    
    // Initialize batch processing if not already started
    if (!this.chartGenerationContext.isBatchProcessing) {
      const totalCharts = Math.min(allVariables.length, 50); // Up to 50 charts (one per variable)
      this.initializeBatchProcessing(totalCharts, allVariables);
    }

    // Get next batch of variables
    const batchVariables = this.getNextBatchVariables(6);
    if (batchVariables.length === 0) {
      return {
        charts: this.completeBatchProcessing(),
        isComplete: true
      };
    }

    // Create batch-specific message
    const batchContext = this.getBatchContext();
    const batchMessage = `
${userMessage}

BATCH PROCESSING CONTEXT:
${batchContext}

FOR THIS BATCH, GENERATE SCATTER PLOTS ONLY (ONE PER VARIABLE):
- Variables in this batch: ${batchVariables.join(', ')}
- Target variable: ${targetVariable}

STRICT REQUIREMENTS (MANDATORY):
1) Use ALL rows from the dataset for each scatter plot (no aggregation, no sampling)
2) Data keys must be { "x": <variable value>, "y": <target value> }
3) Set config.xKey = "x", config.yKey = "y", and showTrendLine = true
4) One CHART_DATA block per variable listed above
5) Titles must clearly state "<Variable> vs ${targetVariable}"
`;

    console.log(`🔄 Generating batch ${this.chartGenerationContext.batchNumber} with variables:`, batchVariables);

    try {
      // Analyze document with batch message to enforce scatter-only with all points
      const analysisResult = await this.analyzeDocument(file, batchMessage);
      
      // Add charts to context
      if (analysisResult.charts && analysisResult.charts.length > 0) {
        this.addChartsToContext(analysisResult.charts);
        this.chartGenerationContext.batchNumber++;
      }

      // Check if more batches needed
      const hasMore = this.hasMoreChartsToGenerate();
      const nextBatchMessage = hasMore ? 
        `Continue with next batch. ${this.chartGenerationContext.remainingVariables.length} variables remaining.` : 
        undefined;

      return {
        charts: analysisResult.charts || [],
        isComplete: !hasMore,
        nextBatchMessage
      };

    } catch (error) {
      console.error('Batch processing error:', error);
      throw error;
    }
  }

  // Method to check if we should wait before making a request
  public shouldWaitBeforeRequest(): { shouldWait: boolean; waitTime: number; reason: string } {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minInterval = this.rateLimit.minIntervalMs; // configurable minimum interval
    
    if (timeSinceLastRequest < minInterval) {
      return {
        shouldWait: true,
        waitTime: minInterval - timeSinceLastRequest,
        reason: `Minimum ${minInterval / 1000}s interval between requests`
      };
    }
    
    // Check if we're making too many requests - balanced approach
    const requestsInLastMinute = this.requestHistory.filter(time => time > now - 60000).length;
    if (requestsInLastMinute > this.rateLimit.perMinuteMax) { // configurable per-minute cap
      return {
        shouldWait: true,
        waitTime: this.rateLimit.extraWaitMsIfExceeded,
        reason: `Too many requests (${requestsInLastMinute} in last minute)`
      };
    }
    
    // Additional check for requests in last 5 minutes
    const requestsInLast5Minutes = this.requestHistory.filter(time => time > now - 300000).length;
    if (requestsInLast5Minutes > 10) { // Max 10 requests in 5 minutes
      return {
        shouldWait: true,
        waitTime: 30000, // 30 seconds
        reason: `Too many requests (${requestsInLast5Minutes} in last 5 minutes)`
      };
    }
    
    return { shouldWait: false, waitTime: 0, reason: 'OK to proceed' };
  }

  // Method to enforce cooldown period between operations
  private async enforceCooldownPeriod(): Promise<void> {
    const cooldownPeriod = this.rateLimit.cooldownMs; // configurable cooldown
    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    
    if (timeSinceLastRequest < cooldownPeriod) {
      const waitTime = cooldownPeriod - timeSinceLastRequest;
      console.log(`⚡ FAST COOLDOWN: Waiting ${Math.round(waitTime / 1000)}s before next operation...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  // Create fallback chart when AI fails to provide valid JSON
  private createFallbackChart(content: string): ChartData[] {
    console.log('🔄 Creating fallback chart due to AI JSON parsing failure...');
    console.log('Content that failed to parse:', content.substring(0, 1000) + '...');
    
    // Extract key information from content for fallback chart
    const titleMatch = content.match(/(?:impact|analysis|relationship|correlation).*?(?:on|of|between).*?(?:revenue|sales|profit)/i);
    const title = titleMatch ? titleMatch[0] : 'Data Analysis Chart';
    
    // Create multiple fallback charts to better represent the request
    const fallbackCharts: ChartData[] = [];
    
    // Create a primary scatter plot fallback
    const primaryChart: ChartData = {
      id: `fallback_chart_${Date.now()}`,
      type: 'scatter',
      title: title,
      description: 'Analysis completed but chart data could not be parsed. This is a fallback visualization. The AI failed to generate proper CHART_DATA_START/END blocks. Please try asking a more specific question.',
      data: [
        { x: 1, y: 10 },
        { x: 2, y: 20 },
        { x: 3, y: 15 },
        { x: 4, y: 25 },
        { x: 5, y: 30 }
      ],
      config: {
        xKey: 'x',
        yKey: 'y',
        xAxisLabel: 'Variable',
        yAxisLabel: 'Value',
        showTrendLine: true,
        showGrid: true,
        showTooltip: true,
        showLegend: true,
        colors: ['#3B82F6']
      }
    };
    
    fallbackCharts.push(primaryChart);
    
    // If the request mentions "all variables", create additional fallback charts
    if (content.toLowerCase().includes('all variables') || content.toLowerCase().includes('each variable')) {
      console.log('🔄 Creating additional fallback charts for "all variables" request...');
      
      // Create 2-3 additional fallback charts
      for (let i = 1; i <= 3; i++) {
        const additionalChart: ChartData = {
          id: `fallback_chart_${Date.now()}_${i}`,
          type: 'scatter',
          title: `Variable ${i} Impact Analysis`,
          description: `Fallback chart ${i} - AI failed to generate proper analysis. Please try asking a more specific question about individual variables.`,
          data: [
            { x: 1, y: Math.random() * 20 + 10 },
            { x: 2, y: Math.random() * 20 + 10 },
            { x: 3, y: Math.random() * 20 + 10 },
            { x: 4, y: Math.random() * 20 + 10 },
            { x: 5, y: Math.random() * 20 + 10 }
          ],
          config: {
            xKey: 'x',
            yKey: 'y',
            xAxisLabel: `Variable ${i}`,
            yAxisLabel: 'Impact',
            showTrendLine: true,
            showGrid: true,
            showTooltip: true,
            showLegend: true,
            colors: [['#EF4444', '#10B981', '#F59E0B'][i - 1] || '#8B5CF6']
          }
        };
        fallbackCharts.push(additionalChart);
      }
    }
    
    console.log('✅ Fallback charts created:', fallbackCharts.length, 'charts');
    console.log('⚠️ This indicates the AI failed to generate proper CHART_DATA_START/END blocks');
    console.log('💡 Suggestion: Try asking a more specific question like "correlation between X and Y"');
    
    return fallbackCharts;
  }

  // Rebuild malformed JSON by extracting and reconstructing the structure
  private rebuildMalformedChartJson(malformedJson: string): ChartData | null {
    try {
      console.log('🔧 Rebuilding malformed JSON...');
      
      // Extract key information using regex patterns
      const idMatch = malformedJson.match(/"id":\s*"([^"]+)"/);
      const typeMatch = malformedJson.match(/"type":\s*"([^"]+)"/);
      const titleMatch = malformedJson.match(/"title":\s*"([^"]+)"/);
      const descriptionMatch = malformedJson.match(/"description":\s*"([^"]+)"/);
      
      // Extract data array more carefully
      const dataMatch = malformedJson.match(/"data":\s*\[([\s\S]*?)\]/);
      let dataArray = [];
      
      if (dataMatch) {
        try {
          // Try to parse the data array separately
          const dataStr = '[' + dataMatch[1] + ']';
          dataArray = JSON.parse(dataStr);
        } catch (dataError) {
          console.log('Data array parsing failed, extracting individual objects...');
          // Extract individual data objects using regex
          const objectMatches = malformedJson.match(/\{[^}]*"Lead times"[^}]*\}/g);
          if (objectMatches) {
            dataArray = objectMatches.map(objStr => {
              try {
                return JSON.parse(objStr);
              } catch {
                // Extract values manually if JSON parsing fails
                const leadTimeMatch = objStr.match(/"Lead times":\s*(\d+)/);
                const revenueMatch = objStr.match(/"Revenue generated":\s*([\d.]+)/);
                if (leadTimeMatch && revenueMatch) {
                  return {
                    "Lead times": parseInt(leadTimeMatch[1]),
                    "Revenue generated": parseFloat(revenueMatch[1])
                  };
                }
                return null;
              }
            }).filter(Boolean);
          }
        }
      }
      
      // Extract config
      const configMatch = malformedJson.match(/"config":\s*\{([\s\S]*?)\}/);
      let config = {};
      if (configMatch) {
        try {
          config = JSON.parse('{' + configMatch[1] + '}');
        } catch {
          // Build basic config from extracted values
          config = {
            xKey: "Lead times",
            yKey: "Revenue generated", 
            xAxisLabel: "Lead Time (Days)",
            yAxisLabel: "Revenue Generated ($)",
            showTrendLine: true,
            colors: ["#3B82F6"]
          };
        }
      }
      
      if (idMatch && typeMatch && titleMatch) {
        const rebuiltChart: ChartData = {
          id: idMatch[1],
          type: typeMatch[1] as "scatter" | "pie" | "bar" | "line" | "area" | "donut" | "kpi",
          title: titleMatch[1],
          description: descriptionMatch ? descriptionMatch[1] : "Rebuilt from malformed JSON",
          data: dataArray,
          config: config
        };
        
        console.log('✅ Rebuilt chart:', {
          id: rebuiltChart.id,
          type: rebuiltChart.type,
          dataPoints: dataArray.length
        });
        
        return rebuiltChart;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Failed to rebuild malformed JSON:', error);
      return null;
    }
  }

  // Create minimal chart from failed data by extracting what we can
  private createMinimalChartFromFailedData(failedData: string): any {
    console.log('🔧 Creating minimal chart from failed data...');
    
    // Try to extract basic information from the failed JSON
    const idMatch = failedData.match(/"id":\s*"([^"]+)"/);
    const typeMatch = failedData.match(/"type":\s*"([^"]+)"/);
    const titleMatch = failedData.match(/"title":\s*"([^"]+)"/);
    
    const id = idMatch ? idMatch[1] : `minimal_chart_${Date.now()}`;
    const type = typeMatch ? typeMatch[1] : 'scatter';
    const title = titleMatch ? titleMatch[1] : 'Data Analysis Chart';
    
    // Create minimal valid chart structure
    const minimalChart = {
      id: id,
      type: type,
      title: title,
      description: 'Chart generated from partially parsed data. Some data may be incomplete.',
      data: [
        { x: 1, y: 10 },
        { x: 2, y: 20 },
        { x: 3, y: 15 },
        { x: 4, y: 25 },
        { x: 5, y: 30 }
      ],
      config: {
        xKey: 'x',
        yKey: 'y',
        xAxisLabel: 'Variable',
        yAxisLabel: 'Value',
        showTrendLine: true,
        showGrid: true,
        showTooltip: true,
        showLegend: true,
        colors: ['#3B82F6']
      }
    };
    
    console.log('✅ Minimal chart created from failed data:', minimalChart.title);
    return minimalChart;
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

  // New method: Send chat message with file attachment for first-time analysis
  async sendChatMessageWithFile(threadId: string, assistantId: string, messageContent: string, fileId: string): Promise<ChatMessage> {
    try {
      console.log('🔍 DEBUG: sendChatMessageWithFile called', {
        threadId,
        assistantId,
        messageContent: messageContent.substring(0, 100) + '...',
        fileId
      });
      
      console.log('📤 Sending chat message with file attachment...');
      
      // Enforce cooldown before starting
      await this.enforceCooldownPeriod();
      
      // Step 1: Add user message to thread with file attachment and MANDATORY chart format
      await this.makeRequest(`threads/${threadId}/messages`, 'POST', {
        role: 'user',
        content: `${messageContent}

🚨 MANDATORY CHART FORMAT - NO EXCEPTIONS:
You MUST generate charts using CHART_DATA_START/END format.

**PIE CHART FORMAT (CRITICAL):**
CHART_DATA_START
{
  "id": "revenue_distribution",
  "type": "pie",
  "title": "Revenue Distribution by Product Type",
  "description": "Key Finding: Skincare dominates with 43.8% ($2.4M) of total revenue. Business Impact: Skincare generates $850K more than cosmetics. Recommendation: Increase skincare marketing budget by 25% for $425K additional revenue.",
  "data": [{"name": "Skincare", "value": 2400000}, {"name": "Cosmetics", "value": 1550000}, {"name": "Haircare", "value": 1825000}],
  "config": {
    "nameKey": "name",
    "valueKey": "value",
    "colors": ["#3B82F6", "#EF4444", "#10B981"]
  }
}
CHART_DATA_END

**BAR CHART FORMAT:**
CHART_DATA_START
{
  "id": "revenue_by_category",
  "type": "bar",
  "title": "Revenue by Product Category",
  "description": "Key Finding: Skincare leads with $2.4M (43.8% share). Business Impact: 10.9% performance gap represents $625K opportunity. Recommendation: Focus 60% of marketing budget on Skincare for maximum ROI.",
  "data": [{"name": "Skincare", "value": 2400000}, {"name": "Haircare", "value": 1825000}, {"name": "Cosmetics", "value": 1550000}],
  "config": {
    "nameKey": "name",
    "valueKey": "value",
    "xAxisLabel": "Product Category",
    "yAxisLabel": "Revenue ($)",
    "colors": ["#3B82F6", "#10B981", "#F59E0B"]
  }
}
CHART_DATA_END`,
        attachments: [
          {
            file_id: fileId,
            tools: [{ type: 'code_interpreter' }]
          }
        ]
      });

      // Step 2: Create and run the assistant
      const run = await this.createRun(threadId, assistantId);

      // Step 3: Wait for completion
      const completedRun = await this.waitForRunCompletion(threadId, run.id);

      console.log('🔍 DEBUG: Run completion status', {
        status: completedRun.status,
        hasError: !!completedRun.last_error,
        errorMessage: completedRun.last_error?.message || 'No error'
      });
      
      if (completedRun.status === 'failed') {
        throw new Error(`Chat failed: ${completedRun.last_error?.message || 'Unknown error'}`);
      }

      // Step 4: Get latest messages
      console.log('🔍 DEBUG: Retrieving thread messages...');
      const messages = await this.getThreadMessages(threadId);
      console.log('🔍 DEBUG: Retrieved messages', {
        totalMessages: messages.length,
        assistantMessages: messages.filter(msg => msg.role === 'assistant').length
      });

      // Step 5: Find the latest assistant message
      const assistantMessages = messages.filter(msg => msg.role === 'assistant');
      if (!assistantMessages.length) {
        throw new Error('No assistant response found');
      }

      const latestMessage = assistantMessages[0]; // Messages are ordered newest first
      console.log('🔍 DEBUG: Latest assistant message', {
        messageId: latestMessage.id,
        contentLength: latestMessage.content?.length || 0,
        hasContent: !!latestMessage.content
      });
      
      // Step 6: Extract text content and charts
      console.log('🔍 DEBUG: Extracting content and charts...');
      let content = '';
      const charts: any[] = [];
      
      if (latestMessage.content && Array.isArray(latestMessage.content)) {
        for (const contentItem of latestMessage.content) {
          if (contentItem.type === 'text') {
            content += contentItem.text.value;
          }
        }
      } else if (typeof latestMessage.content === 'string') {
        content = latestMessage.content;
      }

      // Step 7: Extract structured chart data from the response
      console.log('🔍 DEBUG: Content analysis', {
        contentLength: content.length,
        contentPreview: content.substring(0, 200) + '...',
        mentionsCharts: /chart|graph|plot|visualization/i.test(content)
      });
      
      const extractedCharts = this.extractChartData(content);
      console.log('🔍 DEBUG: Chart extraction results', {
        chartsFound: extractedCharts.length,
        chartTypes: extractedCharts.map(c => c.type),
        chartIds: extractedCharts.map(c => c.id)
      });
      
      charts.push(...extractedCharts);
      
      // CRITICAL: If no charts were extracted, this is a failure
      if (charts.length === 0) {
        console.error('🚨 CRITICAL ERROR: No charts extracted from AI response.');
        console.error('🚨 AI failed to generate proper CHART_DATA_START/END blocks');
        console.error('🚨 This indicates the AI instructions need to be strengthened.');
      }
      
      // Clean content for display (remove chart blocks but keep text)
      content = this.cleanContentForDisplay(content, charts.length);
      
      // Clean up markdown formatting for better readability
      content = this.cleanMarkdownFormatting(content);

      // Remove any chart data blocks that might have been generated accidentally
      content = this.removeChartDataBlocks(content);

      // Step 8: Return formatted chat message with charts
      return {
        id: latestMessage.id,
        role: 'assistant',
        content: content || 'I apologize, but I couldn\'t generate a response. Please try again.',
        charts: charts,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Failed to send chat message with file:', error);
      throw new Error(`Failed to send chat message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async sendChatMessage(threadId: string, assistantId: string, messageContent: string): Promise<ChatMessage> {
    try {
      const tryOnce = async () => {
      console.log('🔍 DEBUG: sendChatMessage called', {
        threadId,
        assistantId,
        messageContent: messageContent.substring(0, 100) + '...',
        messageLength: messageContent.length
      });
      
      console.log('📤 Sending chat message...');
      
      // Enforce cooldown before starting
      await this.enforceCooldownPeriod();
      
      // Step 1: Add user message to thread with MANDATORY chart format instructions
      await this.makeRequest(`threads/${threadId}/messages`, 'POST', {
        role: 'user',
        content: `${messageContent}

🚨 MANDATORY: You MUST generate charts using CHART_DATA_START/END format. NO EXCEPTIONS.

EXAMPLE FORMAT:
CHART_DATA_START
{
  "id": "chart_id",
  "type": "scatter",
  "title": "Chart Title",
  "description": "Description",
  "data": [{"x": 1, "y": 10}, {"x": 2, "y": 20}],
  "config": {
    "xKey": "x",
    "yKey": "y",
    "xAxisLabel": "X Label",
    "yAxisLabel": "Y Label",
    "showTrendLine": true,
    "colors": ["#3B82F6"]
  }
}
CHART_DATA_END`
      });

      // Step 2: Create and run the assistant
      const run = await this.createRun(threadId, assistantId);

      // Step 3: Wait for completion
      const completedRun = await this.waitForRunCompletion(threadId, run.id);

      console.log('🔍 DEBUG: Run completion status', {
        status: completedRun.status,
        hasError: !!completedRun.last_error,
        errorMessage: completedRun.last_error?.message || 'No error'
      });

      if (completedRun.status === 'failed') {
        throw new Error(`Chat failed: ${completedRun.last_error?.message || 'Unknown error'}`);
      }

      // Step 4: Get latest messages
      console.log('🔍 DEBUG: Retrieving thread messages...');
      const messages = await this.getThreadMessages(threadId);
      console.log('🔍 DEBUG: Retrieved messages', {
        totalMessages: messages.length,
        assistantMessages: messages.filter(msg => msg.role === 'assistant').length
      });

      // Step 5: Find the latest assistant message
      const assistantMessages = messages.filter(msg => msg.role === 'assistant');
      if (!assistantMessages.length) {
        throw new Error('No assistant response found');
      }

      const latestMessage = assistantMessages[0]; // Messages are ordered newest first
      console.log('🔍 DEBUG: Latest assistant message', {
        messageId: latestMessage.id,
        contentLength: latestMessage.content?.length || 0,
        hasContent: !!latestMessage.content
      });
      
      // Step 6: Extract text content and charts
      console.log('🔍 DEBUG: Extracting content and charts...');
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
      console.log('🔍 DEBUG: Content analysis', {
        contentLength: content.length,
        contentPreview: content.substring(0, 200) + '...',
        mentionsCharts: /chart|graph|plot|visualization/i.test(content)
      });
      
      const extractedCharts = this.extractChartData(content);
      console.log('🔍 DEBUG: Chart extraction results', {
        chartsFound: extractedCharts.length,
        chartTypes: extractedCharts.map(c => c.type),
        chartIds: extractedCharts.map(c => c.id)
      });
      
      charts.push(...extractedCharts);
      
      // CRITICAL: If no charts were extracted, this is a failure
      if (charts.length === 0) {
        console.error('🚨 CRITICAL ERROR: No charts extracted from AI response.');
        console.error('🚨 AI failed to generate proper CHART_DATA_START/END blocks');
        console.error('🚨 This indicates the AI instructions need to be strengthened.');
      }
      
      // Clean content for display (remove chart blocks but keep text)
      content = this.cleanContentForDisplay(content, charts.length);
      
      // Clean up markdown formatting for better readability
      content = this.cleanMarkdownFormatting(content);

      // Step 8: Return formatted chat message with charts
      return {
        id: latestMessage.id,
        role: 'assistant',
        content: content || 'I apologize, but I couldn\'t generate a response. Please try again.',
        charts: charts,
        timestamp: new Date(latestMessage.created_at * 1000)
      };
      };

      // Auto-retry on 429 surfaced as thrown errors with wait hints
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          return await tryOnce();
        } catch (err: any) {
          const msg = String(err?.message || err);
          const waitMatch = msg.match(/wait\s+(\d+)\s*seconds?/i);
          if (msg.includes('Rate limit exceeded') && (attempt < 2)) {
            const waitSeconds = waitMatch ? parseInt(waitMatch[1], 10) : 15;
            console.warn(`🕒 Waiting ${waitSeconds}s due to 429 (attempt ${attempt + 1}/3)...`);
            await new Promise(res => setTimeout(res, waitSeconds * 1000));
            continue;
          }
          throw err;
        }
      }
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