/**
 * MMM Analysis Services Index
 * 
 * Purpose: Centralized export point for all MMM analysis services
 * 
 * Description: This file serves as the main entry point for importing
 * MMM analysis services. It consolidates all service exports into a
 * single location for easier imports and better maintainability.
 * 
 * Key Functions:
 * - Centralized service exports
 * - Service dependency management
 * - Import path resolution
 * 
 * Dependencies:
 * - All MMM analysis services
 * - Shared types from @/types/analysis
 * 
 * Last Updated: 2025-01-27
 * Author: BrandBloom Frontend Team
 * 
 * Recent Fixes:
 * - Removed debug logging to prevent console pollution on app startup
 */

// Core MMM services that actually exist
export { brandAnalysisService } from './brandAnalysisService';

// Expected signs service
export { 
  calculateExpectedSigns, 
  getExpectedSignClasses
} from './expectedSigns';
export type { ExpectedSignsMap } from './expectedSigns';

// Brand extractor service
export { createBrandMetadata, categorizeBrands } from './brandExtractor';

// Wizard manager service
export { WizardManager, wizardManager } from './wizardManager';

// Data processing services
export { DataProcessor as dataProcessor } from './dataProcessor';
export { FileService as fileService } from './fileService';
export { ExcelService as excelService } from './excelService';
export { DataSummaryService as dataSummaryService } from './dataSummaryService';
export { metadataService } from './metadataService';
export { FilterService as filterService } from './filterService';
export { ModelService as modelService } from './modelService';
export { ExportService as exportService } from './exportService';
export { ValidationService as validationService } from './validationService';
export { PackSizeService as packSizeService } from './packSizeService';
export { RPIAdditionService as rpiAdditionService } from './rpiAdditionService';
export { initializationService } from './initializationService';

// Shared types
export type { BrandCategories } from '@/types/analysis';
