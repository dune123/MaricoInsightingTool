"""
========================================
BRANDBLOOM INSIGHTS - FILE ROUTES
========================================

Purpose: File upload, processing, management, and download API endpoints for brand-specific data operations

Description:
This module provides comprehensive file management endpoints for the BrandBloom
Insights application. It handles file uploads, Excel sheet analysis, file
downloads, and file information retrieval with proper validation and error handling.
All operations are brand-specific, ensuring data isolation and proper organization
across different brand workspaces.

Key Functions:
- upload_file(file, brand): File upload and processing endpoint
  - Accepts file upload with optional brand context
  - Validates file type and processes upload
  - Returns processing results and status
  - Handles errors gracefully with proper HTTP status codes
- get_all_sheets(filename, brand): Excel sheet information extraction
  - Retrieves sheet names, columns, and metadata
  - Supports brand-specific file lookup
  - Handles URL-encoded filenames
  - Returns comprehensive sheet information
- download_file(filename, brand): File download with priority-based lookup
  - Downloads processed files with brand context
  - Implements priority-based file location search
  - Handles URL-encoded filenames
  - Returns file response for download
- validate_file(filename): File validation for processing
  - Validates file existence and format
  - Checks file readiness for processing
  - Returns validation results and status
- list_files(directory, brand): Directory file listing
  - Lists files in brand-specific directories
  - Supports raw, intermediate, concat, and processed directories
  - Returns file information and counts
  - Enforces brand parameter requirement
- list_concatenated_files(brand): Concatenated file listing
  - Lists all concatenated files for a brand
  - Sorts files by modification time (newest first)
  - Filters for Excel files containing "concatenated"
  - Returns sorted file list with counts

API Endpoints:
- POST /api/files/upload: Upload and process files
  - Accepts: file (UploadFile), brand (Form, optional)
  - Returns: FileUploadResponse with processing results
  - Purpose: File upload with brand context and processing
- GET /api/files/{filename}/sheets: Get Excel sheet information
  - Accepts: filename (path), brand (query parameter)
  - Returns: SheetsResponse with sheet details
  - Purpose: Excel sheet analysis and metadata extraction
- GET /api/download/{filename}: Download processed files
  - Accepts: filename (path), brand (query parameter)
  - Returns: FileResponse with file content
  - Purpose: File download with brand-specific lookup
- GET /api/files/{filename}/validate: Validate file for processing
  - Accepts: filename (path)
  - Returns: Dict with validation results
  - Purpose: File validation and readiness check
- GET /api/files/list/{directory}: List files in directory
  - Accepts: directory (path), brand (query parameter)
  - Returns: Dict with file listing and counts
  - Purpose: Directory file enumeration
- GET /api/files/list-concatenated: List concatenated files
  - Accepts: brand (query parameter)
  - Returns: Dict with concatenated file list
  - Purpose: Concatenated file discovery

Brand-Specific Features:
- All operations require brand parameter for data isolation
- Brand-specific directory structure enforcement
- No legacy global directory fallback support
- Proper brand name sanitization and validation
- Isolated file operations per brand workspace

File Processing Flow:
1. File upload with brand context
2. File validation and type checking
3. Brand-specific directory storage
4. Excel sheet analysis and metadata extraction
5. File processing and transformation
6. Download with brand-specific lookup

Error Handling:
- Comprehensive HTTP status code usage
- Detailed error messages for debugging
- Graceful handling of file not found scenarios
- Validation error reporting
- Brand parameter requirement enforcement

Dependencies:
- FastAPI: For routing, file handling, and HTTP responses
- FileService: For file operations and business logic
- app.models.data_models: For request/response models
- app.core.config: For brand-specific directory configuration
- urllib.parse: For URL decoding of filenames

Used by:
- Frontend file upload components: For file upload and management
- Data processing workflows: For file validation and preparation
- File download functionality: For processed file retrieval
- Excel sheet analysis: For sheet information extraction
- Brand management: For brand-specific file operations

File Operations Benefits:
- Brand data isolation and security
- Consistent file organization structure
- Scalable multi-brand support
- Proper error handling and validation
- URL-safe filename handling
- Comprehensive file metadata

Last Updated: 2024-12-23
Author: BrandBloom Backend Team
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from typing import Dict, Any
import urllib.parse

from app.services.file_service import FileService
from app.models.data_models import FileUploadResponse, SheetsResponse

router = APIRouter()

@router.post("/api/files/upload", response_model=FileUploadResponse)
async def upload_file(file: UploadFile = File(...), brand: str = Form(None)) -> FileUploadResponse:
    """
    Upload and process a file
    
    Args:
        file: Uploaded file object
        
    Returns:
        FileUploadResponse with processing results
        
    Raises:
        HTTPException: If file validation or processing fails
    """
    try:
        # Check if filename exists
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")
        
        # Process the upload with optional brand context
        result = FileService.process_upload(file, file.filename, brand)
        
        return FileUploadResponse(
            success=True,
            message="File uploaded and processed successfully",
            data=result
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

@router.get("/api/files/{filename}/sheets", response_model=SheetsResponse)
async def get_all_sheets(filename: str, brand: str = None) -> SheetsResponse:
    """
    Get all sheet names and their information from Excel file
    
    Args:
        filename: Name of Excel file (URL encoded)
        
    Returns:
        SheetsResponse with sheet information
        
    Raises:
        HTTPException: If file not found or not Excel format
    """
    try:
        # Decode filename in case it's URL encoded
        decoded_filename = urllib.parse.unquote(filename)
        
        # Get sheet information with brand context
        result = FileService.get_sheet_information(decoded_filename, brand)
        
        return SheetsResponse(
            success=True,
            message="Sheet information retrieved successfully",
            data=result
        )
        
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read Excel sheets: {str(e)}")

@router.get("/api/download/{filename:path}")
async def download_file(filename: str, brand: str = None) -> FileResponse:
    """
    Download a processed file with priority-based lookup
    
    Args:
        filename: Name of file to download (URL encoded)
        brand: Brand name for brand-specific file lookup (query parameter)
        
    Returns:
        FileResponse with the requested file
        
    Raises:
        HTTPException: If file not found
    """
    try:
        # Decode the filename in case it's URL encoded
        decoded_filename = urllib.parse.unquote(filename)
        
        # Extract brand from filename if not provided as parameter
        if not brand:
            # Try to extract brand from filename pattern (e.g., "NIELSEN - X-Men - ...")
            if " - " in decoded_filename:
                parts = decoded_filename.split(" - ")
                if len(parts) >= 2:
                    brand = parts[1].strip()
        
        if not brand:
            raise HTTPException(status_code=400, detail="Brand parameter required for file download")
        
        # Get file path for download
        file_path = FileService.get_download_file_path(decoded_filename, brand)
        
        return FileResponse(
            path=str(file_path),
            filename=decoded_filename,
            media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")

@router.get("/api/files/{filename}/validate")
async def validate_file(filename: str) -> Dict[str, Any]:
    """
    Validate file for processing operations
    
    Args:
        filename: Name of file to validate
        
    Returns:
        Dict with validation results
    """
    try:
        decoded_filename = urllib.parse.unquote(filename)
        file_path, _ = FileService.find_file(decoded_filename)
        
        if not file_path:
            raise HTTPException(status_code=404, detail=f"File not found: {decoded_filename}")
        
        validation_result = FileService.validate_file_for_processing(file_path)
        
        return {
            "success": True,
            "message": "File validation completed",
            "data": validation_result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")

@router.get("/api/files/list/{directory}")
async def list_files(directory: str, brand: str = None) -> Dict[str, Any]:
    """
    List files in specified directory
    
    Args:
        directory: Directory name (raw, intermediate, concat, processed)
        
    Returns:
        Dict with file listing
    """
    try:
        from app.core.config import settings
        
        # Brand-specific directories ONLY - no legacy fallback
        if not brand:
            raise HTTPException(status_code=400, detail="Brand parameter is required - no legacy fallback supported")
        
        brand_dirs = settings.get_brand_directories(brand)
        directory_map = {
            "raw": brand_dirs["raw_dir"],
            "intermediate": brand_dirs["intermediate_dir"],
            "concat": brand_dirs["concat_dir"],
            "processed": brand_dirs["processed_dir"]
        }
        
        if directory not in directory_map:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid directory. Must be one of: {list(directory_map.keys())}"
            )
        
        files_info = FileService.list_files_in_directory(directory_map[directory])
        
        return {
            "success": True,
            "message": f"Files in {directory} directory listed successfully",
            "data": {
                "directory": directory,
                "files": files_info,
                "total_files": len(files_info)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list files: {str(e)}")

@router.get("/api/files/list-concatenated")
async def list_concatenated_files(brand: str = None) -> Dict[str, Any]:
    """
    List all concatenated files in the concat directory
    
    Returns:
        List of concatenated filenames
    """
    try:
        from app.core.config import settings
        import os
        
        # Brand-specific directories ONLY - no legacy fallback
        if not brand:
            raise HTTPException(status_code=400, detail="Brand parameter is required - no legacy fallback supported")
        
        brand_dirs = settings.get_brand_directories(brand)
        concat_dir = brand_dirs["concat_dir"]
        
        if not concat_dir.exists():
            return {
                "success": True,
                "files": [],
                "count": 0
            }
        
        # Get all files in concat directory that contain "concatenated"
        files = []
        for filename in os.listdir(concat_dir):
            if filename.lower().endswith('.xlsx') and 'concatenated' in filename.lower():
                files.append(filename)
        
        # Sort by modification time (newest first)
        files_with_timestamps = []
        for filename in files:
            file_path = concat_dir / filename
            try:
                mtime = file_path.stat().st_mtime
                files_with_timestamps.append((filename, mtime))
            except:
                files_with_timestamps.append((filename, 0))
        
        # Sort by timestamp (newest first)
        files_with_timestamps.sort(key=lambda x: x[1], reverse=True)
        sorted_files = [filename for filename, _ in files_with_timestamps]
        
        return {
            "success": True,
            "files": sorted_files,
            "count": len(sorted_files)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list concatenated files: {str(e)}")

@router.get("/api/files/{filename}/exists")
async def check_file_exists(filename: str, brand: str = None) -> Dict[str, Any]:
    """
    Check if a file exists in the backend
    
    Args:
        filename: Name of the file to check
        brand: Brand name for brand-specific lookup
        
    Returns:
        Dict with file existence status
    """
    try:
        from app.core.config import settings
        from pathlib import Path
        
        # Brand-specific directories ONLY - no legacy fallback
        if not brand:
            raise HTTPException(status_code=400, detail="Brand parameter is required - no legacy fallback supported")
        
        # Decode URL-encoded filename
        decoded_filename = urllib.parse.unquote(filename)
        
        brand_dirs = settings.get_brand_directories(brand)
        
        # Check in multiple directories (priority order)
        search_directories = [
            brand_dirs["concat_dir"],
            brand_dirs["data_dir"],
            brand_dirs["raw_dir"],
            brand_dirs["intermediate_dir"]
        ]
        
        for directory in search_directories:
            if directory.exists():
                file_path = directory / decoded_filename
                if file_path.exists() and file_path.is_file():
                    return {
                        "success": True,
                        "exists": True,
                        "filePath": str(file_path),
                        "directory": directory.name
                    }
        
        # File not found in any directory
        return {
            "success": True,
            "exists": False,
            "filePath": None,
            "directory": None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check file existence: {str(e)}")
