import React, { useState, useRef, useEffect } from 'react';
import { Document } from '../App';
import { AzureOpenAIService } from '../lib/azure-openai';
import { FileParser } from '../lib/file-parser';
import { AnalysisResult } from '../types/chart';
import { 
  Send, 
  Bot, 
  User, 
  Loader, 
  AlertCircle,
  TrendingUp,
  BarChart3,
  Lightbulb,
  FileSpreadsheet,
  Plus
} from 'lucide-react';
import ThinkingDisplay from './ThinkingDisplay';
import { useThinking } from '../hooks/useThinking';
import { AzureStreamingConfig } from '../types/thinking';

interface ChartingChatbotWithThinkingProps {
  azureConfig: {
    apiKey: string;
    endpoint: string;
    deploymentName: string;
  };
  selectedDocument: Document | null;
  documents: Document[];
  onSelectDocument: (doc: Document) => void;
  onDocumentUpload: (file: File) => void;
  onDocumentUpdate: (doc: Document) => void;
  onNewAnalysis: (question: string, analysis: AnalysisResult) => void;
  onFirstUserMessage?: (message: string) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  charts?: import('../types/chart').ChartData[];
  timestamp: Date;
  isThinking?: boolean; // Flag to indicate this is a thinking message
  thinkingComplete?: boolean; // Flag to indicate thinking is complete
}

export const ChartingChatbotWithThinking: React.FC<ChartingChatbotWithThinkingProps> = ({
  azureConfig,
  selectedDocument,
  documents,
  onSelectDocument,
  onDocumentUpload,
  onDocumentUpdate,
  onNewAnalysis,
  onFirstUserMessage
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [columnInfo, setColumnInfo] = useState<{
    columns: string[];
    rowCount?: number;
    fileType: string;
    isLoading: boolean;
  }>({
    columns: [],
    isLoading: false,
    fileType: 'unknown'
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize thinking hook
  const {
    thinkingState,
    toggleExpanded,
    clearThinking,
    createThinkingCompletion,
    addThinkingStep
  } = useThinking({
    apiKey: azureConfig.apiKey,
    endpoint: azureConfig.endpoint,
    deploymentName: azureConfig.deploymentName,
    model: 'gpt-4o-mini'
  });

  const availableDocuments = documents.filter(doc => 
    doc.status === 'ready' || doc.status === 'analyzing' || doc.status === 'completed'
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, thinkingState]);

  const handleFileUpload = (file: File) => {
    onDocumentUpload(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  // Initialize with welcome message when document is selected and analyzed
  useEffect(() => {
    if (selectedDocument && selectedDocument.status === 'completed' && selectedDocument.assistantId && selectedDocument.threadId) {
      setMessages(prev => {
        const hasWelcomeMessage = prev.some(msg => msg.id === 'welcome' || msg.id === 'welcome-ready');
        const hasColumnMessage = prev.some(msg => 
          msg.id === 'welcome-ready' && msg.content.includes('I can see you\'ve selected') && msg.content.includes('columns')
        );
        
        if (hasColumnMessage) {
          return prev;
        }
        
        if (hasWelcomeMessage && prev.length === 1) {
          return [{
            id: 'welcome',
            role: 'assistant',
            content: `Hello! I'm your FMCG business insights consultant. I've analyzed your document "${selectedDocument.name}" and I'm ready to help you discover actionable insights.

Here are some questions you can ask me:
• What are the key trends in this data?
• How is our product performing compared to competitors?
• What opportunities do you see for growth?
• Can you analyze the seasonal patterns?
• What recommendations do you have for improving sales?

Feel free to ask me anything about your data!`,
            timestamp: new Date()
          }];
        }
        return prev;
      });
    } else if (selectedDocument && !selectedDocument.assistantId) {
      setMessages(prev => {
        const hasWelcomeMessage = prev.some(msg => msg.id === 'welcome' || msg.id === 'welcome-ready');
        if (!hasWelcomeMessage || prev.length === 0) {
          return [{
            id: 'welcome-ready',
            role: 'assistant',
            content: `Hello! I can see you've selected "${selectedDocument.name}"${columnInfo.columns.length > 0 ? ` with ${columnInfo.columns.length} columns` : ''}. I'm ready to help you analyze your data and discover insights.

**Column Names:**
${columnInfo.columns.length > 0 ? columnInfo.columns.map((col, index) => `${index + 1}. ${col}`).join('\n') : 'No columns detected'}

You can ask me questions about any of these columns or request analysis of your data.`,
            timestamp: new Date()
          }];
        }
        return prev;
      });
    } else {
      if (!selectedDocument) {
        setMessages([]);
      }
    }
  }, [selectedDocument?.id, selectedDocument?.status, selectedDocument?.assistantId, columnInfo.columns.length]);

  // Load column names when document is selected
  useEffect(() => {
    const loadColumnInfo = async () => {
      if (selectedDocument && selectedDocument.file) {
        // Only load if we don't already have column info
        if (columnInfo.columns.length === 0) {
          setColumnInfo(prev => ({ ...prev, isLoading: true, columns: [] }));
          
          try {
            const result = await FileParser.extractColumns(selectedDocument.file);
            setColumnInfo({
              columns: result.columns,
              rowCount: result.rowCount,
              fileType: result.fileType,
              isLoading: false
            });
          } catch (error) {
            console.error('Failed to parse file:', error);
            setColumnInfo({
              columns: [],
              isLoading: false,
              fileType: 'unknown'
            });
          }
        }
      } else if (!selectedDocument) {
        // Only clear if no document is selected
        setColumnInfo({
          columns: [],
          isLoading: false,
          fileType: 'unknown'
        });
      }
    };

    loadColumnInfo();
  }, [selectedDocument, columnInfo.columns.length]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedDocument) {
      return;
    }

    const userMessageContent = inputMessage.trim();
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userMessageContent,
      timestamp: new Date()
    };

    // Capture first user message before adding to messages
    if (onFirstUserMessage && messages.length === 0) {
      onFirstUserMessage(userMessageContent);
    }
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    
    // Add thinking message immediately after user message
    const thinkingMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: 'Thinking...',
      timestamp: new Date(),
      isThinking: true,
      thinkingComplete: false
    };
    
    setMessages(prev => [...prev, thinkingMessage]);
    setIsLoading(true);
    setError(null);

    try {
      if (!selectedDocument?.assistantId || !selectedDocument?.threadId) {
        // If document hasn't been analyzed yet, analyze it first
        setIsAnalyzing(true);
        
        // Add thinking step for document analysis
        addThinkingStep({
          type: 'reasoning',
          content: 'Analyzing your document to understand the data structure...',
          status: 'active',
          metadata: { confidence: 0.9 }
        });
        
        const analyzingDoc = { ...selectedDocument!, status: 'analyzing' as const };
        onDocumentUpdate(analyzingDoc);
        
        const azureService = new AzureOpenAIService(azureConfig);
        
        const { analysis, assistantId, threadId } = await azureService.analyzeDocument(selectedDocument!.file!);
        
        // Update thinking step
        addThinkingStep({
          type: 'analysis',
          content: 'Document analysis complete. Now processing your question...',
          status: 'completed',
          metadata: { confidence: 0.95 }
        });
        
        const completedDoc = {
          ...selectedDocument!,
          assistantId,
          threadId,
          analysis,
          status: 'completed' as const
        };
        onDocumentUpdate(completedDoc);
        setIsAnalyzing(false);
        
        // Now send the chat message to Azure while showing thinking progress
        // Step 1: Reasoning
        addThinkingStep({
          type: 'reasoning',
          content: 'Let me understand what you\'re asking and what insights you need...',
          status: 'active',
          metadata: { confidence: 0.9 }
        });
        await new Promise(resolve => setTimeout(resolve, 600));
        addThinkingStep({
          type: 'reasoning',
          content: 'Let me understand what you\'re asking and what insights you need...',
          status: 'completed',
          metadata: { confidence: 0.9, duration: 600 }
        });
        
        // Step 2: Analysis
        addThinkingStep({
          type: 'analysis',
          content: 'Analyzing your data structure and identifying relevant patterns...',
          status: 'active',
          metadata: { confidence: 0.85 }
        });
        
        const azureServiceAfterAnalysis = new AzureOpenAIService(azureConfig);
        const assistantResponseAzure = await azureServiceAfterAnalysis.sendChatMessage(
          threadId,
          assistantId,
          userMessageContent
        );
        
        addThinkingStep({
          type: 'analysis',
          content: 'Analysis complete. Preparing response...',
          status: 'completed',
          metadata: { confidence: 0.9 }
        });
        
        // Step 3: Synthesis
        addThinkingStep({
          type: 'synthesis',
          content: 'Synthesizing findings and generating comprehensive insights...',
          status: 'completed',
          metadata: { confidence: 0.95 }
        });
        
        // Mark thinking as complete and add the actual Azure response
        setMessages(prev => {
          const updatedMessages = prev.map(msg => 
            msg.isThinking && !msg.thinkingComplete ? {
              ...msg,
              thinkingComplete: true
            } : msg
          );
          
          const assistantResponse: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: assistantResponseAzure.content,
            charts: assistantResponseAzure.charts,
            timestamp: new Date(),
            isThinking: false,
            thinkingComplete: false
          };
          
          return [...updatedMessages, assistantResponse];
        });
        
        // If the response contains charts, create a new analysis result
        if (assistantResponseAzure.charts && assistantResponseAzure.charts.length > 0) {
          const newAnalysis: AnalysisResult = {
            summary: assistantResponseAzure.content,
            insights: [],
            charts: assistantResponseAzure.charts,
            metadata: {
              questionAsked: userMessageContent,
              responseTime: new Date().toISOString(),
              chartCount: assistantResponseAzure.charts.length
            }
          };
          onNewAnalysis(userMessageContent, newAnalysis);
        }
      } else {
        // Document already analyzed, send message to Azure while displaying thinking
        // Step 1: Reasoning
        addThinkingStep({
          type: 'reasoning',
          content: 'Processing your question and understanding the context...',
          status: 'active',
          metadata: { confidence: 0.9 }
        });
        await new Promise(resolve => setTimeout(resolve, 500));
        addThinkingStep({
          type: 'reasoning',
          content: 'Processing your question and understanding the context...',
          status: 'completed',
          metadata: { confidence: 0.9 }
        });
        
        // Step 2: Analysis
        addThinkingStep({
          type: 'analysis',
          content: 'Analyzing data relationships and extracting relevant insights...',
          status: 'active',
          metadata: { confidence: 0.88 }
        });
        
        const azureServiceExisting = new AzureOpenAIService(azureConfig);
        const assistantResponseAzure2 = await azureServiceExisting.sendChatMessage(
          selectedDocument!.threadId!,
          selectedDocument!.assistantId!,
          userMessageContent
        );
        
        addThinkingStep({
          type: 'analysis',
          content: 'Analysis complete. Preparing response...',
          status: 'completed',
          metadata: { confidence: 0.9 }
        });
        
        // Step 3: Synthesis
        addThinkingStep({
          type: 'synthesis',
          content: 'Synthesizing insights and preparing comprehensive response...',
          status: 'completed',
          metadata: { confidence: 0.92 }
        });
        
        // Mark thinking as complete and add the Azure response
        setMessages(prev => {
          const updatedMessages = prev.map(msg => 
            msg.isThinking && !msg.thinkingComplete ? {
              ...msg,
              thinkingComplete: true
            } : msg
          );
          
          const assistantResponse: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: assistantResponseAzure2.content,
            charts: assistantResponseAzure2.charts,
            timestamp: new Date(),
            isThinking: false,
            thinkingComplete: false
          };
          
          return [...updatedMessages, assistantResponse];
        });
        
        // If the response contains charts, create a new analysis result
        if (assistantResponseAzure2.charts && assistantResponseAzure2.charts.length > 0) {
          const newAnalysis: AnalysisResult = {
            summary: assistantResponseAzure2.content,
            insights: [],
            charts: assistantResponseAzure2.charts,
            metadata: {
              questionAsked: userMessageContent,
              responseTime: new Date().toISOString(),
              chartCount: assistantResponseAzure2.charts.length
            }
          };
          onNewAnalysis(userMessageContent, newAnalysis);
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
      
      if (selectedDocument && !selectedDocument.assistantId) {
        const errorDoc = { ...selectedDocument!, status: 'ready' as const };
        onDocumentUpdate(errorDoc);
        setIsAnalyzing(false);
      }
      
      // Mark thinking as complete and add error message
      setMessages(prev => {
        const updatedMessages = prev.map(msg => 
          msg.isThinking && !msg.thinkingComplete ? {
            ...msg,
            thinkingComplete: true
          } : msg
        );
        
        // Add error message as a new message
        const errorMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'I apologize, but I encountered an error processing your message. Please try again or check your connection settings.',
          timestamp: new Date(),
          isThinking: false,
          thinkingComplete: false
        };
        
        return [...updatedMessages, errorMessage];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const suggestedQuestions = [
    "What are the key performance indicators in this data?",
    "Can you identify any seasonal trends or patterns?",
    "What recommendations do you have for improving sales?",
    "How does our product performance compare to benchmarks?",
    "What opportunities do you see for market expansion?"
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* FIXED HEADER */}
      <div className="p-4 border-b border-gray-100 flex-shrink-0 bg-white">
      </div>

      {/* SCROLLABLE MESSAGES */}
      <div className="flex-1 overflow-y-auto">
        {selectedDocument ? (
          <div className="p-4 space-y-4">
            {/* Column Information Display - Always visible when data is available */}
            {selectedDocument && columnInfo.columns.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-2 mb-3">
                  <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    Data Structure ({columnInfo.columns.length} columns)
                  </span>
                  {columnInfo.rowCount && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      {columnInfo.rowCount} rows
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {columnInfo.columns.map((column, index) => (
                    <div
                      key={index}
                      className="bg-white px-2 py-1 rounded text-xs font-mono text-gray-700 border border-blue-200 whitespace-nowrap"
                    >
                      {column}
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-xs text-blue-600">
                  💡 Ask me about specific columns or relationships in your data!
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-blue-600" />
                  </div>
                )}
                
                <div
                  className={`rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white p-4 max-w-3xl'
                      : message.isThinking
                      ? 'bg-white border border-gray-200 p-0 w-full'
                      : 'bg-gray-100 text-gray-900 p-4 max-w-3xl'
                  }`}
                >
                  {message.isThinking ? (
                    /* Show thinking display for thinking messages */
                    <div className="thinking-message-container">
                      <ThinkingDisplay
                        thinkingState={thinkingState}
                        onToggleExpanded={toggleExpanded}
                        className="thinking-container"
                      />
                      {message.thinkingComplete && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                          ✅ Analysis complete - see response below
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                      
                      {/* Display chart notifications if available */}
                      {message.charts && message.charts.length > 0 && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center space-x-2 text-blue-700">
                            <BarChart3 className="w-4 h-4" />
                            <span className="text-xs font-medium">
                              {message.charts.length} chart{message.charts.length !== 1 ? 's' : ''} generated
                            </span>
                          </div>
                          <p className="text-xs text-blue-600 mt-1">
                            Check the dashboard view to see your interactive visualizations
                          </p>
                        </div>
                      )}
                      
                      <div className={`text-xs mt-2 ${
                        message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {formatTimestamp(message.timestamp)}
                      </div>
                    </>
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                )}
              </div>
            ))}

            {/* Loading State */}
            {isLoading && !thinkingState.isThinking && (
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-blue-600" />
                </div>
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }}></div>
                      <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '1s' }}></div>
                      <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '1s' }}></div>
                    </div>
                    <span className="text-gray-700 text-sm font-medium">
                      {isAnalyzing ? 'Analyzing your data...' : 'Generating insights...'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Analyzing State */}
            {isAnalyzing && !isLoading && (
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-blue-600" />
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Loader className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="text-blue-700 font-medium">Analyzing document...</span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    This may take up to 60 seconds. Your question will be processed once analysis is complete.
                  </p>
                </div>
              </div>
            )}

            {/* Suggested Questions */}
            {selectedDocument && selectedDocument?.assistantId && (
              <div className="py-3">
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <Lightbulb className="w-4 h-4 mr-2 text-yellow-500" />
                  Suggested Questions
                </h4>
                <div className="flex flex-wrap gap-2">
                  {suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => setInputMessage(question)}
                      className="text-xs bg-blue-50 text-blue-700 px-3 py-2 rounded-full hover:bg-blue-100 transition-colors duration-200"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Ready to Analyze</h3>
              <p className="text-xs text-gray-600">Upload a document using the + button to start</p>
            </div>
          </div>
        )}
      </div>

      {/* FIXED INPUT */}
      {selectedDocument && (
        <div className="border-t border-gray-200 bg-white p-4 flex-shrink-0">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}
          
          <div className="flex items-end space-x-3">
            <div className="flex-1">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about your document..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={2}
                disabled={isLoading || !selectedDocument}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading || !selectedDocument}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Send</span>
            </button>
          </div>
          
          <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
            <span>Press Enter to send, Shift+Enter for new line</span>
            <div className="flex items-center space-x-4">
              <button
                onClick={clearThinking}
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                Clear Thinking
              </button>
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-3 h-3" />
                <span>AI Insights</span>
              </div>
              <div className="flex items-center space-x-1">
                <BarChart3 className="w-3 h-3" />
                <span>Data Analysis</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="sr-only"
        accept=".pdf,.csv,.xlsx,.xls,.txt,.docx"
        onChange={handleFileInputChange}
      />
    </div>
  );
};

