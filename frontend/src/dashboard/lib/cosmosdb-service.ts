import { CosmosClient, Database, Container } from '@azure/cosmos';
import { 
  CosmosDocument, 
  ChatHistoryDocument, 
  ChartDocument, 
  DashboardDocument, 
  AnalysisDocument,
  CosmosResponse,
  CosmosError,
  BulkOperation,
  BulkResponse
} from '../types/cosmosdb';
import { getCosmosDBConfig, CONTAINERS, ContainerType } from './cosmosdb-config';

class CosmosDBService {
  private client: CosmosClient | null = null;
  private database: Database | null = null;
  private containers: Map<ContainerType, Container> = new Map();
  private isConfigured: boolean = false;

  constructor() {
    const config = getCosmosDBConfig();
    this.isConfigured = config.isConfigured;
    
    if (this.isConfigured) {
      this.client = new CosmosClient({
        endpoint: config.endpoint,
        key: config.key
      });
      this.database = this.client.database(config.databaseId);
      this.initializeContainers();
    } else {
      console.warn('CosmosDB is not configured. All database operations will be disabled.');
    }
  }

  private async initializeContainers() {
    if (!this.isConfigured || !this.database) {
      return;
    }
    
    try {
      // Initialize all containers
      for (const containerType of Object.values(CONTAINERS)) {
        const container = this.database.container(containerType);
        this.containers.set(containerType, container);
      }
    } catch (error) {
      console.error('Failed to initialize CosmosDB containers:', error);
      throw error;
    }
  }

  // Check if CosmosDB is available
  public isAvailable(): boolean {
    return this.isConfigured && this.client !== null && this.database !== null;
  }

  private getContainer(containerType: ContainerType): Container {
    const container = this.containers.get(containerType);
    if (!container) {
      throw new Error(`Container ${containerType} not found`);
    }
    return container;
  }

  // Generic CRUD operations
  async create<T extends CosmosDocument>(containerType: ContainerType, document: Omit<T, 'id'>): Promise<T> {
    if (!this.isAvailable()) {
      throw new Error('CosmosDB is not configured or available');
    }
    
    try {
      const container = this.getContainer(containerType);
      const id = this.generateId();
      const documentWithId = { ...document, id } as T;
      
      const response = await container.items.create(documentWithId);
      return response.resource as T;
    } catch (error) {
      console.error(`Failed to create document in ${containerType}:`, error);
      throw this.handleError(error);
    }
  }

  async get<T extends CosmosDocument>(containerType: ContainerType, id: string): Promise<T | null> {
    if (!this.isAvailable()) {
      throw new Error('CosmosDB is not configured or available');
    }
    
    try {
      const container = this.getContainer(containerType);
      const response = await container.item(id, id).read<T>();
      return response.resource || null;
    } catch (error: any) {
      if (error.code === 404) {
        return null;
      }
      console.error(`Failed to get document ${id} from ${containerType}:`, error);
      throw this.handleError(error);
    }
  }

  async update<T extends CosmosDocument>(containerType: ContainerType, document: T): Promise<T> {
    if (!this.isAvailable()) {
      throw new Error('CosmosDB is not configured or available');
    }
    
    try {
      const container = this.getContainer(containerType);
      const response = await container.items.upsert(document);
      return response.resource as T;
    } catch (error) {
      console.error(`Failed to update document ${document.id} in ${containerType}:`, error);
      throw this.handleError(error);
    }
  }

  async delete(containerType: ContainerType, id: string): Promise<boolean> {
    if (!this.isAvailable()) {
      throw new Error('CosmosDB is not configured or available');
    }
    
    try {
      const container = this.getContainer(containerType);
      await container.item(id, id).delete();
      return true;
    } catch (error: any) {
      if (error.code === 404) {
        return false;
      }
      console.error(`Failed to delete document ${id} from ${containerType}:`, error);
      throw this.handleError(error);
    }
  }

  async query<T extends CosmosDocument>(
    containerType: ContainerType, 
    query: string, 
    parameters?: any[]
  ): Promise<CosmosResponse<T>> {
    try {
      const container = this.getContainer(containerType);
      const { resources, continuationToken } = await container.items
        .query<T>({ query, parameters })
        .fetchAll();

      return {
        data: resources,
        totalCount: resources.length,
        hasMore: !!continuationToken,
        continuationToken
      };
    } catch (error) {
      console.error(`Failed to query ${containerType}:`, error);
      throw this.handleError(error);
    }
  }

  // Chat History specific operations
  async saveChatHistory(chat: Omit<ChatHistoryDocument, 'id' | 'type'>): Promise<ChatHistoryDocument> {
    const chatDocument: Omit<ChatHistoryDocument, 'id'> = {
      ...chat,
      type: 'chat',
      timestamp: new Date().toISOString()
    };
    return this.create<ChatHistoryDocument>(CONTAINERS.CHATS, chatDocument);
  }

  async getChatHistory(userId?: string, sessionId?: string): Promise<ChatHistoryDocument[]> {
    let query = 'SELECT * FROM c WHERE c.type = "chat"';
    const parameters: any[] = [];
    
    if (userId) {
      query += ' AND c.userId = @userId';
      parameters.push({ name: '@userId', value: userId });
    }
    
    if (sessionId) {
      query += ' AND c.sessionId = @sessionId';
      parameters.push({ name: '@sessionId', value: sessionId });
    }
    
    query += ' ORDER BY c.timestamp DESC';
    
    const response = await this.query<ChatHistoryDocument>(CONTAINERS.CHATS, query, parameters);
    return response.data;
  }

  async updateChatHistory(chatId: string, updates: Partial<ChatHistoryDocument>): Promise<ChatHistoryDocument | null> {
    const existing = await this.get<ChatHistoryDocument>(CONTAINERS.CHATS, chatId);
    if (!existing) return null;
    
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    return this.update<ChatHistoryDocument>(CONTAINERS.CHATS, updated);
  }

  // Chart specific operations
  async saveChart(chart: Omit<ChartDocument, 'id' | 'type'>): Promise<ChartDocument> {
    const chartDocument: Omit<ChartDocument, 'id'> = {
      ...chart,
      type: 'chart',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return this.create<ChartDocument>(CONTAINERS.CHARTS, chartDocument);
  }

  async getCharts(userId?: string, analysisId?: string, dashboardId?: string): Promise<ChartDocument[]> {
    let query = 'SELECT * FROM c WHERE c.type = "chart"';
    const parameters: any[] = [];
    
    if (userId) {
      query += ' AND c.userId = @userId';
      parameters.push({ name: '@userId', value: userId });
    }
    
    if (analysisId) {
      query += ' AND c.analysisId = @analysisId';
      parameters.push({ name: '@analysisId', value: analysisId });
    }
    
    if (dashboardId) {
      query += ' AND c.dashboardId = @dashboardId';
      parameters.push({ name: '@dashboardId', value: dashboardId });
    }
    
    query += ' ORDER BY c.createdAt DESC';
    
    const response = await this.query<ChartDocument>(CONTAINERS.CHARTS, query, parameters);
    return response.data;
  }

  // Dashboard specific operations
  async saveDashboard(dashboard: Omit<DashboardDocument, 'id' | 'type'>): Promise<DashboardDocument> {
    const dashboardDocument: Omit<DashboardDocument, 'id'> = {
      ...dashboard,
      type: 'dashboard',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return this.create<DashboardDocument>(CONTAINERS.DASHBOARDS, dashboardDocument);
  }

  async getDashboards(userId?: string): Promise<DashboardDocument[]> {
    let query = 'SELECT * FROM c WHERE c.type = "dashboard"';
    const parameters: any[] = [];
    
    if (userId) {
      query += ' AND c.userId = @userId';
      parameters.push({ name: '@userId', value: userId });
    }
    
    query += ' ORDER BY c.updatedAt DESC';
    
    const response = await this.query<DashboardDocument>(CONTAINERS.DASHBOARDS, query, parameters);
    return response.data;
  }

  async updateDashboard(dashboardId: string, updates: Partial<DashboardDocument>): Promise<DashboardDocument | null> {
    const existing = await this.get<DashboardDocument>(CONTAINERS.DASHBOARDS, dashboardId);
    if (!existing) return null;
    
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    return this.update<DashboardDocument>(CONTAINERS.DASHBOARDS, updated);
  }

  // Analysis specific operations
  async saveAnalysis(analysis: Omit<AnalysisDocument, 'id' | 'type'>): Promise<AnalysisDocument> {
    const analysisDocument: Omit<AnalysisDocument, 'id'> = {
      ...analysis,
      type: 'analysis',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return this.create<AnalysisDocument>(CONTAINERS.ANALYSIS, analysisDocument);
  }

  async getAnalyses(userId?: string): Promise<AnalysisDocument[]> {
    let query = 'SELECT * FROM c WHERE c.type = "analysis"';
    const parameters: any[] = [];
    
    if (userId) {
      query += ' AND c.userId = @userId';
      parameters.push({ name: '@userId', value: userId });
    }
    
    query += ' ORDER BY c.createdAt DESC';
    
    const response = await this.query<AnalysisDocument>(CONTAINERS.ANALYSIS, query, parameters);
    return response.data;
  }

  // Bulk operations
  async bulkOperation(containerType: ContainerType, operations: BulkOperation[]): Promise<BulkResponse> {
    try {
      const container = this.getContainer(containerType);
      const results = await Promise.allSettled(
        operations.map(async (op) => {
          switch (op.operation) {
            case 'create':
              return container.items.create(op.data);
            case 'update':
              return container.items.upsert(op.data);
            case 'delete':
              return container.item(op.id, op.id).delete();
            case 'upsert':
              return container.items.upsert(op.data);
            default:
              throw new Error(`Unsupported operation: ${op.operation}`);
          }
        })
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      const errors = results
        .filter(r => r.status === 'rejected')
        .map(r => (r as PromiseRejectedResult).reason);

      return {
        success: failed === 0,
        processed: successful,
        failed,
        errors
      };
    } catch (error) {
      console.error(`Bulk operation failed for ${containerType}:`, error);
      throw this.handleError(error);
    }
  }

  // Utility methods
  private generateId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private handleError(error: any): CosmosError {
    return {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred',
      details: error
    };
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }
    
    try {
      await this.database!.read();
      return true;
    } catch (error) {
      console.error('CosmosDB health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const cosmosDBService = new CosmosDBService();
export default cosmosDBService;
