import { ChartData, AnalysisResult } from './chart';

// Base interface for all CosmosDB documents
export interface CosmosDocument {
  id: string;
  _etag?: string;
  _ts?: number;
  _rid?: string;
  _self?: string;
  _attachments?: string;
  ttl?: number;
}

// Chat History Document
export interface ChatHistoryDocument extends CosmosDocument {
  type: 'chat';
  title: string;
  summary: string;
  timestamp: string; // ISO string for CosmosDB
  chatType: 'analysis' | 'charting' | 'insights' | 'general';
  messageCount: number;
  lastMessage: string;
  charts?: number;
  documents?: string[];
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string; // ISO string
  }>;
  userId?: string;
  sessionId?: string;
}

// Chart Document
export interface ChartDocument extends CosmosDocument {
  type: 'chart';
  chartData: ChartData;
  analysisId?: string;
  dashboardId?: string;
  userId?: string;
  sessionId?: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  tags?: string[];
  isPublic?: boolean;
}

// Dashboard Document
export interface DashboardDocument extends CosmosDocument {
  type: 'dashboard';
  name: string;
  description?: string;
  charts: ChartData[];
  layout?: Array<{
    chartId: string;
    x: number;
    y: number;
    w: number;
    h: number;
  }>;
  userId?: string;
  sessionId?: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  isPublic?: boolean;
  tags?: string[];
}

// Analysis Document
export interface AnalysisDocument extends CosmosDocument {
  type: 'analysis';
  analysisResult: AnalysisResult;
  userId?: string;
  sessionId?: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  tags?: string[];
  isPublic?: boolean;
}

// Query parameters for filtering
export interface QueryOptions {
  userId?: string;
  sessionId?: string;
  type?: string;
  tags?: string[];
  isPublic?: boolean;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

// Response wrapper for CosmosDB operations
export interface CosmosResponse<T> {
  data: T[];
  totalCount: number;
  hasMore: boolean;
  continuationToken?: string;
}

// Error types
export interface CosmosError {
  code: string;
  message: string;
  details?: any;
}

// Bulk operation types
export interface BulkOperation {
  operation: 'create' | 'update' | 'delete' | 'upsert';
  id: string;
  data?: any;
}

export interface BulkResponse {
  success: boolean;
  processed: number;
  failed: number;
  errors: CosmosError[];
}
