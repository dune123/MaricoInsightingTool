import { useState, useEffect } from 'react';

export interface ChatHistory {
  id: string;
  title: string;
  summary: string;
  timestamp: Date;
  type: 'analysis' | 'charting' | 'insights' | 'general';
  messageCount: number;
  lastMessage: string;
  charts?: number;
  documents?: string[];
  messages?: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
}

const STORAGE_KEY = 'brandbloom_chat_history';

export const useChatHistory = () => {
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);

  // Load chat history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert timestamp strings back to Date objects
        const history = parsed.map((chat: any) => ({
          ...chat,
          timestamp: new Date(chat.timestamp),
          messages: chat.messages?.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setChatHistory(history);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  }, []);

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chatHistory));
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }
  }, [chatHistory]);

  const addChat = (chat: Omit<ChatHistory, 'id' | 'timestamp'>) => {
    const newChat: ChatHistory = {
      ...chat,
      id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };
    
    setChatHistory(prev => [newChat, ...prev]);
    return newChat;
  };

  const updateChat = (chatId: string, updates: Partial<ChatHistory>) => {
    setChatHistory(prev => 
      prev.map(chat => 
        chat.id === chatId 
          ? { ...chat, ...updates }
          : chat
      )
    );
  };

  const deleteChat = (chatId: string) => {
    setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
  };

  const getChatById = (chatId: string) => {
    return chatHistory.find(chat => chat.id === chatId);
  };

  const clearAllChats = () => {
    setChatHistory([]);
  };

  const getRecentChats = (limit: number = 10) => {
    return chatHistory
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  };

  const getChatsByType = (type: ChatHistory['type']) => {
    return chatHistory.filter(chat => chat.type === type);
  };

  const searchChats = (query: string) => {
    const lowercaseQuery = query.toLowerCase();
    return chatHistory.filter(chat => 
      chat.title.toLowerCase().includes(lowercaseQuery) ||
      chat.summary.toLowerCase().includes(lowercaseQuery) ||
      chat.lastMessage.toLowerCase().includes(lowercaseQuery)
    );
  };

  return {
    chatHistory,
    addChat,
    updateChat,
    deleteChat,
    getChatById,
    clearAllChats,
    getRecentChats,
    getChatsByType,
    searchChats
  };
};

export default useChatHistory;
