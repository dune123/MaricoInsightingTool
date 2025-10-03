/**
 * ========================================
 * MODEL SERVICE - MOCK MODEL RESULTS GENERATION
 * ========================================
 * 
 * Purpose: Generate realistic mock model results for development and testing
 * 
 * Description:
 * This service provides mock model result generation for the media mix modeling
 * workflow. It creates realistic statistical results for different model types
 * to enable frontend development and testing without requiring actual model
 * training infrastructure.
 * 
 * Key Functionality:
 * - Generate mock model results for different regression types
 * - Create realistic variable coefficients and statistical metrics
 * - Simulate model performance indicators (R², MAPE, etc.)
 * - Provide variable-specific statistics (p-values, VIF, elasticity)
 * - Support multiple model types with appropriate result variations
 * 
 * Model Types Supported:
 * - Linear: Basic linear regression with standard coefficients
 * - Log-Linear: Log transformation on target variable
 * - Log-Log: Log transformation on both predictors and target
 * - Ridge: Regularized regression with penalized coefficients
 * - Bayesian: Probabilistic model with uncertainty estimates
 * 
 * Generated Metrics:
 * - Model Performance: R², Adjusted R², MAPE, RMSE, AIC/BIC
 * - Variable Statistics: Coefficients, p-values, elasticity, VIF
 * - Statistical Significance: Realistic p-value distributions
 * - Model Quality: Performance indicators within expected ranges
 * 
 * Mock Data Characteristics:
 * - Realistic coefficient ranges based on model type
 * - Statistically plausible p-value distributions
 * - Variable elasticity values appropriate for marketing data
 * - VIF scores indicating reasonable multicollinearity levels
 * 
 * Used by:
 * - ModelBuildingStep for result generation
 * - ModelResultsStep for result display
 * - Development and testing workflows
 * 
 * Dependencies:
 * - ModelVariable and ModelResult types
 * - Math.random() for realistic value generation
 * 
 * Note:
 * This is a mock service for development. In production, this would
 * integrate with actual model training backend services.
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Frontend Team
 */

import { ModelVariable, ModelResult } from '@/types/analysis';

export class ModelService {
  static generateMockResults(
    selectedVariables: string[], 
    modelType: 'linear' | 'log-linear' | 'log-log' | 'ridge' | 'bayesian'
  ): ModelResult {
    const variables: ModelVariable[] = selectedVariables.map(name => ({
      name,
      expectedSign: 'positive',
      included: true,
      coefficient: Math.random() * 2 + 0.5,
      pValue: Math.random() * 0.05,
      elasticity: Math.random() * 0.3 + 0.1,
      vif: Math.random() * 3 + 1
    }));

    return {
      rSquared: 0.78 + Math.random() * 0.15,
      adjustedRSquared: 0.74 + Math.random() * 0.15,
      intercept: 50000 + Math.random() * 20000,
      variables,
      modelType
    };
  }

  static getModelQuality(rSquared: number) {
    if (rSquared > 0.8) return { label: 'Excellent', level: 'high' };
    if (rSquared > 0.6) return { label: 'Good', level: 'medium' };
    return { label: 'Fair', level: 'low' };
  }

  static getSignificanceLevel(pValue: number): 'high' | 'medium' | 'low' {
    if (pValue < 0.01) return 'high';
    if (pValue < 0.05) return 'medium';
    return 'low';
  }

  static getVIFLevel(vif: number): 'good' | 'acceptable' | 'poor' {
    if (vif < 2) return 'good';
    if (vif < 5) return 'acceptable';
    return 'poor';
  }

  static calculateOptimizedSpend(
    variables: ModelVariable[], 
    p6mValues: Record<string, number>
  ): Record<string, number> {
    // Simple optimization: increase spend on highest elasticity variables
    const sortedVariables = [...variables].sort((a, b) => (b.elasticity || 0) - (a.elasticity || 0));
    
    const optimized: Record<string, number> = {};
    
    sortedVariables.forEach((variable, index) => {
      const p6mValue = p6mValues[variable.name] || 0;
      if (index < 2) {
        // Increase top 2 variables by 20%
        optimized[variable.name] = p6mValue * 1.2;
      } else {
        // Decrease others by 10%
        optimized[variable.name] = p6mValue * 0.9;
      }
    });

    return optimized;
  }
}

// Create singleton instance
export const modelService = new ModelService();
export default modelService;