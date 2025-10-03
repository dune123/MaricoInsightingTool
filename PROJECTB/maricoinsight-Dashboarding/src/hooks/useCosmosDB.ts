import { useState, useEffect, useCallback } from 'react';
import { cosmosDBService } from '../lib/cosmosdb-service';
import { 
  ChatHistoryDocument, 
  ChartDocument, 
  DashboardDocument, 
  AnalysisDocument,
  CosmosError 
} from '../types/cosmosdb';
import { ChatHistory } from './useChatHistory';

// Hook for Chat History with CosmosDB
export const useCosmosChatHistory = (userId?: string, sessionId?: string) => {
  const [chats, setChats] = useState<ChatHistoryDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<CosmosError | null>(null);

  const loadChats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Check if CosmosDB is available
      if (!cosmosDBService.isAvailable()) {
        console.warn('CosmosDB is not configured. Skipping load operation.');
        setChats([]);
        return;
      }
      
      const chatHistory = await cosmosDBService.getChatHistory(userId, sessionId);
      setChats(chatHistory);
    } catch (err) {
      setError(err as CosmosError);
    } finally {
      setLoading(false);
    }
  }, [userId, sessionId]);

  const saveChat = useCallback(async (chat: Omit<ChatHistoryDocument, 'id' | 'type'>) => {
    try {
      // Check if CosmosDB is available
      if (!cosmosDBService.isAvailable()) {
        console.warn('CosmosDB is not configured. Save operation skipped.');
        return null;
      }
      
      const savedChat = await cosmosDBService.saveChatHistory(chat);
      setChats(prev => [savedChat, ...prev]);
      return savedChat;
    } catch (err) {
      setError(err as CosmosError);
      throw err;
    }
  }, []);

  const updateChat = useCallback(async (chatId: string, updates: Partial<ChatHistoryDocument>) => {
    try {
      const updatedChat = await cosmosDBService.updateChatHistory(chatId, updates);
      if (updatedChat) {
        setChats(prev => prev.map(chat => chat.id === chatId ? updatedChat : chat));
      }
      return updatedChat;
    } catch (err) {
      setError(err as CosmosError);
      throw err;
    }
  }, []);

  const deleteChat = useCallback(async (chatId: string) => {
    try {
      const success = await cosmosDBService.delete(CONTAINERS.CHATS, chatId);
      if (success) {
        setChats(prev => prev.filter(chat => chat.id !== chatId));
      }
      return success;
    } catch (err) {
      setError(err as CosmosError);
      throw err;
    }
  }, []);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  return {
    chats,
    loading,
    error,
    saveChat,
    updateChat,
    deleteChat,
    refresh: loadChats
  };
};

// Hook for Charts with CosmosDB
export const useCosmosCharts = (userId?: string, analysisId?: string, dashboardId?: string) => {
  const [charts, setCharts] = useState<ChartDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<CosmosError | null>(null);

  const loadCharts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const chartData = await cosmosDBService.getCharts(userId, analysisId, dashboardId);
      setCharts(chartData);
    } catch (err) {
      setError(err as CosmosError);
    } finally {
      setLoading(false);
    }
  }, [userId, analysisId, dashboardId]);

  const saveChart = useCallback(async (chart: Omit<ChartDocument, 'id' | 'type'>) => {
    try {
      const savedChart = await cosmosDBService.saveChart(chart);
      setCharts(prev => [savedChart, ...prev]);
      return savedChart;
    } catch (err) {
      setError(err as CosmosError);
      throw err;
    }
  }, []);

  const updateChart = useCallback(async (chartId: string, updates: Partial<ChartDocument>) => {
    try {
      const existing = await cosmosDBService.get<ChartDocument>(CONTAINERS.CHARTS, chartId);
      if (existing) {
        const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
        const updatedChart = await cosmosDBService.update<ChartDocument>(CONTAINERS.CHARTS, updated);
        setCharts(prev => prev.map(chart => chart.id === chartId ? updatedChart : chart));
        return updatedChart;
      }
      return null;
    } catch (err) {
      setError(err as CosmosError);
      throw err;
    }
  }, []);

  const deleteChart = useCallback(async (chartId: string) => {
    try {
      const success = await cosmosDBService.delete(CONTAINERS.CHARTS, chartId);
      if (success) {
        setCharts(prev => prev.filter(chart => chart.id !== chartId));
      }
      return success;
    } catch (err) {
      setError(err as CosmosError);
      throw err;
    }
  }, []);

  useEffect(() => {
    loadCharts();
  }, [loadCharts]);

  return {
    charts,
    loading,
    error,
    saveChart,
    updateChart,
    deleteChart,
    refresh: loadCharts
  };
};

// Hook for Dashboards with CosmosDB
export const useCosmosDashboards = (userId?: string) => {
  const [dashboards, setDashboards] = useState<DashboardDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<CosmosError | null>(null);

  const loadDashboards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const dashboardData = await cosmosDBService.getDashboards(userId);
      setDashboards(dashboardData);
    } catch (err) {
      setError(err as CosmosError);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const saveDashboard = useCallback(async (dashboard: Omit<DashboardDocument, 'id' | 'type'>) => {
    try {
      const savedDashboard = await cosmosDBService.saveDashboard(dashboard);
      setDashboards(prev => [savedDashboard, ...prev]);
      return savedDashboard;
    } catch (err) {
      setError(err as CosmosError);
      throw err;
    }
  }, []);

  const updateDashboard = useCallback(async (dashboardId: string, updates: Partial<DashboardDocument>) => {
    try {
      const updatedDashboard = await cosmosDBService.updateDashboard(dashboardId, updates);
      if (updatedDashboard) {
        setDashboards(prev => prev.map(dashboard => dashboard.id === dashboardId ? updatedDashboard : dashboard));
      }
      return updatedDashboard;
    } catch (err) {
      setError(err as CosmosError);
      throw err;
    }
  }, []);

  const deleteDashboard = useCallback(async (dashboardId: string) => {
    try {
      const success = await cosmosDBService.delete(CONTAINERS.DASHBOARDS, dashboardId);
      if (success) {
        setDashboards(prev => prev.filter(dashboard => dashboard.id !== dashboardId));
      }
      return success;
    } catch (err) {
      setError(err as CosmosError);
      throw err;
    }
  }, []);

  useEffect(() => {
    loadDashboards();
  }, [loadDashboards]);

  return {
    dashboards,
    loading,
    error,
    saveDashboard,
    updateDashboard,
    deleteDashboard,
    refresh: loadDashboards
  };
};

// Hook for Analysis with CosmosDB
export const useCosmosAnalysis = (userId?: string) => {
  const [analyses, setAnalyses] = useState<AnalysisDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<CosmosError | null>(null);

  const loadAnalyses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const analysisData = await cosmosDBService.getAnalyses(userId);
      setAnalyses(analysisData);
    } catch (err) {
      setError(err as CosmosError);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const saveAnalysis = useCallback(async (analysis: Omit<AnalysisDocument, 'id' | 'type'>) => {
    try {
      const savedAnalysis = await cosmosDBService.saveAnalysis(analysis);
      setAnalyses(prev => [savedAnalysis, ...prev]);
      return savedAnalysis;
    } catch (err) {
      setError(err as CosmosError);
      throw err;
    }
  }, []);

  const updateAnalysis = useCallback(async (analysisId: string, updates: Partial<AnalysisDocument>) => {
    try {
      const existing = await cosmosDBService.get<AnalysisDocument>(CONTAINERS.ANALYSIS, analysisId);
      if (existing) {
        const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
        const updatedAnalysis = await cosmosDBService.update<AnalysisDocument>(CONTAINERS.ANALYSIS, updated);
        setAnalyses(prev => prev.map(analysis => analysis.id === analysisId ? updatedAnalysis : analysis));
        return updatedAnalysis;
      }
      return null;
    } catch (err) {
      setError(err as CosmosError);
      throw err;
    }
  }, []);

  const deleteAnalysis = useCallback(async (analysisId: string) => {
    try {
      const success = await cosmosDBService.delete(CONTAINERS.ANALYSIS, analysisId);
      if (success) {
        setAnalyses(prev => prev.filter(analysis => analysis.id !== analysisId));
      }
      return success;
    } catch (err) {
      setError(err as CosmosError);
      throw err;
    }
  }, []);

  useEffect(() => {
    loadAnalyses();
  }, [loadAnalyses]);

  return {
    analyses,
    loading,
    error,
    saveAnalysis,
    updateAnalysis,
    deleteAnalysis,
    refresh: loadAnalyses
  };
};

// Utility hook for converting between local and CosmosDB formats
export const useDataConversion = () => {
  const convertChatToCosmos = useCallback((chat: ChatHistory): Omit<ChatHistoryDocument, 'id' | 'type'> => {
    return {
      title: chat.title,
      summary: chat.summary,
      timestamp: chat.timestamp.toISOString(),
      chatType: chat.type,
      messageCount: chat.messageCount,
      lastMessage: chat.lastMessage,
      charts: chat.charts,
      documents: chat.documents,
      messages: chat.messages?.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString()
      })) || []
    };
  }, []);

  const convertChatFromCosmos = useCallback((cosmosChat: ChatHistoryDocument): ChatHistory => {
    return {
      id: cosmosChat.id,
      title: cosmosChat.title,
      summary: cosmosChat.summary,
      timestamp: new Date(cosmosChat.timestamp),
      type: cosmosChat.chatType,
      messageCount: cosmosChat.messageCount,
      lastMessage: cosmosChat.lastMessage,
      charts: cosmosChat.charts,
      documents: cosmosChat.documents,
      messages: cosmosChat.messages?.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      })) || []
    };
  }, []);

  return {
    convertChatToCosmos,
    convertChatFromCosmos
  };
};

// Import CONTAINERS from config
import { CONTAINERS } from '../lib/cosmosdb-config';
