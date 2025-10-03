/**
 * ========================================
 * FILE HELPERS - DATA CONCATENATION MODULE
 * ========================================
 * 
 * Purpose: File operation utility functions
 * 
 * Description:
 * Pure utility functions for file name manipulation, validation, and processing
 * used throughout the data concatenation step.
 * 
 * Last Updated: 2024-12-23
 * Author: BrandBloom Frontend Team
 */

/**
 * Generate concatenated filename from original filename
 */
export function generateConcatenatedFilename(originalFilename: string): string {
  return originalFilename.replace(/\.[^/.]+$/, "_concatenated.xlsx");
}

/**
 * Extract original filename from concatenated filename
 */
export function extractOriginalFilename(concatenatedFilename: string): string {
  return concatenatedFilename.replace(/_\d+_concatenated\.xlsx$/, '.xlsx');
}

/**
 * Extract timestamp from filename
 */
export function extractTimestamp(filename: string): string | null {
  const match = filename.match(/_(\d+)_concatenated/);
  return match ? match[1] : null;
}

/**
 * Sort files by timestamp (newest first)
 */
export function sortFilesByTimestamp(filenames: string[]): string[] {
  return filenames.sort((a: string, b: string) => {
    const timestampA = extractTimestamp(a) || '0';
    const timestampB = extractTimestamp(b) || '0';
    return parseInt(timestampB) - parseInt(timestampA);
  });
}

/**
 * Filter files by brand name
 */
export function filterFilesByBrand(filenames: string[], brandName: string): string[] {
  return filenames.filter(filename => 
    filename.toLowerCase().includes(brandName.toLowerCase()) && 
    filename.toLowerCase().includes('concatenated')
  );
}

/**
 * Validate filename format
 */
export function isValidFilename(filename: string): boolean {
  const validExtensions = ['.xlsx', '.csv'];
  return validExtensions.some(ext => filename.toLowerCase().endsWith(ext));
}

/**
 * Get file extension
 */
export function getFileExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex !== -1 ? filename.substring(lastDotIndex) : '';
}

/**
 * Get base filename without extension
 */
export function getBaseFilename(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex !== -1 ? filename.substring(0, lastDotIndex) : filename;
}

/**
 * Check if file is concatenated based on filename
 */
export function isConcatenatedFile(filename: string): boolean {
  return filename.toLowerCase().includes('concatenated');
}

/**
 * Generate unique filename with timestamp
 */
export function generateUniqueFilename(baseFilename: string, extension: string = '.xlsx'): string {
  const timestamp = Date.now();
  const baseName = getBaseFilename(baseFilename);
  return `${baseName}_${timestamp}${extension}`;
}
