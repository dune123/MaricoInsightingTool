import React, { useState } from 'react';
import { Send, Bot, User } from 'lucide-react';
import ThinkingDisplay from './ThinkingDisplay';
import { useThinking } from '../hooks/useThinking';
import { AzureStreamingConfig } from '../types/thinking';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ThinkingChatExampleProps {
  azureConfig: AzureStreamingConfig;
}

const ThinkingChatExample: React.FC<ThinkingChatExampleProps> = ({ azureConfig }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    thinkingState,
    toggleExpanded,
    clearThinking,
    createThinkingCompletion
  } = useThinking(azureConfig);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Create thinking completion
      const result = await createThinkingCompletion([
        { role: 'user', content: userMessage.content }
      ]);

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: result.content,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request.',
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

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <h2 className="text-lg font-semibold text-gray-900">AI Chat with Thinking Display</h2>
        <p className="text-sm text-gray-600">See what the AI is thinking in real-time</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
              className={`max-w-3xl rounded-lg p-4 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="whitespace-pre-wrap text-sm">{message.content}</div>
              <div className={`text-xs mt-2 ${
                message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>

            {message.role === 'user' && (
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
            )}
          </div>
        ))}

        {/* Thinking Display */}
        {(thinkingState.isThinking || thinkingState.steps.length > 0) && (
          <div className="thinking-fade-in">
            <ThinkingDisplay
              thinkingState={thinkingState}
              onToggleExpanded={toggleExpanded}
              className="thinking-container"
            />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={2}
              disabled={isLoading}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
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
              <Bot className="w-3 h-3" />
              <span>AI Assistant</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThinkingChatExample;
