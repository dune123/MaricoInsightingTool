import React from 'react';
import { MessageSquare, Clock, User, Bot, Target, TrendingUp, BarChart3, FileText, Calendar } from 'lucide-react';

interface ChatHistory {
  id: string;
  title: string;
  summary: string;
  timestamp: Date;
  type: 'analysis' | 'charting' | 'insights' | 'general';
  messageCount: number;
  lastMessage: string;
  charts?: number;
  documents?: string[];
}

interface PreviousChatsProps {
  chatHistory: ChatHistory[];
  onSelectChat: (chat: ChatHistory) => void;
  onDeleteChat?: (chatId: string) => void;
  className?: string;
}

const getChatIcon = (type: string) => {
  switch (type) {
    case 'analysis':
      return <BarChart3 className="w-5 h-5" />;
    case 'charting':
      return <TrendingUp className="w-5 h-5" />;
    case 'insights':
      return <Target className="w-5 h-5" />;
    default:
      return <MessageSquare className="w-5 h-5" />;
  }
};

const getChatColor = (type: string) => {
  switch (type) {
    case 'analysis':
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: 'text-blue-600',
        title: 'text-blue-800',
        text: 'text-blue-700'
      };
    case 'charting':
      return {
        bg: 'bg-green-50',
        border: 'border-green-200',
        icon: 'text-green-600',
        title: 'text-green-800',
        text: 'text-green-700'
      };
    case 'insights':
      return {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        icon: 'text-purple-600',
        title: 'text-purple-800',
        text: 'text-purple-700'
      };
    default:
      return {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        icon: 'text-gray-600',
        title: 'text-gray-800',
        text: 'text-gray-700'
      };
  }
};

const formatTimestamp = (timestamp: Date) => {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) {
    return `${minutes}m ago`;
  } else if (hours < 24) {
    return `${hours}h ago`;
  } else if (days < 7) {
    return `${days}d ago`;
  } else {
    return timestamp.toLocaleDateString();
  }
};

export const PreviousChats: React.FC<PreviousChatsProps> = ({
  chatHistory,
  onSelectChat,
  onDeleteChat,
  className = ''
}) => {
  if (chatHistory.length === 0) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Previous Chats</h3>
        <p className="text-gray-500">Start a new conversation to see your chat history here.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Previous Chats</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <MessageSquare className="w-4 h-4" />
          <span>{chatHistory.length} conversation{chatHistory.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="grid gap-4">
        {chatHistory.map((chat) => {
          const colors = getChatColor(chat.type);
          
          return (
            <div
              key={chat.id}
              className={`${colors.bg} ${colors.border} border rounded-lg p-4 cursor-pointer hover:shadow-md transition-all duration-200 group`}
              onClick={() => onSelectChat(chat)}
            >
              {/* Header with icon and title */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 ${colors.bg} ${colors.border} border rounded-lg flex items-center justify-center ${colors.icon}`}>
                    {getChatIcon(chat.type)}
                  </div>
                  <div>
                    <h3 className={`font-semibold ${colors.title} group-hover:underline`}>
                      {chat.title}
                    </h3>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimestamp(chat.timestamp)}</span>
                      <span>•</span>
                      <span>{chat.messageCount} messages</span>
                    </div>
                  </div>
                </div>
                
                {onDeleteChat && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(chat.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Summary */}
              <div className={`text-sm ${colors.text} mb-3`}>
                {chat.summary}
              </div>

              {/* Supporting Data */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-4">
                  {chat.charts && chat.charts > 0 && (
                    <div className="flex items-center space-x-1">
                      <BarChart3 className="w-3 h-3" />
                      <span>{chat.charts} chart{chat.charts !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {chat.documents && chat.documents.length > 0 && (
                    <div className="flex items-center space-x-1">
                      <FileText className="w-3 h-3" />
                      <span>{chat.documents.length} document{chat.documents.length !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
                
                <div className="text-xs text-gray-400">
                  Last message: {chat.lastMessage.substring(0, 50)}...
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PreviousChats;
