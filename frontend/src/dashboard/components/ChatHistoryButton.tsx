import React, { useState } from 'react';
import { MessageSquare, Clock, ChevronDown } from 'lucide-react';
import { useChatHistory, ChatHistory } from '../hooks/useChatHistory';
import ChatHistorySidebar from './ChatHistorySidebar';

interface ChatHistoryButtonProps {
  onSelectChat: (chat: ChatHistory) => void;
  className?: string;
  variant?: 'button' | 'dropdown';
}

export const ChatHistoryButton: React.FC<ChatHistoryButtonProps> = ({
  onSelectChat,
  className = '',
  variant = 'button'
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { getRecentChats } = useChatHistory();

  const recentChats = getRecentChats(5);

  if (variant === 'dropdown' && recentChats.length > 0) {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Previous Chats</span>
          <ChevronDown className="w-4 h-4" />
        </button>

        {isDropdownOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-10"
              onClick={() => setIsDropdownOpen(false)}
            />
            
            {/* Dropdown */}
            <div className="absolute right-0 top-full mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
              <div className="p-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900">Recent Chats</h3>
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setIsSidebarOpen(true);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    View All
                  </button>
                </div>
              </div>
              
              <div className="max-h-64 overflow-y-auto">
                {recentChats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => {
                      onSelectChat(chat);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {chat.title}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {chat.summary}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1 ml-2 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(chat.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsSidebarOpen(true)}
        className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${className}`}
      >
        <MessageSquare className="w-4 h-4" />
        <span>Previous Chats</span>
        {recentChats.length > 0 && (
          <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
            {recentChats.length}
          </span>
        )}
      </button>

      <ChatHistorySidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onSelectChat={onSelectChat}
      />
    </>
  );
};

export default ChatHistoryButton;
