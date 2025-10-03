import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export interface FileParseResult {
  columns: string[];
  rowCount?: number;
  fileType: string;
}

export class FileParser {
  static async extractColumns(file: File): Promise<FileParseResult> {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    try {
      switch (fileExtension) {
        case 'csv':
          return await this.parseCSV(file);
        case 'xlsx':
        case 'xls':
          return await this.parseExcel(file);
        case 'txt':
          return await this.parseTextFile(file);
        default:
          return {
            columns: [],
            fileType: fileExtension || 'unknown'
          };
      }
    } catch (error) {
      console.error('Error parsing file:', error);
      return {
        columns: [],
        fileType: fileExtension || 'unknown'
      };
    }
  }

  private static async parseCSV(file: File): Promise<FileParseResult> {
    return new Promise((resolve) => {
      Papa.parse(file, {
        header: true,
        preview: 5, // Read a few more rows to ensure we get headers properly
        complete: (results) => {
          console.log('Papa parse results:', results); // Debug log
          const columns = results.meta.fields || [];
          console.log('Extracted columns:', columns); // Debug log
          resolve({
            columns: columns.filter(col => col && col.trim() !== ''),
            rowCount: results.data.length,
            fileType: 'csv'
          });
        },
        error: () => {
          console.error('Papa parse error');
          resolve({
            columns: [],
            fileType: 'csv'
          });
        }
      });
    });
  }

  private static async parseExcel(file: File): Promise<FileParseResult> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get first worksheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert to JSON to get headers
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length > 0) {
            const headers = (jsonData[0] as any[])
              .map(header => String(header).trim())
              .filter(header => header !== '');
            
            resolve({
              columns: headers,
              rowCount: jsonData.length - 1, // Subtract header row
              fileType: 'excel'
            });
          } else {
            resolve({
              columns: [],
              fileType: 'excel'
            });
          }
        } catch (error) {
          console.error('Excel parsing error:', error);
          resolve({
            columns: [],
            fileType: 'excel'
          });
        }
      };
      
      reader.onerror = () => {
        resolve({
          columns: [],
          fileType: 'excel'
        });
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  private static async parseTextFile(file: File): Promise<FileParseResult> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n');
          
          if (lines.length > 0) {
            // Try to detect delimiter and parse first line
            const firstLine = lines[0].trim();
            let columns: string[] = [];
            
            // Try common delimiters
            if (firstLine.includes('\t')) {
              columns = firstLine.split('\t');
            } else if (firstLine.includes(',')) {
              columns = firstLine.split(',');
            } else if (firstLine.includes(';')) {
              columns = firstLine.split(';');
            } else if (firstLine.includes('|')) {
              columns = firstLine.split('|');
            } else {
              // If no delimiter found, treat as single column
              columns = [firstLine];
            }
            
            resolve({
              columns: columns
                .map(col => col.trim().replace(/['"]/g, ''))
                .filter(col => col !== ''),
              rowCount: lines.length - 1,
              fileType: 'text'
            });
          } else {
            resolve({
              columns: [],
              fileType: 'text'
            });
          }
        } catch (error) {
          console.error('Text file parsing error:', error);
          resolve({
            columns: [],
            fileType: 'text'
          });
        }
      };
      
      reader.onerror = () => {
        resolve({
          columns: [],
          fileType: 'text'
        });
      };
      
      reader.readAsText(file);
    });
  }
}