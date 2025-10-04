import React, { useState } from 'react';
import { MessageSquare, Clock, BarChart3, Target, TrendingUp } from 'lucide-react';
import ChatHistoryButton from './ChatHistoryButton';
import { useChatHistory, ChatHistory } from '../hooks/useChatHistory';

interface ChatHistoryIntegrationProps {
  onChatSelect?: (chat: ChatHistory) => void;
  className?: string;
}

export const ChatHistoryIntegration: React.FC<ChatHistoryIntegrationProps> = ({
  onChatSelect,
  className = ''
}) => {
  const { addChat, updateChat } = useChatHistory();
  const [selectedChat, setSelectedChat] = useState<ChatHistory | null>(null);

  const handleSelectChat = (chat: ChatHistory) => {
    setSelectedChat(chat);
    onChatSelect?.(chat);
  };



  // Example function to create a new chat entry
  const createNewChat = React.useCallback(async (title: string, summary: string, type: ChatHistory['type'], messages: Array<{ content: string }>) => {
    const chatData = {
      title,
      summary,
      type,
      messageCount: messages.length,
      lastMessage: messages[messages.length - 1]?.content || '',
      messages: messages.map((msg, index) => ({
        id: `msg_${index}`,
        role: 'user' as const,
        content: msg.content,
        timestamp: new Date()
      }))
    };

    // Save to local storage
    const localChat = addChat(chatData);
    
    return localChat;
  }, [addChat]);

  // Example function to update an existing chat
  const updateExistingChat = React.useCallback(async (chatId: string, newMessage: string) => {
    // Update local storage
    updateChat(chatId, {
      lastMessage: newMessage,
      messageCount: (selectedChat?.messageCount || 0) + 1
    });

  }, [updateChat, selectedChat]);

  // Export these functions for external use
  React.useEffect(() => {
    // Make functions available globally for testing
    (window as unknown as Record<string, unknown>).createNewChat = createNewChat;
    (window as unknown as Record<string, unknown>).updateExistingChat = updateExistingChat;
  }, [createNewChat, updateExistingChat]);

  return (
    <div className={`space-y-4 ${className}`}>


      {/* Chat History Button */}
      <ChatHistoryButton
        onSelectChat={handleSelectChat}
        variant="button"
        className="w-full"
      />

      {/* Selected Chat Display */}
      {selectedChat && (
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
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{selectedChat.timestamp.toLocaleDateString()}</span>
                </div>
                <span>{selectedChat.messageCount} messages</span>
                {selectedChat.charts && (
                  <span>{selectedChat.charts} charts</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Usage Examples */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Usage Examples:</h4>
        <div className="space-y-2 text-xs text-gray-600">
          <p>• Click "Previous Chats" to view your chat history</p>
          <p>• Search and filter conversations by type</p>
          <p>• Select a chat to continue the conversation</p>
          <p>• Delete individual chats or clear all history</p>
        </div>
      </div>
    </div>
  );
};

export default ChatHistoryIntegration;
