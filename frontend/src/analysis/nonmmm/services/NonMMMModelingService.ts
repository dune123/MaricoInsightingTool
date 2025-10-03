/**
 * ========================================
 * NON-MMM MODELING SERVICE
 * ========================================
 * 
 * Purpose: Handle statistical modeling and model results for Non-MMM analysis workflows
 * 
 * Description:
 * This service provides comprehensive modeling capabilities specifically for
 * Non-MMM analysis, including model training, result generation, and statistical
 * analysis. It supports multiple model types and provides detailed model performance
 * metrics and variable statistics.
 * 
 * Key Functionality:
 * - Train statistical models with selected variables
 * - Generate comprehensive model results
 * - Provide model performance metrics
 * - Handle variable selection and validation
 * - Support multiple model types
 * 
 * Non-MMM Specific Features:
 * - Focus on single dataset modeling
 * - Simplified model selection workflow
 * - Direct variable inclusion/exclusion
 * - Streamlined result interpretation
 * 
 * Model Types Supported:
 * - Linear: Basic linear regression
 * - Log-Linear: Log transformation on target variable
 * - Log-Log: Log transformation on both predictors and target
 * - Ridge: Regularized regression with L2 penalty
 * - Bayesian: Probabilistic model with uncertainty estimates
 * 
 * Dependencies:
 * - Python FastAPI backend for model training
 * - Statistical modeling libraries
 * - Non-MMM type definitions
 * 
 * Used by:
 * - Non-MMM modeling components
 * - Model results visualization
 * - Variable selection workflows
 * 
 * Last Updated: 2025-01-31
 * Author: BrandBloom Frontend Team
 */

import { httpClient, api } from '@/utils/apiClient';

export interface NonMMMModelType {
  id: string;
  name: string;
  description: string;
  parameters?: Record<string, unknown>;
}

export interface NonMMMModelVariable {
  name: string;
  expectedSign: '+' | '-' | '~';
  included: boolean;
  coefficient?: number;
  pValue?: number;
  elasticity?: number;
  vif?: number;
  tStatistic?: number;
  standardError?: number;
  confidenceInterval?: [number, number];
}

export interface NonMMMModelResult {
  modelId: string;
  modelName: string;
  modelType: string;
  rSquared: number;
  adjustedRSquared: number;
  intercept: number;
  variables: NonMMMModelVariable[];
  modelType: NonMMMModelType;
  performanceMetrics: {
    mape: number;
    rmse: number;
    mae: number;
    aic: number;
    bic: number;
  };
  trainingInfo: {
    trainingRows: number;
    validationRows: number;
    trainingTime: number;
    lastUpdated: string;
  };
}

export interface NonMMMModelTrainingRequest {
  filename: string;
  targetVariable: string;
  independentVariables: string[];
  modelType: string;
  modelParameters?: Record<string, unknown>;
  validationSplit?: number;
}

export interface NonMMMModelTrainingResponse {
  success: boolean;
  data?: NonMMMModelResult;
  error?: string;
}

export interface NonMMMModelDeletionRequest {
  modelId: string;
  filename: string;
}

export interface NonMMMModelDeletionResponse {
  success: boolean;
  data?: {
    deletedModelId: string;
    remainingModels: number;
  };
  error?: string;
}

export interface NonMMMModelListResponse {
  success: boolean;
  data?: {
    models: NonMMMModelResult[];
    totalModels: number;
    bestModel?: NonMMMModelResult;
  };
  error?: string;
}

export class NonMMMModelingService {
  private static readonly AVAILABLE_MODELS: NonMMMModelType[] = [
    {
      id: 'linear',
      name: 'Linear Regression',
      description: 'Standard linear regression model (y = β₀ + β₁x₁ + ... + βₙxₙ)'
    },
    {
      id: 'log-linear',
      name: 'Log-Linear Model',
      description: 'Log transformation on target variable (ln(y) = β₀ + β₁x₁ + ... + βₙxₙ)'
    },
    {
      id: 'log-log',
      name: 'Log-Log Model',
      description: 'Log transformation on both sides (ln(y) = β₀ + β₁ln(x₁) + ... + βₙln(xₙ))'
    },
    {
      id: 'ridge',
      name: 'Ridge Regression',
      description: 'Regularized linear regression with L2 penalty to reduce overfitting'
    },
    {
      id: 'bayesian',
      name: 'Bayesian Regression',
      description: 'Probabilistic model with uncertainty estimates and prior distributions'
    }
  ];

  /**
   * Get available model types
   */
  static getAvailableModels(): NonMMMModelType[] {
    return [...this.AVAILABLE_MODELS];
  }

  /**
   * Train a new model using the Python backend
   */
  static async trainModel(
    request: NonMMMModelTrainingRequest
  ): Promise<NonMMMModelTrainingResponse> {
    try {
      const response = await httpClient.post('/nonmmm/train-model', request);
      
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data
        };
      } else {
        return {
          success: false,
          error: response.error || 'Model training failed'
        };
      }
    } catch (error) {
      console.error('Error training model:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to train model'
      };
    }
  }

  /**
   * Delete a model using the Python backend
   */
  static async deleteModel(
    request: NonMMMModelDeletionRequest
  ): Promise<NonMMMModelDeletionResponse> {
    try {
      const response = await httpClient.delete(
        `/api/nonmmm/delete-model/${request.filename}/${request.modelId}`
      );
      
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data
        };
      } else {
        return {
          success: false,
          error: response.error || 'Model deletion failed'
        };
      }
    } catch (error) {
      console.error('Error deleting model:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete model'
      };
    }
  }

  /**
   * Get list of all models for a file using the Python backend
   */
  static async getModelList(filename: string): Promise<NonMMMModelListResponse> {
    try {
      const response = await httpClient.get(`/nonmmm/list-models/${filename}`);
      
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data
        };
      } else {
        return {
          success: false,
          error: response.error || 'Failed to fetch model list'
        };
      }
    } catch (error) {
      console.error('Error fetching model list:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch model list'
      };
    }
  }

  /**
   * Get model quality assessment
   */
  static getModelQuality(rSquared: number): { label: string; level: 'high' | 'medium' | 'low' } {
    if (rSquared > 0.8) return { label: 'Excellent', level: 'high' };
    if (rSquared > 0.6) return { label: 'Good', level: 'medium' };
    return { label: 'Fair', level: 'low' };
  }

  /**
   * Get significance level based on p-value
   */
  static getSignificanceLevel(pValue: number): 'high' | 'medium' | 'low' {
    if (pValue < 0.01) return 'high';
    if (pValue < 0.05) return 'medium';
    return 'low';
  }

  /**
   * Get VIF level assessment
   */
  static getVIFLevel(vif: number): 'good' | 'acceptable' | 'poor' {
    if (vif < 2) return 'good';
    if (vif < 5) return 'acceptable';
    return 'poor';
  }

  /**
   * Validate model training request
   */
  static validateTrainingRequest(request: NonMMMModelTrainingRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.filename) {
      errors.push('Filename is required');
    }

    if (!request.targetVariable) {
      errors.push('Target variable is required');
    }

    if (!request.independentVariables || request.independentVariables.length === 0) {
      errors.push('At least one independent variable is required');
    }

    if (!request.modelType) {
      errors.push('Model type is required');
    }

    const validModelTypes = this.AVAILABLE_MODELS.map(m => m.id);
    if (!validModelTypes.includes(request.modelType)) {
      errors.push(`Invalid model type. Must be one of: ${validModelTypes.join(', ')}`);
    }

    if (request.validationSplit !== undefined && (request.validationSplit <= 0 || request.validationSplit >= 1)) {
      errors.push('Validation split must be between 0 and 1');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get model type information by ID
   */
  static getModelTypeInfo(modelTypeId: string): NonMMMModelType | null {
    return this.AVAILABLE_MODELS.find(model => model.id === modelTypeId) || null;
  }

  /**
   * Format model performance metrics for display
   */
  static formatPerformanceMetrics(metrics: NonMMMModelResult['performanceMetrics']) {
    return {
      mape: `${metrics.mape.toFixed(2)}%`,
      rmse: metrics.rmse.toFixed(4),
      mae: metrics.mae.toFixed(4),
      aic: metrics.aic > 0 ? metrics.aic.toFixed(2) : 'N/A',
      bic: metrics.bic > 0 ? metrics.bic.toFixed(2) : 'N/A'
    };
  }

  /**
   * Get variable significance status
   */
  static getVariableSignificance(pValue: number): { significant: boolean; level: string } {
    const significant = pValue < 0.05;
    let level = 'Not Significant';
    
    if (pValue < 0.001) level = 'Highly Significant';
    else if (pValue < 0.01) level = 'Very Significant';
    else if (pValue < 0.05) level = 'Significant';
    
    return { significant, level };
  }

  /**
   * Calculate model complexity score
   */
  static calculateModelComplexity(variables: NonMMMModelVariable[]): number {
    // Simple complexity score based on number of variables and their significance
    const totalVariables = variables.length;
    const significantVariables = variables.filter(v => (v.pValue || 0) < 0.05).length;
    
    return (significantVariables / totalVariables) * 100;
  }
}
