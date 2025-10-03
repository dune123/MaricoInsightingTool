"""
========================================
BRANDBLOOM INSIGHTS - DATA ROUTES
========================================

Purpose: Data filtering, analysis, processing, and export API endpoints for comprehensive data operations

Description:
This module provides data analysis endpoints for the BrandBloom Insights application.
It handles real-time data filtering, statistical analysis, data export, and
comprehensive data operations on concatenated datasets. The routes support
advanced data manipulation, filtering, and analysis capabilities for marketing
mix modeling and business intelligence workflows.

Key Functions:
- get_filtered_data(request, brand): Real-time data filtering endpoint
  - Applies multiple filter criteria to concatenated datasets
  - Supports brand-specific data processing
  - Returns filtered data with metadata and statistics
  - Handles complex filtering operations efficiently
- analyze_dataset(filename): Comprehensive dataset analysis endpoint
  - Performs statistical analysis and data quality assessment
  - Validates dataset structure and content
  - Returns analysis results and recommendations
  - Supports various dataset formats and structures
- export_filtered_data(request, export_format): Data export endpoint
  - Exports filtered data in multiple formats (CSV, XLSX, JSON)
  - Supports custom filter criteria and data selection
  - Returns downloadable files with proper media types
  - Handles large dataset exports efficiently
- get_column_statistics(filename, column): Column-specific analysis endpoint
  - Provides detailed statistics for individual columns
  - Supports numeric, categorical, and date column types
  - Returns comprehensive column analysis and insights
  - Handles missing data and edge cases
- get_data_summary(filename): Quick data summary endpoint
  - Provides overview of dataset structure and content
  - Includes row/column counts, data types, and memory usage
  - Returns concise dataset metadata for quick assessment
  - Supports rapid dataset exploration
- validate_filter_request(request): Filter validation endpoint
  - Validates filter criteria without executing queries
  - Checks column existence and value availability
  - Returns validation results and recommendations
  - Helps prevent runtime filter errors

Data Processing Features:
- Real-time data filtering with multiple criteria
- Statistical analysis and data quality metrics
- Multi-format data export capabilities
- Column-specific analysis and insights
- Performance-optimized data operations
- Comprehensive error handling and validation
- Brand-specific data processing support

API Endpoints:
- POST /api/data/filtered: Apply filters and get filtered data
  - Accepts: FilterRequest with criteria, brand (query parameter)
  - Returns: FilterResponse with filtered data and metadata
  - Purpose: Real-time data filtering and analysis
- GET /api/data/analyze/{filename}: Analyze dataset
  - Accepts: filename (path)
  - Returns: Dict with comprehensive analysis results
  - Purpose: Dataset quality assessment and statistical analysis
- POST /api/data/export: Export filtered data
  - Accepts: FilterRequest, export_format (query parameter)
  - Returns: FileResponse with exported file
  - Purpose: Multi-format data export with filtering
- GET /api/data/column-stats/{filename}/{column}: Column statistics
  - Accepts: filename (path), column (path)
  - Returns: Dict with detailed column analysis
  - Purpose: Column-specific statistical analysis
- GET /api/data/summary/{filename}: Quick data summary
  - Accepts: filename (path)
  - Returns: Dict with dataset overview and metadata
  - Purpose: Rapid dataset exploration and assessment
- POST /api/data/validate: Validate filter request
  - Accepts: FilterRequest
  - Returns: Dict with validation results and recommendations
  - Purpose: Filter criteria validation and error prevention

Export Format Support:
- CSV: Comma-separated values for spreadsheet applications
- XLSX: Excel format for advanced analysis and visualization
- JSON: JavaScript Object Notation for API integration
- Automatic media type detection and proper file responses

Data Analysis Capabilities:
- Statistical summaries and distributions
- Data quality assessment and validation
- Missing data analysis and reporting
- Column type detection and validation
- Memory usage optimization
- Performance metrics and monitoring

Filtering Features:
- Multi-column filtering with AND/OR logic
- Numeric range filtering and comparisons
- Categorical value filtering and selection
- Date range filtering and temporal analysis
- Null value handling and exclusion
- Performance-optimized filter execution

Error Handling:
- Comprehensive HTTP status code usage
- Detailed error messages for debugging
- File not found handling and validation
- Filter validation and error prevention
- Graceful error recovery and reporting
- Input validation and sanitization

Dependencies:
- FastAPI: For routing, request handling, and HTTP responses
- DataService: For data processing and business logic
- FileService: For file operations and validation
- app.models.data_models: For request/response models
- urllib.parse: For URL decoding of parameters
- pandas: For data manipulation and analysis

Used by:
- Data filtering components: For real-time data analysis
- Analysis and visualization tools: For statistical insights
- Export functionality: For data sharing and reporting
- Statistical analysis workflows: For business intelligence
- Data quality assessment: For validation and monitoring
- Marketing mix modeling: For analytical workflows

Data Processing Benefits:
- Real-time filtering and analysis capabilities
- Multi-format export and sharing options
- Comprehensive statistical analysis and insights
- Performance-optimized data operations
- Robust error handling and validation
- Scalable data processing architecture

Processing Flow:
1. Request validation and parameter processing
2. File location and accessibility verification
3. Data loading and preprocessing
4. Filter application and data processing
5. Analysis execution and result generation
6. Response formatting and error handling

Business Intelligence Features:
- Real-time data exploration and analysis
- Statistical insights and data quality metrics
- Multi-dimensional filtering and segmentation
- Export capabilities for reporting and sharing
- Column-level analysis and validation
- Performance monitoring and optimization

Last Updated: 2024-12-23
Author: BrandBloom Backend Team
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from typing import Dict, Any
import urllib.parse

from app.services.data_service import DataService
from app.models.data_models import FilterRequest, FilterResponse

router = APIRouter()

@router.post("/api/data/filtered", response_model=FilterResponse)
async def get_filtered_data(request: FilterRequest, brand: str = None) -> FilterResponse:
    """
    Get filtered data from concatenated Excel file based on filter criteria
    
    Purpose: Apply filters to concatenated data and return filtered results for analysis
    
    Args:
        request: FilterRequest with filename, filters, columns, and limit
        
    Returns:
        FilterResponse with filtered data and metadata
        
    Raises:
        HTTPException: If filtering fails or file not found
    """
    try:
        result = DataService.get_filtered_data(request, brand)
        return FilterResponse(**result)
        
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Data filtering failed: {str(e)}")

@router.get("/api/data/analyze/{filename}")
async def analyze_dataset(filename: str) -> Dict[str, Any]:
    """
    Perform comprehensive analysis of dataset
    
    Args:
        filename: Name of dataset file to analyze
        
    Returns:
        Dict with analysis results including statistics and validation
        
    Raises:
        HTTPException: If analysis fails or file not found
    """
    try:
        decoded_filename = urllib.parse.unquote(filename)
        
        # Find the file
        from app.services.file_service import FileService
        file_path, _ = FileService.find_file(decoded_filename)
        
        if not file_path:
            raise HTTPException(status_code=404, detail=f"File not found: {decoded_filename}")
        
        result = DataService.analyze_dataset(file_path)
        
        return {
            "success": True,
            "message": "Dataset analysis completed successfully",
            "filename": decoded_filename,
            "data": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.post("/api/data/export")
async def export_filtered_data(request: FilterRequest, export_format: str = "csv") -> FileResponse:
    """
    Export filtered data to specified format
    
    Args:
        request: FilterRequest with filter criteria
        export_format: Export format ('csv', 'xlsx', 'json')
        
    Returns:
        FileResponse with exported file
        
    Raises:
        HTTPException: If export fails
    """
    try:
        # Validate export format
        valid_formats = ["csv", "xlsx", "json"]
        if export_format.lower() not in valid_formats:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid export format. Must be one of: {valid_formats}"
            )
        
        export_path = DataService.export_filtered_data(request, export_format)
        
        # Determine media type based on format
        media_types = {
            "csv": "text/csv",
            "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "json": "application/json"
        }
        
        return FileResponse(
            path=str(export_path),
            filename=export_path.name,
            media_type=media_types.get(export_format.lower(), "application/octet-stream")
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

@router.get("/api/data/column-stats/{filename}/{column}")
async def get_column_statistics(filename: str, column: str) -> Dict[str, Any]:
    """
    Get detailed statistics for a specific column
    
    Args:
        filename: Name of dataset file
        column: Name of column to analyze
        
    Returns:
        Dict with column statistics
        
    Raises:
        HTTPException: If analysis fails
    """
    try:
        decoded_filename = urllib.parse.unquote(filename)
        decoded_column = urllib.parse.unquote(column)
        
        # Find the file
        from app.services.file_service import FileService
        file_path, _ = FileService.find_file(decoded_filename)
        
        if not file_path:
            raise HTTPException(status_code=404, detail=f"File not found: {decoded_filename}")
        
        stats = DataService.get_column_statistics(file_path, decoded_column)
        
        return {
            "success": True,
            "message": f"Column statistics for '{decoded_column}' retrieved successfully",
            "filename": decoded_filename,
            "data": stats
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Column analysis failed: {str(e)}")

@router.get("/api/data/summary/{filename}")
async def get_data_summary(filename: str) -> Dict[str, Any]:
    """
    Get quick data summary for a file
    
    Args:
        filename: Name of dataset file
        
    Returns:
        Dict with data summary
    """
    try:
        decoded_filename = urllib.parse.unquote(filename)
        
        from app.services.file_service import FileService
        file_path, _ = FileService.find_file(decoded_filename)
        
        if not file_path:
            raise HTTPException(status_code=404, detail=f"File not found: {decoded_filename}")
        
        # Load dataset and get basic info
        from app.services.data_service import DataService
        df = DataService._load_dataset(file_path)
        
        summary = {
            "total_rows": len(df),
            "total_columns": len(df.columns),
            "columns": list(df.columns),
            "data_types": df.dtypes.astype(str).to_dict(),
            "null_counts": df.isnull().sum().to_dict(),
            "memory_usage_mb": round(df.memory_usage(deep=True).sum() / (1024 * 1024), 2)
        }
        
        return {
            "success": True,
            "message": "Data summary retrieved successfully",
            "filename": decoded_filename,
            "data": summary
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summary generation failed: {str(e)}")

@router.post("/api/data/validate")
async def validate_filter_request(request: FilterRequest) -> Dict[str, Any]:
    """
    Validate filter request without executing it
    
    Args:
        request: FilterRequest to validate
        
    Returns:
        Dict with validation results
    """
    try:
        # Find the file
        from app.services.file_service import FileService
        file_path, _ = FileService.find_file(request.filename)
        
        if not file_path:
            raise HTTPException(status_code=404, detail=f"File not found: {request.filename}")
        
        # Load dataset for validation
        from app.services.data_service import DataService
        df = DataService._load_dataset(file_path)
        
        validation_results = {
            "file_exists": True,
            "total_rows": len(df),
            "available_columns": list(df.columns),
            "filter_validation": {}
        }
        
        # Validate each filter
        for column, values in request.filters.items():
            if column in df.columns:
                unique_values = df[column].dropna().unique().tolist()
                valid_values = [v for v in values if v in unique_values]
                validation_results["filter_validation"][column] = {
                    "column_exists": True,
                    "requested_values": values,
                    "valid_values": valid_values,
                    "invalid_values": [v for v in values if v not in unique_values],
                    "available_values_count": len(unique_values)
                }
            else:
                validation_results["filter_validation"][column] = {
                    "column_exists": False,
                    "error": f"Column '{column}' not found in dataset"
                }
        
        return {
            "success": True,
            "message": "Filter request validation completed",
            "data": validation_results
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")
