/**
 * ========================================
 * ENHANCED EXPORT SERVICE
 * ========================================
 * 
 * Purpose: Comprehensive data export system with multiple format support
 * 
 * Description:
 * This service provides a flexible, strategy-pattern-based export system that
 * supports multiple output formats for analytics data, model results, and
 * complete analysis reports. It enables users to export their work in various
 * formats suitable for different use cases and stakeholder requirements.
 * 
 * Key Functionality:
 * - Strategy pattern implementation for multiple export formats
 * - Support for CSV, JSON, and Excel export formats
 * - Comprehensive data export including scenarios, models, and complete reports
 * - Backward compatibility with legacy export methods
 * - Automatic filename generation with timestamps
 * - Format-specific optimization and data structuring
 * 
 * Export Capabilities:
 * - Scenario data export for business planning
 * - Model results export for technical analysis
 * - Complete analysis reports for comprehensive documentation
 * - Raw analysis data export for further processing
 * - Format selection with detailed descriptions
 * 
 * Export Formats:
 * - CSV: Spreadsheet-compatible tabular data
 * - JSON: Structured data for technical use and APIs
 * - Excel: Formatted workbooks with multiple sheets (future)
 * 
 * Dependencies:
 * - analysis.ts types for data structure definitions
 * 
 * Used by:
 * - OptimizerStep for scenario export
 * - ModelResultsStep for model data export
 * - Complete workflow for comprehensive reporting
 * - Dashboard components for data download
 * 
 * Last Updated: 2024-12-20
 * Author: BrandBloom Frontend Team
 */

import { ModelResult, ScenarioInput, AnalysisData, AppState } from '@/types/analysis';

interface ExportStrategy {
  export(data: any, filename: string): void;
}

class CSVExportStrategy implements ExportStrategy {
  export(data: any[], filename: string): void {
    const csvContent = this.convertToCSV(data);
    this.downloadFile(csvContent, filename, 'text/csv');
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      )
    ];
    
    return csvRows.join('\n');
  }

  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

class JSONExportStrategy implements ExportStrategy {
  export(data: any, filename: string): void {
    const jsonContent = JSON.stringify(data, null, 2);
    this.downloadFile(jsonContent, filename, 'application/json');
  }

  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

export type ExportFormat = 'csv' | 'json' | 'excel';

export class ExportService {
  private static strategies: Record<ExportFormat, ExportStrategy> = {
    csv: new CSVExportStrategy(),
    json: new JSONExportStrategy(),
    excel: new CSVExportStrategy(), // Fallback to CSV for now
  };

  static exportData(data: any, format: ExportFormat, filename: string): void {
    const strategy = this.strategies[format];
    if (!strategy) {
      throw new Error(`Export format '${format}' not supported`);
    }
    strategy.export(data, filename);
  }

  // Legacy methods for backward compatibility
  static exportToCsv(data: any[], filename: string) {
    this.exportData(data, 'csv', filename);
  }

  static exportModelResults(modelResult: any, optimizerData?: any[]) {
    const modelData = {
      summary: {
        rSquared: modelResult.rSquared,
        adjustedRSquared: modelResult.adjustedRSquared,
        intercept: modelResult.intercept,
        modelType: modelResult.modelType
      },
      variables: modelResult.variables.map((v: any) => ({
        name: v.name,
        coefficient: v.coefficient,
        pValue: v.pValue,
        elasticity: v.elasticity,
        vif: v.vif
      }))
    };

    if (optimizerData) {
      (modelData as any).optimization = optimizerData;
    }

    this.exportData(modelData, 'json', 'mmm_analysis_results.json');
  }

  // New modular export methods
  static exportScenarios(scenarios: ScenarioInput[], format: ExportFormat = 'csv'): void {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `scenarios_${timestamp}.${format}`;
    this.exportData(scenarios, format, filename);
  }

  static exportAnalysisData(analysisData: AnalysisData, format: ExportFormat = 'csv'): void {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `analysis_data_${timestamp}.${format}`;
    
    // Convert columns to tabular format for export
    const tabularData = this.convertColumnsToRows(analysisData.columns);
    this.exportData(tabularData, format, filename);
  }

  static exportCompleteReport(state: AppState, format: ExportFormat = 'json'): void {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `complete_analysis_${timestamp}.${format}`;
    
    const report = {
      metadata: {
        exportDate: new Date().toISOString(),
        userType: state.userType,
        analysisType: state.analysisType,
        analysisMode: state.analysisMode,
        selectedBrand: state.selectedBrand,
      },
      dataInfo: state.analysisData ? {
        filename: state.analysisData.filename,
        rowCount: state.analysisData.rowCount,
        columnCount: state.analysisData.columns.length,
        uploadedAt: state.analysisData.uploadedAt,
      } : null,
      modelResults: state.modelResult,
      scenarios: state.scenarioInputs,
      filterColumns: state.filterColumns,
    };
    
    this.exportData(report, format, filename);
  }

  private static convertColumnsToRows(columns: any[]): any[] {
    if (columns.length === 0) return [];
    
    const maxLength = Math.max(...columns.map(col => col.values.length));
    const rows: any[] = [];
    
    for (let i = 0; i < maxLength; i++) {
      const row: any = {};
      columns.forEach(col => {
        row[col.name] = col.values[i] || null;
      });
      rows.push(row);
    }
    
    return rows;
  }

  static getSupportedFormats(): ExportFormat[] {
    return Object.keys(this.strategies) as ExportFormat[];
  }

  static getFormatDescription(format: ExportFormat): string {
    const descriptions: Record<ExportFormat, string> = {
      csv: 'Comma-separated values - Compatible with Excel and other spreadsheet applications',
      json: 'JavaScript Object Notation - Structured data format for technical use',
      excel: 'Microsoft Excel format - Native Excel file with formatting',
    };
    return descriptions[format] || 'Unknown format';
  }
}

// Create singleton instance
export const exportService = new ExportService();
export default exportService;