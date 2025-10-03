/**
 * ========================================
 * NON-MMM MODEL STATE SERVICE
 * ========================================
 * 
 * Purpose: Manage model state using Node.js backend
 * 
 * Description:
 * This service handles model state management through the Node.js backend,
 * including saving models, setting production models, and retrieving model lists.
 * 
 * Key Features:
 * - Save models to Node.js state
 * - Set models to production
 * - Retrieve model lists with proper ordering
 * - Model state persistence
 * 
 * Dependencies:
 * - Node.js backend for state management
 * - Non-MMM model types and interfaces
 * 
 * Last Updated: 2025-01-31
 * Author: BrandBloom Frontend Team
 */

import { nodejsClient } from '@/utils/nodejsClient';

export interface NonMMMModelState {
  id: string;
  modelType: string;
  rSquared: number;
  adjustedRSquared: number;
  rootMeanSquareError: number;
  meanAbsoluteError: number;
  variables: Array<{
    name: string;
    coefficient: number;
    pValue: number;
    vif: number;
  }>;
  executionTime: number;
  createdAt: string;
  isSaved: boolean;
  isProduction: boolean;
  filename: string;
  brand: string;
  targetVariable: string;
  independentVariables: string[];
}

export interface SaveModelRequest {
  modelData: NonMMMModelState;
  brand: string;
  filename: string;
}

export interface SetProductionRequest {
  modelId: string;
  brand: string;
  filename: string;
}

export interface ModelStateResponse {
  success: boolean;
  data?: {
    models: NonMMMModelState[];
    productionModel?: NonMMMModelState;
  };
  error?: string;
}

export class NonMMMModelStateService {
  /**
   * Save a model to Node.js state
   */
  static async saveModel(request: SaveModelRequest): Promise<ModelStateResponse> {
    try {
      const response = await nodejsClient.post('/nonmmm/save-model', request);
      return response.data;
    } catch (error) {
      console.error('Error saving model:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save model'
      };
    }
  }

  /**
   * Set a model to production
   */
  static async setProductionModel(request: SetProductionRequest): Promise<ModelStateResponse> {
    try {
      const response = await nodejsClient.post('/nonmmm/set-production-model', request);
      return response.data;
    } catch (error) {
      console.error('Error setting production model:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to set production model'
      };
    }
  }

  /**
   * Get all models for a brand and filename
   */
  static async getModels(brand: string, filename: string): Promise<ModelStateResponse> {
    try {
      const response = await nodejsClient.get(`/nonmmm/models/${brand}/${encodeURIComponent(filename)}`);
      return response.data;
    } catch (error) {
      console.error('Error getting models:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get models'
      };
    }
  }

  /**
   * Delete a model
   */
  static async deleteModel(modelId: string, brand: string, filename: string): Promise<ModelStateResponse> {
    try {
      const response = await nodejsClient.delete(`/nonmmm/models/${modelId}?brand=${brand}&filename=${encodeURIComponent(filename)}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting model:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete model'
      };
    }
  }
}
