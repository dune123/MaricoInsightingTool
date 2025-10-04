import React, { useState } from 'react';
import { MessageSquare, Plus, BarChart3, Target, TrendingUp } from 'lucide-react';
import ChatHistoryButton from './ChatHistoryButton';
import { useChatHistory, ChatHistory } from '../hooks/useChatHistory';

export const ChatHistoryDemo: React.FC = () => {
  const { addChat } = useChatHistory();
  const [selectedChat, setSelectedChat] = useState<ChatHistory | null>(null);

  // Create sample chat data
  const createSampleChats = () => {
    const sampleChats = [
      {
        title: "Sales Analysis Q4 2024",
        summary: "Analyzed quarterly sales performance with focus on holiday season trends and regional variations.",
        type: 'analysis' as const,
        messageCount: 12,
        lastMessage: "The data shows a 15% increase in sales compared to Q3",
        charts: 3,
        documents: ['sales_data.xlsx', 'marketing_campaigns.pdf']
      },
      {
        title: "Revenue Dashboard Creation",
        summary: "Created interactive dashboard with revenue metrics, customer segmentation, and growth trends.",
        type: 'charting' as const,
        messageCount: 8,
        lastMessage: "Added the revenue trend chart to the dashboard",
        charts: 5
      },
      {
        title: "Customer Insights Report",
        summary: "Generated comprehensive customer behavior insights with recommendations for retention strategies.",
        type: 'insights' as const,
        messageCount: 15,
        lastMessage: "Recommendation: Focus on high-value customer segments",
        charts: 2,
        documents: ['customer_data.csv']
      },
      {
        title: "General Data Discussion",
        summary: "General conversation about data analysis techniques and best practices.",
        type: 'general' as const,
        messageCount: 6,
        lastMessage: "What's the best way to handle missing data?"
      }
    ];

    sampleChats.forEach(chat => {
      addChat(chat);
    });
  };

  const handleSelectChat = (chat: ChatHistory) => {
    setSelectedChat(chat);
    console.log('Selected chat:', chat);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Chat History Layout Demo</h1>
        <p className="text-gray-600">
          This demonstrates the card-based layout for displaying previous chats, similar to the recommendation card design you showed.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chat History Button */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Chat History Button</h2>
          <div className="space-y-4">
            <ChatHistoryButton
              onSelectChat={handleSelectChat}
              variant="button"
              className="w-full"
            />
            
            <button
              onClick={createSampleChats}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Sample Chats</span>
            </button>
          </div>
        </div>

        {/* Selected Chat Display */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Selected Chat</h2>
          {selectedChat ? (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  {selectedChat.type === 'analysis' && <BarChart3 className="w-4 h-4 text-blue-600" />}
                  {selectedChat.type === 'charting' && <TrendingUp className="w-4 h-4 text-green-600" />}
                  {selectedChat.type === 'insights' && <Target className="w-4 h-4 text-purple-600" />}
                  {selectedChat.type === 'general' && <MessageSquare className="w-4 h-4 text-gray-600" />}
                </div>
                
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{selectedChat.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{selectedChat.summary}</p>
                  
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span>{selectedChat.messageCount} messages</span>
                    {selectedChat.charts && (
                      <span>{selectedChat.charts} charts</span>
                    )}
                    {selectedChat.documents && (
                      <span>{selectedChat.documents.length} documents</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Select a chat to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Features List */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Features Implemented</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div className="space-y-2">
            <h4 className="font-medium">Card Layout Design</h4>
            <ul className="space-y-1 text-blue-700">
              <li>• Clean card design with rounded corners</li>
              <li>• Color-coded by chat type</li>
              <li>• Icon indicators for different chat types</li>
              <li>• Hover effects and transitions</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">Functionality</h4>
            <ul className="space-y-1 text-blue-700">
              <li>• Search and filter conversations</li>
              <li>• Persistent storage with localStorage</li>
              <li>• Chat type categorization</li>
              <li>• Message count and timestamps</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatHistoryDemo;
