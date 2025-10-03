/**
 * ========================================
 * MOCK DATA PROCESSOR
 * ========================================
 * 
 * Purpose: Generate realistic demonstration data for analytics workflow testing
 * 
 * Description:
 * This processor generates comprehensive mock data that simulates real marketing
 * analytics datasets. It creates realistic data patterns for Marketing Mix
 * Modeling (MMM) including seasonal trends, spending patterns, and brand data.
 * The generated data maintains statistical properties typical of real marketing data.
 * 
 * Key Functionality:
 * - Generate realistic marketing analytics data with seasonal patterns
 * - Create correlated spending and revenue data for MMM analysis
 * - Simulate multiple marketing channels (TV, Digital, Print, Radio)
 * - Include temporal patterns and seasonality factors
 * - Generate categorical brand data for segmentation analysis
 * - Provide consistent data structure for testing and demonstration
 * 
 * Generated Data Structure:
 * - Date: Weekly time series data for temporal analysis
 * - Revenue: Dependent variable with seasonal and random variation
 * - Marketing Channels: TV, Digital, Print, Radio spending data
 * - Seasonality: Mathematical seasonality factor for trend analysis
 * - Brand: Categorical data for brand segmentation
 * 
 * Dependencies:
 * - BaseDataProcessor for common functionality
 * - appConstants.ts for data generation parameters
 * - analysis.ts types for data structure
 * 
 * Used by:
 * - DataProcessor service as default demonstration data
 * - Development and testing environments
 * - User onboarding and tutorial flows
 * 
 * Last Updated: 2024-12-20
 * Author: BrandBloom Frontend Team
 */

import { AnalysisData, DataColumn } from '@/types/analysis';
import { BaseDataProcessor } from './baseDataProcessor';
import { APP_CONFIG } from '@/constants/appConstants';

export class MockDataProcessor extends BaseDataProcessor {
  /**
   * Generates mock data for demonstration purposes
   */
  async processData(file: File): Promise<AnalysisData> {
    return this.generateMockData(file.name);
  }

  validateData(data: any): { isValid: boolean; errors: string[] } {
    // Mock data is always valid
    return { isValid: true, errors: [] };
  }

  generateMockData(filename: string): AnalysisData {
    const mockColumns: DataColumn[] = [
      this.createDateColumn(),
      this.createRevenueColumn(),
      this.createSpendColumn('TV_Spend', 50000, 10000),
      this.createSpendColumn('Digital_Spend', 30000, 5000),
      this.createSpendColumn('Print_Spend', 20000, 2000),
      this.createSpendColumn('Radio_Spend', 15000, 3000),
      this.createSeasonalityColumn(),
      this.createBrandColumn(),
    ];

    return {
      filename,
      columns: mockColumns,
      rowCount: APP_CONFIG.MOCK_DATA_ROWS,
      uploadedAt: new Date(),
    };
  }

  private createDateColumn(): DataColumn {
    const values = Array.from({ length: APP_CONFIG.MOCK_DATA_ROWS }, (_, i) => {
      const weekNumber = i + 1;
      const year = 2022 + Math.floor(weekNumber / 53);
      const week = weekNumber % 53 || 53;
      return `${year}-W${String(week).padStart(2, '0')}`;
    });

    return {
      name: 'Date',
      type: 'date',
      values,
    };
  }

  private createRevenueColumn(): DataColumn {
    const baseRevenue = 750000;
    const variation = 150000;
    const values = Array.from({ length: APP_CONFIG.MOCK_DATA_ROWS }, (_, i) => {
      // Add seasonality and random variation
      const seasonality = Math.sin((i / 52) * 2 * Math.PI) * 0.1 + 1;
      const randomFactor = 0.8 + Math.random() * 0.4; // 80% to 120%
      return Math.floor(baseRevenue * seasonality * randomFactor);
    });

    return {
      name: 'Revenue',
      type: 'numeric',
      values,
      statistics: this.calculateStatistics(values),
    };
  }

  private createSpendColumn(name: string, maxSpend: number, minSpend: number): DataColumn {
    const values = Array.from({ length: APP_CONFIG.MOCK_DATA_ROWS }, () => 
      Math.floor(Math.random() * (maxSpend - minSpend) + minSpend)
    );

    return {
      name,
      type: 'numeric',
      values,
      statistics: this.calculateStatistics(values),
    };
  }

  private createSeasonalityColumn(): DataColumn {
    const values = Array.from({ length: APP_CONFIG.MOCK_DATA_ROWS }, (_, i) => 
      Math.sin((i / 52) * 2 * Math.PI) * 0.2 + 1
    );

    return {
      name: 'Seasonality',
      type: 'numeric',
      values,
      statistics: this.calculateStatistics(values),
    };
  }

  private createBrandColumn(): DataColumn {
    const brands = ['Brand_A', 'Brand_B', 'Brand_C'];
    const values = Array.from({ length: APP_CONFIG.MOCK_DATA_ROWS }, () => 
      brands[Math.floor(Math.random() * brands.length)]
    );

    return {
      name: 'Brand',
      type: 'categorical',
      values,
      statistics: this.calculateCategoricalStatistics(values),
    };
  }
}