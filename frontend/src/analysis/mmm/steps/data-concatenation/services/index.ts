/**
 * ========================================
 * SERVICES INDEX - DATA CONCATENATION MODULE
 * ========================================
 * 
 * Purpose: Barrel export for all service functions
 * 
 * Description:
 * Centralized export point for all service functions used in the data concatenation
 * module. This provides a clean import interface for consuming components.
 * 
 * Last Updated: 2024-12-23
 * Author: BrandBloom Frontend Team
 */

// Data loading services
export {
  fetchConcatenatedFiles,
  loadDataFromFile,
  loadLatestBrandData,
  validateDataLoadingResult,
  retryDataLoading
} from './dataLoader';

// State management services
export {
  saveConcatenationState,
  loadConcatenationState,
  createConcatenationState,
  updateConcatenationState,
  deleteConcatenationState,
  validateConcatenationState,
  getStateSummary
} from './stateManager';
