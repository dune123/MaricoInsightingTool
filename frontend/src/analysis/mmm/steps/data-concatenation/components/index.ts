/**
 * ========================================
 * COMPONENTS INDEX - DATA CONCATENATION MODULE
 * ========================================
 * 
 * Purpose: Barrel export for all modular components
 * 
 * Description:
 * Centralized export point for all modular components used in the data concatenation
 * module. This provides a clean import interface for the main step component.
 * 
 * Last Updated: 2024-12-23
 * Author: BrandBloom Frontend Team
 */

// Status and feedback components
export { DataLoadingStatus } from './DataLoadingStatus';
export { ProcessingSummary } from './ProcessingSummary';

// Re-export existing concatenation components for consistency
export { ColumnCategorization } from '../../ColumnCategorization';
export { DataPreviewTable } from '../../DataPreviewTable';
export { ProcessingStatus } from '../../ProcessingStatus';
export { BrandCategorization } from '../../BrandCategorization';
