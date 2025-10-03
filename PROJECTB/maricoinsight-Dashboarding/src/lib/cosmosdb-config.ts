// CosmosDB Configuration
export interface CosmosDBConfig {
  endpoint: string;
  key: string;
  databaseId: string;
  containerId: string;
  isConfigured: boolean;
}

// Environment variables for CosmosDB
export const getCosmosDBConfig = (): CosmosDBConfig => {
  const endpoint = import.meta.env.VITE_COSMOSDB_ENDPOINT;
  const key = import.meta.env.VITE_COSMOSDB_KEY;
  const databaseId = import.meta.env.VITE_COSMOSDB_DATABASE_ID || 'brandbloom-insights';
  const containerId = import.meta.env.VITE_COSMOSDB_CONTAINER_ID || 'data';

  // Check if CosmosDB is configured
  const isConfigured = !!(endpoint && key);

  if (!isConfigured) {
    console.warn('CosmosDB configuration is missing. CosmosDB features will be disabled. Please set VITE_COSMOSDB_ENDPOINT and VITE_COSMOSDB_KEY environment variables to enable cloud storage.');
  }

  return {
    endpoint: endpoint || '',
    key: key || '',
    databaseId,
    containerId,
    isConfigured
  };
};

// Container configurations for different data types
export const CONTAINERS = {
  CHATS: 'chats',
  CHARTS: 'charts',
  DASHBOARDS: 'dashboards',
  ANALYSIS: 'analysis'
} as const;

export type ContainerType = typeof CONTAINERS[keyof typeof CONTAINERS];
