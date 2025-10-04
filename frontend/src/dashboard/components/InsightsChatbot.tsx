import React, { useState, useRef, useEffect } from 'react';
import { Document } from '../App';
import { AzureOpenAIService } from '../lib/azure-openai';
import { FileParser } from '../lib/file-parser';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Loader, 
  AlertCircle,
  Lightbulb,
  Brain,
  FileSpreadsheet,
  Plus,
  FileText,
} from 'lucide-react';

interface InsightsChatbotProps {
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
  onFirstUserMessage?: (message: string) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const InsightsChatbot: React.FC<InsightsChatbotProps> = ({
  azureConfig,
  selectedDocument,
  documents,
  onSelectDocument,
  onDocumentUpload,
  onDocumentUpdate,
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

  const availableDocuments = documents.filter(doc => 
    doc.status === 'ready' || doc.status === 'analyzing' || doc.status === 'completed'
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      // Only set welcome message if messages array is empty or only has old welcome messages
      setMessages(prev => {
        const hasWelcomeMessage = prev.some(msg => msg.id === 'welcome' || msg.id === 'welcome-ready');
        const hasColumnMessage = prev.some(msg => 
          msg.id === 'welcome-ready' && msg.content.includes('I can see you\'ve selected') && msg.content.includes('columns')
        );
        
        // If there's a column message, preserve it and don't replace it
        if (hasColumnMessage) {
          return prev;
        }
        
        if (hasWelcomeMessage && prev.length === 1) {
          return [{
            id: 'welcome',
            role: 'assistant',
            content: `Hello! I'm your business insights consultant. I've analyzed your document "${selectedDocument.name}" and I'm ready to provide detailed strategic recommendations and actionable insights.

Here are some strategic questions you can ask me:
• What are the key business opportunities in this data?
• How can we improve our competitive positioning?
• What strategic recommendations do you have?
• What market trends should we be aware of?
• How can we optimize our business performance?

I focus on providing detailed business insights and strategic advice without generating charts or visualizations.`,
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
            content: `Hello! I can see you've selected "${selectedDocument.name}"${columnInfo.columns.length > 0 ? ` with ${columnInfo.columns.length} columns` : ''}. I'm ready to provide detailed business insights and strategic recommendations based on your data.

**Column Names:**
${columnInfo.columns.length > 0 ? columnInfo.columns.map((col, index) => `${index + 1}. ${col}`).join('\n') : 'No columns detected'}

You can ask me questions about any of these columns or request strategic analysis of your data.`,
            timestamp: new Date()
          }];
        }
        return prev;
      });
    } else {
      // Don't clear messages when switching documents if they have conversation history
      if (!selectedDocument) {
        setMessages([]);
      }
    }
  }, [selectedDocument?.id, selectedDocument?.status, selectedDocument?.assistantId, columnInfo.columns.length]);

  // Update welcome message when column info changes
  useEffect(() => {
    if (selectedDocument && !selectedDocument.assistantId && columnInfo.columns.length > 0) {
      setMessages(prev => {
        if (prev.length === 1 && prev[0].id === 'welcome-ready') {
          return [{
            ...prev[0],
            content: `Hello! I can see you've selected "${selectedDocument.name}" with ${columnInfo.columns.length} columns. I'm ready to provide detailed business insights and strategic recommendations based on your data.

**Column Names:**
${columnInfo.columns.map((col, index) => `${index + 1}. ${col}`).join('\n')}

You can ask me questions about any of these columns or request strategic analysis of your data.`,
          }];
        }
        return prev;
      });
    }
  }, [columnInfo.columns.length, selectedDocument?.name, selectedDocument?.assistantId]);

  // Load column names when document is selected
  useEffect(() => {
    const loadColumnInfo = async () => {
      if (selectedDocument && selectedDocument.file && !selectedDocument.assistantId) {
        setColumnInfo(prev => ({ ...prev, isLoading: true, columns: [] }));
        
        try {
          const result = await FileParser.extractColumns(selectedDocument.file);
          console.log('Column parsing result:', result);
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
      } else {
        setColumnInfo({
          columns: [],
          isLoading: false,
          fileType: 'unknown'
        });
      }
    };

    loadColumnInfo();
  }, [selectedDocument]);

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

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    
    // Capture first user message
    if (onFirstUserMessage && messages.length === 0) {
      onFirstUserMessage(userMessageContent);
    }
    
    setIsLoading(true);
    setError(null);
    try {
      if (!selectedDocument?.assistantId || !selectedDocument?.threadId) {
        // If document hasn't been analyzed yet, analyze it first
        setIsAnalyzing(true);
        
        // Update document status to analyzing
        const analyzingDoc = { ...selectedDocument!, status: 'analyzing' as const };
        onDocumentUpdate(analyzingDoc);
        
        const azureService = new AzureOpenAIService(azureConfig);
        
        // Create insights bot session and send first message with file
        const assistantResponse = await azureService.createInsightsBotSessionWithFile(
          selectedDocument!.file!,
          userMessageContent
        );
        
        // Update the document with session info (no analysis since this is insights bot)
        const completedDoc = {
          ...selectedDocument!,
          assistantId: assistantResponse.assistantId,
          threadId: assistantResponse.threadId,
          analysis: {
            summary: 'Insights bot session created - ready for strategic analysis',
            insights: [],
            charts: [],
            metadata: {}
          },
          status: 'completed' as const
        };
        onDocumentUpdate(completedDoc);
        setIsAnalyzing(false);
        
        // Preserve the initial column analysis message if it exists
        setMessages(prev => {
          // Find the column analysis message (usually the first assistant message with welcome-ready ID)
          const columnAnalysisMessage = prev.find(msg => 
            (msg.id === 'welcome-ready' || msg.id === 'welcome') ||
            (msg.role === 'assistant' && (
              msg.content.includes('I can see you\'ve selected') ||
              msg.content.includes('with') && msg.content.includes('columns') ||
              msg.content.includes('COLUMNS:') || 
              msg.content.includes('columns:') ||
              msg.content.includes('Column names:') ||
              msg.content.includes('Here are the columns')
            ))
          );
          
          if (columnAnalysisMessage) {
            // Keep the column analysis message and add the new response
            return [...prev, assistantResponse.message];
          } else {
            // No column analysis to preserve, just add the new response
            return [...prev, assistantResponse.message];
          }
        });
      } else {
        // Document already analyzed, send message directly using insights method
        const azureService = new AzureOpenAIService(azureConfig);
        
        const assistantResponse = await azureService.sendInsightsChatMessage(
          selectedDocument!.threadId,
          selectedDocument!.assistantId,
          userMessageContent
        );

        setMessages(prev => [...prev, assistantResponse]);
      }
    } catch (error) {
      console.error('Insights chat error:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
      
      // If analysis failed, update document status back to ready
      if (selectedDocument && !selectedDocument.assistantId) {
        const errorDoc = { ...selectedDocument!, status: 'ready' as const };
        onDocumentUpdate(errorDoc);
        setIsAnalyzing(false);
      }
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your message. Please try again or check your connection settings.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
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
    "What strategic opportunities do you see in this data?",
    "How can we improve our competitive positioning?",
    "What are the key business risks we should address?",
    "What market trends should influence our strategy?",
    "How can we optimize our business performance?"
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* FIXED HEADER */}
      <div className="p-4 border-b border-gray-100 flex-shrink-0 bg-white">
        {/* Document Selection */}
        {availableDocuments.length > 0 && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Document
            </label>
            <select
              value={selectedDocument?.id || ''}
              onChange={(e) => {
                const doc = documents.find(d => d.id === e.target.value);
                if (doc) onSelectDocument(doc);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
            >
              <option value="">Select a document...</option>
              {availableDocuments.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name} ({doc.status})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* SCROLLABLE MESSAGES */}
      <div className="flex-1 overflow-y-auto">
        {selectedDocument ? (
          <div className="p-4 space-y-4">
            {/* Messages */}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Brain className="w-4 h-4 text-purple-600" />
                  </div>
                )}
                
                <div
                  className={`max-w-3xl rounded-lg p-4 ${
                    message.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                  
                  <div className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-purple-100' : 'text-gray-500'
                  }`}>
                    {formatTimestamp(message.timestamp)}
                  </div>
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                )}
              </div>
            ))}

            {/* Column Information Display */}
            {selectedDocument && columnInfo.columns.length > 0 && 
             !isLoading && !isAnalyzing && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-2 mb-3">
                  <FileSpreadsheet className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">
                    Data Structure ({columnInfo.columns.length} columns)
                  </span>
                  {columnInfo.rowCount && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                      {columnInfo.rowCount} rows
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {columnInfo.columns.map((column, index) => (
                    <div
                      key={index}
                      className="bg-white px-2 py-1 rounded text-xs font-mono text-gray-700 border border-purple-200 whitespace-nowrap"
                    >
                      {column}
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-xs text-purple-600">
                  💡 Ask me for strategic insights about your data!
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Brain className="w-4 h-4 text-purple-600" />
                </div>
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }}></div>
                      <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '1s' }}></div>
                      <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '1s' }}></div>
                    </div>
                    <span className="text-gray-700 text-sm font-medium">
                      {isAnalyzing ? 'Analyzing your document...' : 'Crafting strategic insights...'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {isAnalyzing && !isLoading && (
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Brain className="w-4 h-4 text-purple-600" />
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Loader className="w-4 h-4 animate-spin text-purple-600" />
                    <span className="text-purple-700 font-medium">Analyzing document for strategic insights...</span>
                  </div>
                  <p className="text-xs text-purple-600 mt-1">
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
                  Strategic Questions
                </h4>
                <div className="flex flex-wrap gap-2">
                  {suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => setInputMessage(question)}
                      className="text-xs bg-purple-50 text-purple-700 px-3 py-2 rounded-full hover:bg-purple-100 transition-colors duration-200"
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
                <Brain className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Ready for Strategic Analysis</h3>
              <p className="text-xs text-gray-600 mb-4">Upload a document to get detailed business insights</p>
              <label className="cursor-pointer">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="sr-only"
                  accept=".pdf,.csv,.xlsx,.xls,.txt,.docx"
                  onChange={handleFileInputChange}
                />
                <div className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 inline-flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Upload Document</span>
                </div>
              </label>
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
                placeholder="Ask me about business insights..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                rows={2}
                disabled={isLoading || !selectedDocument}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading || !selectedDocument}
              className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Send</span>
            </button>
          </div>
          
          <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
            <span>Press Enter to send, Shift+Enter for new line</span>
            <div className="flex items-center space-x-1">
              <Brain className="w-3 h-3" />
              <span>Business Insights</span>
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