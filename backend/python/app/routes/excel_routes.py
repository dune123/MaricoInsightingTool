"""
========================================
BRANDBLOOM INSIGHTS - EXCEL ROUTES
========================================

Purpose: Excel processing, concatenation, and column modification API endpoints for advanced data manipulation

Description:
This module provides specialized Excel processing endpoints for the BrandBloom
Insights application. It handles sheet concatenation, column modification,
data quality enhancement, and Excel-specific operations. The routes implement
advanced Excel processing algorithms for multi-sheet data integration and
business logic-based column enhancement.

Key Functions:
- concatenate_sheets(request): Multi-sheet Excel concatenation endpoint
  - Implements step-by-step column alignment algorithm
  - Preserves first sheet structure as base template
  - Handles missing columns with NaN values
  - Adds new columns dynamically as needed
  - Maintains Source_Sheet tracking for row origin
  - Returns comprehensive concatenation results
- modify_excel_columns(filename, request, brand): Column modification endpoint
  - Adds business-relevant columns based on sheet naming conventions
  - Implements intelligent column inference from sheet names
  - Applies data quality filtering (removes columns with <18 valid records)
  - Supports brand-specific file processing
  - Returns modification results and statistics
- get_excel_sheets(filename): Alternative sheet information endpoint
  - Provides Excel sheet metadata and column information
  - Generates realistic mock data for development/testing
  - Handles URL-encoded filenames
  - Returns comprehensive sheet information

Concatenation Algorithm Details:
1. First sheet becomes base structure (preserves all columns and rows)
2. For each subsequent sheet:
   - Appends rows below existing data
   - If column doesn't exist in new sheet → leaves empty (NaN)
   - If new column in new sheet → adds column to result and fills previous data with NaN
3. Maintains Source_Sheet column to track origin of each row
4. Preserves data integrity and structure consistency

Column Modification Business Logic:
- NTW sheets: region="NTW", channel="GT+MT"
- MT sheets: region="NTW", channel="MT"
- GT sheets: region="NTW", channel="GT"
- Other sheets: first word is region, rest is packsize, channel="GT"
- Data quality: removes columns with <18 valid data records

API Endpoints:
- POST /api/concatenate-sheets: Concatenate selected Excel sheets
  - Accepts: ConcatenationRequest with file and sheet information
  - Returns: ConcatenationResponse with concatenation results
  - Purpose: Multi-sheet data integration with column alignment
- POST /api/files/{filename}/modify-columns: Modify Excel columns
  - Accepts: filename (path), ColumnModificationRequest, brand (query parameter)
  - Returns: ColumnModificationResponse with modification results
  - Purpose: Business logic-based column enhancement and data quality improvement
- GET /api/sheets/{filename}: Alternative sheet information endpoint
  - Accepts: filename (path)
  - Returns: Dict with comprehensive sheet information
  - Purpose: Excel sheet metadata extraction and analysis

Data Processing Features:
- Multi-sheet Excel concatenation with intelligent column handling
- Business rule-based column modification and enhancement
- Data quality filtering and validation
- Source tracking and metadata preservation
- Brand-specific file processing support
- Comprehensive error handling and validation

Excel Processing Benefits:
- Consistent data structure across multiple sheets
- Intelligent column inference and addition
- Data quality improvement and validation
- Scalable multi-sheet processing
- Business logic integration
- Comprehensive result reporting

Error Handling:
- Comprehensive HTTP status code usage
- Detailed error messages for debugging
- File not found handling
- Validation error reporting
- Graceful error recovery

Dependencies:
- FastAPI: For routing, request handling, and HTTP responses
- ExcelService: For Excel processing and business logic
- app.models.data_models: For request/response models
- urllib.parse: For URL decoding of filenames
- datetime: For timestamp generation

Used by:
- Data concatenation workflows: For multi-sheet data integration
- Excel file enhancement processes: For column modification and quality improvement
- Sheet processing operations: For metadata extraction and analysis
- Column modification features: For business logic-based enhancements
- Data quality improvement: For filtering and validation

Processing Flow:
1. File validation and sheet selection
2. Sheet concatenation with column alignment
3. Column modification based on business rules
4. Data quality filtering and validation
5. Result generation and metadata preservation
6. Response formatting and error handling

Business Intelligence Features:
- Automatic region and channel detection from sheet names
- Pack size extraction and categorization
- Data quality metrics and filtering
- Source tracking and audit trails
- Comprehensive result reporting

Last Updated: 2024-12-23
Author: BrandBloom Backend Team
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import urllib.parse

from app.services.excel_service import ExcelService
from app.models.data_models import (
    ConcatenationRequest, 
    ConcatenationResponse, 
    ColumnModificationRequest,
    ColumnModificationResponse
)

router = APIRouter()

@router.post("/api/concatenate-sheets", response_model=ConcatenationResponse)
async def concatenate_sheets(request: ConcatenationRequest) -> ConcatenationResponse:
    """
    Concatenate selected sheets from an Excel workbook using step-by-step column alignment
    
    Algorithm:
    1. Takes first sheet as base structure (preserves all columns and rows)
    2. For each subsequent sheet:
       - Appends rows below existing data
       - If column doesn't exist in new sheet -> leaves empty (NaN)
       - If new column in new sheet -> adds column to result and fills previous data with NaN
    3. Maintains Source_Sheet column to track origin of each row
    
    Args:
        request: ConcatenationRequest with file and sheet information
        
    Returns:
        ConcatenationResponse with concatenation results
        
    Raises:
        HTTPException: If concatenation fails
    """
    try:
        result = ExcelService.concatenate_sheets(
            request.originalFileName,
            request.selectedSheets,
            request.customFileName,
            request.ourBrand
        )
        
        return ConcatenationResponse(**result)
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Concatenation failed: {str(e)}")

@router.post("/api/files/{filename}/modify-columns", response_model=ColumnModificationResponse)
async def modify_excel_columns(filename: str, request: ColumnModificationRequest, brand: str = None) -> ColumnModificationResponse:
    """
    Modify Excel file by adding or updating packsize, region, and channel columns to selected sheets only.
    
    This endpoint processes selected Excel sheets to add business-relevant columns based on sheet naming conventions:
    - NTW sheets: region="NTW", channel="GT+MT"
    - MT sheets: region="NTW", channel="MT" 
    - GT sheets: region="NTW", channel="GT"
    - Other sheets: first word is region, rest is packsize, channel="GT"
    
    Additionally applies data quality filtering by removing columns with <18 valid data records.
    
    Args:
        filename: Name of the Excel file in raw directory
        request: ColumnModificationRequest containing selectedSheets array
        
    Returns:
        ColumnModificationResponse with modification results
        
    Raises:
        HTTPException: If modification fails
    """
    try:
        # Decode filename
        decoded_filename = urllib.parse.unquote(filename)
        
        result = ExcelService.modify_excel_columns(decoded_filename, request.selectedSheets, brand)
        
        return ColumnModificationResponse(**result)
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to modify Excel file: {str(e)}")

@router.get("/api/sheets/{filename:path}")
async def get_excel_sheets(filename: str) -> Dict[str, Any]:
    """
    Get all sheet names and basic info from an Excel file (alternative endpoint)
    
    Args:
        filename: Name of the Excel file to analyze (URL encoded)
        
    Returns:
        Dict containing all sheets information
        
    Raises:
        HTTPException: If file processing fails
    """
    try:
        # Decode the filename in case it's URL encoded
        decoded_filename = urllib.parse.unquote(filename)
        
        # For compatibility with legacy frontend code, generate mock response
        # In production, this would use FileService.get_sheet_information
        
        mock_sheets = []
        
        # Generate realistic sheets based on filename
        if "NIELSEN" in decoded_filename.upper() or "MMM" in decoded_filename.upper():
            nielsen_sheets = [
                "Media Data", "Sales Data", "Base Sales", "Incrementality", 
                "TV Spend", "Digital Spend", "Print Spend", "Radio Spend",
                "Brand A Sales", "Brand B Sales", "Brand C Sales",
                "Regional North", "Regional South", "Regional East", "Regional West",
                "Q1 Summary", "Q2 Summary", "Q3 Summary", "Q4 Summary",
                "Category Performance", "Competitive Analysis", "Market Share"
            ]
            
            for i, sheet_name in enumerate(nielsen_sheets):
                columns = [
                    {"name": "Date", "type": "date"},
                    {"name": "Revenue", "type": "numeric"},
                    {"name": "Units_Sold", "type": "numeric"},
                    {"name": "Brand", "type": "categorical"},
                ]
                
                # Add sheet-specific columns
                if "Media" in sheet_name or "Spend" in sheet_name:
                    columns.extend([
                        {"name": "Media_Channel", "type": "categorical"},
                        {"name": "Spend_Amount", "type": "numeric"},
                        {"name": "Impressions", "type": "numeric"}
                    ])
                elif "Sales" in sheet_name:
                    columns.extend([
                        {"name": "Sales_Volume", "type": "numeric"},
                        {"name": "Price", "type": "numeric"}
                    ])
                
                mock_sheets.append({
                    "sheetName": sheet_name,
                    "columns": columns,
                    "rowCount": 52 + (i * 15),
                    "isSelected": True
                })
        
        return {
            "success": True,
            "message": "Sheet information retrieved successfully",
            "filename": decoded_filename,
            "totalSheets": len(mock_sheets),
            "sheets": mock_sheets,
            "timestamp": ExcelService._get_current_timestamp()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read Excel file: {str(e)}")

# Helper method for ExcelService
@staticmethod
def _get_current_timestamp():
    """Get current timestamp in ISO format"""
    from datetime import datetime
    return datetime.now().isoformat()
