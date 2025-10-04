import React, { useState } from 'react';
import { X, Search, Filter, MessageSquare, Trash2, Calendar, BarChart3, Target, TrendingUp } from 'lucide-react';
import PreviousChats from './PreviousChats';
import { useChatHistory, ChatHistory } from '../hooks/useChatHistory';

interface ChatHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChat: (chat: ChatHistory) => void;
  className?: string;
}

export const ChatHistorySidebar: React.FC<ChatHistorySidebarProps> = ({
  isOpen,
  onClose,
  onSelectChat,
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ChatHistory['type'] | 'all'>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  const {
    chatHistory,
    deleteChat,
    clearAllChats,
    getRecentChats,
    getChatsByType,
    searchChats
  } = useChatHistory();

  // Filter chats based on search and type
  const filteredChats = React.useMemo(() => {
    let chats = chatHistory;

    // Apply type filter
    if (filterType !== 'all') {
      chats = getChatsByType(filterType);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      chats = searchChats(searchQuery);
    }

    // Sort by most recent
    return chats.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [chatHistory, filterType, searchQuery, getChatsByType, searchChats]);

  const handleDeleteChat = (chatId: string) => {
    deleteChat(chatId);
    setShowDeleteConfirm(null);
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete all chat history? This action cannot be undone.')) {
      clearAllChats();
    }
  };

  const getFilterIcon = (type: string) => {
    switch (type) {
      case 'analysis':
        return <BarChart3 className="w-4 h-4" />;
      case 'charting':
        return <TrendingUp className="w-4 h-4" />;
      case 'insights':
        return <Target className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 ${className}`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Chat History</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-4 border-b border-gray-200 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filterType === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All ({chatHistory.length})
            </button>
            <button
              onClick={() => setFilterType('analysis')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center space-x-1 ${
                filterType === 'analysis'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {getFilterIcon('analysis')}
              <span>Analysis ({getChatsByType('analysis').length})</span>
            </button>
            <button
              onClick={() => setFilterType('charting')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center space-x-1 ${
                filterType === 'charting'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {getFilterIcon('charting')}
              <span>Charts ({getChatsByType('charting').length})</span>
            </button>
            <button
              onClick={() => setFilterType('insights')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center space-x-1 ${
                filterType === 'insights'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {getFilterIcon('insights')}
              <span>Insights ({getChatsByType('insights').length})</span>
            </button>
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {filteredChats.length === 0 ? (
            <div className="p-6 text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'No matching chats' : 'No Previous Chats'}
              </h3>
              <p className="text-gray-500">
                {searchQuery 
                  ? 'Try adjusting your search terms or filters.'
                  : 'Start a new conversation to see your chat history here.'
                }
              </p>
            </div>
          ) : (
            <PreviousChats
              chatHistory={filteredChats}
              onSelectChat={(chat) => {
                onSelectChat(chat);
                onClose();
              }}
              onDeleteChat={handleDeleteChat}
              className="p-4"
            />
          )}
        </div>

        {/* Footer */}
        {chatHistory.length > 0 && (
          <div className="border-t border-gray-200 p-4">
            <button
              onClick={handleClearAll}
              className="w-full flex items-center justify-center space-x-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 py-2 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear All History</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHistorySidebar;
