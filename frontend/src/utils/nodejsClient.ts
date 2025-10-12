/**
 * ========================================
 * NODE.JS BACKEND CLIENT
 * ========================================
 * 
 * Purpose: HTTP client specifically for Node.js backend communications
 * 
 * Description:
 * Provides a dedicated HTTP client for communicating with the Node.js backend
 * running on port 3001. Used for state management, metadata operations,
 * and other Node.js-specific endpoints.
 * 
 * Last Updated: 2025-09-02
 * Author: BrandBloom Frontend Team
 */

import { logger } from './logger';

/**
 * Node.js backend configuration
 */
export const NODEJS_CONFIG = {
  BASE_URL: (import.meta.env.VITE_NODE_API_URL || 'http://localhost:3001') + '/api',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000 // 1 second
} as const;

/**
 * Generic API response type
 */
export interface NodejsResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * API error class
 */
export class NodejsError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'NodejsError';
  }
}

/**
 * HTTP client for Node.js backend
 */
class NodejsClient {
  private baseURL: string;
  private timeout: number;
  private retryAttempts: number;
  private retryDelay: number;

  constructor() {
    this.baseURL = NODEJS_CONFIG.BASE_URL;
    this.timeout = NODEJS_CONFIG.TIMEOUT;
    this.retryAttempts = NODEJS_CONFIG.RETRY_ATTEMPTS;
    this.retryDelay = NODEJS_CONFIG.RETRY_DELAY;
  }

  /**
   * Make HTTP request with retry logic
   */
  private async request<T>(
    method: string,
    url: string,
    data?: unknown,
    attempt: number = 1
  ): Promise<{ data: NodejsResponse<T> }> {
    const fullUrl = `${this.baseURL}${url}`;
    
    try {
      console.log(`🌐 [${method}] ${fullUrl}`, { attempt, data });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(fullUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        // Don't retry on 404 errors - they indicate the resource doesn't exist
        if (response.status === 404) {
          throw error;
        }
        throw error;
      }

      const result = await response.json();
      console.log(`✅ [${method}] ${fullUrl} - Success`, { result });
      
      return { data: result };
    } catch (error) {
      logger.error(`❌ API Error [${method}]: ${fullUrl}`, { attempt, error });
      
      // Don't retry on 404 errors - they indicate the resource doesn't exist
      const is404Error = error instanceof Error && error.message.includes('404');
      
      if (attempt < this.retryAttempts && !is404Error) {
        console.log(`🔄 Retrying [${method}] ${fullUrl} in ${this.retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.request<T>(method, url, data, attempt + 1);
      }
      
      throw new NodejsError(
        error instanceof Error ? error.message : 'Unknown error',
        error instanceof Error && 'status' in error ? (error as Error & { status: number }).status : undefined,
        error
      );
    }
  }

  /**
   * GET request
   */
  async get<T>(url: string): Promise<{ data: NodejsResponse<T> }> {
    return this.request<T>('GET', url);
  }

  /**
   * POST request
   */
  async post<T>(url: string, data?: unknown): Promise<{ data: NodejsResponse<T> }> {
    return this.request<T>('POST', url, data);
  }

  /**
   * PUT request
   */
  async put<T>(url: string, data?: unknown): Promise<{ data: NodejsResponse<T> }> {
    return this.request<T>('PUT', url, data);
  }

  /**
   * DELETE request
   */
  async delete<T>(url: string): Promise<{ data: NodejsResponse<T> }> {
    return this.request<T>('DELETE', url);
  }
}

// Export singleton instance
export const nodejsClient = new NodejsClient();
