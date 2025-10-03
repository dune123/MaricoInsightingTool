/**
 * ========================================
 * API CLIENT - SHARED UTILITY
 * ========================================
 * 
 * Purpose: Centralized HTTP client for API communications
 * 
 * Description:
 * Provides a centralized, configured HTTP client for all API communications
 * across the application. Includes error handling, response validation,
 * and consistent request/response formatting.
 * 
 * Last Updated: 2024-12-23
 * Author: BrandBloom Frontend Team
 */

import { logger } from './logger';

/**
 * API configuration
 */
export const API_CONFIG = {
  BASE_URL: 'http://localhost:8000/api',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000 // 1 second
} as const;

/**
 * Generic API response type
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * API error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * HTTP client class with error handling and retries
 */
class HttpClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = API_CONFIG.BASE_URL, timeout: number = API_CONFIG.TIMEOUT) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * Make a GET request
   */
  async get<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  /**
   * Make a POST request
   */
  async post<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      }
    });
  }

  /**
   * Make a PUT request
   */
  async put<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      }
    });
  }

  /**
   * Make a DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * Core request method with error handling and retries
   */
  private async request<T>(endpoint: string, options: RequestInit): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < API_CONFIG.RETRY_ATTEMPTS; attempt++) {
      try {
        logger.api(`${options.method} ${endpoint}`, { url }, 'ApiClient');
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Handle HTTP errors
        if (!response.ok) {
          const errorText = await response.text();
          throw new ApiError(
            `HTTP ${response.status}: ${response.statusText}`,
            response.status,
            errorText
          );
        }
        
        // Parse response
        const result = await response.json();
        
        logger.api(`${options.method} ${endpoint} - Success`, {
          success: result.success,
          dataSize: result.data ? Object.keys(result.data).length : 0
        }, 'ApiClient');
        
        return result;
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        console.error(`❌ API Error [${options.method}]: ${url}`, {
          attempt: attempt + 1,
          error: lastError.message
        });
        
        // Don't retry on certain errors
        if (error instanceof ApiError && error.status && error.status >= 400 && error.status < 500) {
          break;
        }
        
        // Wait before retrying
        if (attempt < API_CONFIG.RETRY_ATTEMPTS - 1) {
          await this.delay(API_CONFIG.RETRY_DELAY * Math.pow(2, attempt));
        }
      }
    }
    
    return {
      success: false,
      error: lastError?.message || 'Request failed after retries'
    };
  }

  /**
   * Delay utility for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Default HTTP client instance
 */
export const httpClient = new HttpClient();

/**
 * Convenience functions for common API patterns
 */
export const api = {
  /**
   * Fetch data with error handling
   */
  async fetchData<T>(endpoint: string): Promise<T | null> {
    const response = await httpClient.get<T>(endpoint);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    console.error('Failed to fetch data:', response.error);
    return null;
  },

  /**
   * Post data with error handling
   */
  async postData<T>(endpoint: string, data: unknown): Promise<T | null> {
    const response = await httpClient.post<T>(endpoint, data);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    console.error('Failed to post data:', response.error);
    return null;
  },

  /**
   * Upload file with progress tracking
   */
  async uploadFile(endpoint: string, file: File, onProgress?: (progress: number) => void): Promise<unknown> {
    const formData = new FormData();
    formData.append('file', file);
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress(progress);
          }
        });
      }
      
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText);
            resolve(result);
          } catch (error) {
            reject(new Error('Invalid JSON response'));
          }
        } else {
          reject(new ApiError(`HTTP ${xhr.status}: ${xhr.statusText}`, xhr.status));
        }
      });
      
      xhr.addEventListener('error', () => {
        reject(new Error('Network error'));
      });
      
      xhr.open('POST', `${API_CONFIG.BASE_URL}${endpoint}`);
      xhr.send(formData);
    });
  }
};
