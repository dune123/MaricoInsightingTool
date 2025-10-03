/**
 * ========================================
 * NON-MMM SERVICES INDEX
 * ========================================
 * 
 * Purpose: Central export point for all Non-MMM analysis services
 * 
 * Description:
 * This file provides a centralized way to import all Non-MMM services,
 * making it easier for components to access the services they need
 * without having to know the exact file paths.
 * 
 * Services Exported:
 * - NonMMMFileService: File upload and Excel processing
 * - NonMMMDataSummaryService: Data summary and statistics
 * - NonMMMChartAnalysisService: Chart generation and trendline analysis
 * - NonMMMModelingService: Statistical modeling and results
 * - NonMMMStateService: State persistence and management
 * 
 * Usage:
 * import { NonMMMFileService, NonMMMDataSummaryService } from '@/analysis/nonmmm/services';
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Frontend Team
 */

export { NonMMMFileService } from './NonMMMFileService';
export { NonMMMDataSummaryService } from './NonMMMDataSummaryService';
export { NonMMMChartAnalysisService } from './NonMMMChartAnalysisService';
export { NonMMMModelingService } from './NonMMMModelingService';
export { NonMMMStateService } from './NonMMMStateService';

// Export types for external use
export type {
  NonMMMFileData,
  NonMMMSheetInfo,
  NonMMMFileUploadResponse,
  NonMMMSheetsResponse
} from './NonMMMFileService';

export type {
  NonMMMDataRow,
  NonMMMColumnStatistics,
  NonMMMDataSummary,
  NonMMMDataSummaryResponse,
  NonMMMColumnStatsResponse,
  NonMMMColumnTypeModification,
  NonMMMColumnModificationResponse,
  NonMMMHistogramData,
  NonMMMHistogramResponse
} from './NonMMMDataSummaryService';

export type {
  NonMMMTrendlineType,
  NonMMMChartData,
  NonMMMTrendlineData,
  NonMMMChartContainer,
  NonMMMExpectedSignsMap,
  NonMMMChartAnalysisRequest,
  NonMMMChartAnalysisResponse,
  NonMMMNewChartRequest
} from './NonMMMChartAnalysisService';

export type {
  NonMMMModelType,
  NonMMMModelVariable,
  NonMMMModelResult,
  NonMMMModelTrainingRequest,
  NonMMMModelTrainingResponse,
  NonMMMModelDeletionRequest,
  NonMMMModelDeletionResponse,
  NonMMMModelListResponse
} from './NonMMMModelingService';
