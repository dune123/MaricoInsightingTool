"""
========================================
BRANDBLOOM INSIGHTS - FILE SERVICE
========================================

Purpose: File upload, processing, and management service layer

Description:
This service module handles all file operations for the BrandBloom Insights application.
It provides high-level file management functions including upload processing, Excel
sheet analysis, file validation, and storage management across different directories.

Key Functionality:
- File upload processing and validation
- Excel sheet detection and analysis
- File storage management (raw/intermediate/concat)
- Sheet information extraction
- File metadata generation
- Comprehensive error handling

Dependencies:
- pandas for Excel file processing
- pathlib for file operations
- app.utils.file_utils for file utilities
- app.core.config for settings

Used by:
- Route modules for file operations
- Excel processing workflows
- File upload endpoints
- Sheet information APIs

Last Updated: 2024-12-23
Author: BrandBloom Backend Team
"""

import shutil
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
import pandas as pd
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)
from app.utils.file_utils import (
    validate_file_extension,
    generate_timestamped_filename,
    find_file_with_fallback,
    find_most_recent_timestamped_file,
    get_excel_sheet_names,
    get_excel_columns,
    get_excel_sheet_size,
    is_excel_file,
    get_file_info
)
from app.models.data_models import SheetInfo

class FileService:
    """Service class for file operations"""
    
    @staticmethod
    def _handle_first_upload_for_brand(brand: str) -> None:
        """
        Handle first-time upload for a brand - create folders and move pending analysis
        
        Args:
            brand: Brand name
        """
        from app.services.brand_analysis_service import BrandAnalysisService
        import json
        import shutil
        
        analysis_id = BrandAnalysisService._create_analysis_id(brand)
        
        # Check if pending analysis exists
        pending_analyses_dir = settings.BASE_DIR / "_pending_analyses"
        pending_analysis_file = pending_analyses_dir / f"{analysis_id}.json"
        
        if pending_analysis_file.exists():
            print(f"📁 First upload for brand '{brand}' - creating analysis folder structure")
            
            # Create brand directory structure
            brand_directories = settings.create_brand_directories(brand)
            
            # Read pending analysis data
            with open(pending_analysis_file, 'r', encoding='utf-8') as f:
                analysis_data = json.load(f)
            
            # Move analysis to proper brand location
            brand_analysis_dir = brand_directories["analyses_dir"]
            brand_analysis_file = brand_analysis_dir / "analysis.json"
            
            with open(brand_analysis_file, 'w', encoding='utf-8') as f:
                json.dump(analysis_data, f, indent=2, ensure_ascii=False, default=str)
            
            # Remove pending analysis file
            pending_analysis_file.unlink()
            
            print(f"✅ Analysis moved from pending to: {brand_analysis_file}")
            print(f"✅ Brand folder structure created for: {brand}")
        else:
            # No pending analysis - this might be a legacy upload or direct upload
            # Still create directories if they don't exist
            brand_dirs = settings.get_brand_directories(brand)
            if not brand_dirs["brand_root"].exists():
                print(f"📁 Creating brand directories for existing upload: {brand}")
                settings.create_brand_directories(brand)
    
    @staticmethod
    def process_upload(file, filename: str, brand: str = None) -> Dict[str, Any]:
        """
        Process uploaded file and store in raw directory
        CRITICAL: This is where analysis folders are created for the first time!
        
        Args:
            file: Uploaded file object
            filename: Original filename
            brand: Brand name (required)
            
        Returns:
            Dict with processing results
        """
        # Validate file type
        if not validate_file_extension(filename):
            raise ValueError(f"Invalid file type. Only {', '.join(settings.ALLOWED_EXTENSIONS)} files are allowed")
        
        # Generate timestamped filename 
        processed_name = generate_timestamped_filename(filename)
        
        # Use brand-specific directory - brand is REQUIRED
        if not brand:
            raise ValueError("Brand parameter is required - no legacy fallback supported")
        
        # CRITICAL: Check if this is the first upload for this brand
        # If so, create the analysis folder structure and move pending analysis
        FileService._handle_first_upload_for_brand(brand)
        
        brand_dirs = settings.get_brand_directories(brand)
        raw_file_path = brand_dirs["raw_dir"] / processed_name
        # Ensure brand directories exist (should already be created by _handle_first_upload_for_brand)
        brand_dirs["raw_dir"].mkdir(parents=True, exist_ok=True)
        
        # Save the file to raw directory
        with open(raw_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Get file info
        file_info = get_file_info(raw_file_path)
        base_name = Path(filename).stem
        file_extension = Path(filename).suffix
        
        result = {
            "file": {
                "originalName": filename,
                "processedName": processed_name,
                "processedPath": str(raw_file_path),
                "size": file_info.get("size", 0),
                "baseFilename": base_name,
                "extension": file_extension
            }
        }
        
        # Process Excel files for sheet information
        if is_excel_file(filename):
            sheets_info = FileService.get_excel_sheets_info(raw_file_path)
            if sheets_info:
                result["sheets"] = sheets_info
                result["fileStats"] = {
                    "totalRows": sum(sheet["totalRows"] for sheet in sheets_info),
                    "totalColumns": max(sheet["totalColumns"] for sheet in sheets_info) if sheets_info else 0
                }
        else:
            # CSV file processing
            try:
                df = pd.read_csv(raw_file_path, nrows=0)
                columns = df.columns.tolist()
                result["columns"] = columns
                result["fileStats"] = {
                    "totalRows": 0,  # Will be calculated later if needed
                    "totalColumns": len(columns)
                }
            except Exception:
                result["columns"] = []
                result["fileStats"] = {"totalRows": 0, "totalColumns": 0}
        
        return result
    
    @staticmethod
    def get_excel_sheets_info(file_path: Path) -> List[Dict[str, Any]]:
        """
        Get comprehensive sheet information from Excel file
        
        Args:
            file_path: Path to Excel file
            
        Returns:
            List of sheet information dictionaries
        """
        try:
            sheet_names = get_excel_sheet_names(file_path)
            sheets_info = []
            
            for sheet_name in sheet_names:
                columns = get_excel_columns(file_path, sheet_name)  # Get all columns
                total_rows, total_cols = get_excel_sheet_size(file_path, sheet_name)
                
                sheets_info.append({
                    "sheetName": sheet_name,
                    "columns": columns,
                    "totalRows": total_rows,
                    "totalColumns": total_cols,
                    "isSelected": True
                })
            
            return sheets_info
        except Exception:
            return []
    
    @staticmethod
    def find_file(filename: str, brand: str = None) -> Tuple[Optional[Path], str]:
        """
        Find file across different directories with fallback logic
        
        Args:
            filename: Name of file to find
            
        Returns:
            Tuple of (file_path, source_directory) or (None, "")
        """
        search_directories = []
        
        # If brand is provided, search brand-specific directories first
        if brand:
            try:
                brand_dirs = settings.get_brand_directories(brand)
                brand_search_directories = [
                    brand_dirs["intermediate_dir"],  # Modified files first
                    brand_dirs["raw_dir"],          # Original uploads  
                    brand_dirs["concat_dir"],       # Concatenated files
                    brand_dirs["processed_dir"]     # Processed files
                ]
                search_directories.extend(brand_search_directories)
            except Exception as e:
                logger.warning(f"Failed to get brand directories for {brand}: {e}")
        
        # Also search all existing brand directories (in case brand not specified)
        try:
            for brand_dir in settings.BASE_DIR.iterdir():
                if brand_dir.is_dir() and not brand_dir.name.startswith('.'):
                    brand_data_dir = brand_dir / "data"
                    if brand_data_dir.exists():
                        potential_dirs = [
                            brand_data_dir / "uploads" / "intermediate",
                            brand_data_dir / "uploads" / "raw",
                            brand_data_dir / "uploads" / "concatenated",
                            brand_data_dir / "exports" / "results"
                        ]
                        search_directories.extend([d for d in potential_dirs if d.exists()])
        except Exception as e:
            logger.warning(f"Failed to scan brand directories: {e}")
        
        # NO MORE LEGACY DIRECTORIES - Only brand-specific search
        
        # Try exact filename first
        file_path, source = find_file_with_fallback(filename, search_directories)
        if file_path:
            return file_path, source
        
        # Try finding most recent timestamped version
        return find_most_recent_timestamped_file(filename, search_directories)
    
    @staticmethod
    def get_sheet_information(filename: str, brand: str = None) -> Dict[str, Any]:
        """
        Get sheet information for Excel file
        
        Args:
            filename: Name of Excel file
            
        Returns:
            Dict with sheet information
        """
        file_path, source = FileService.find_file(filename, brand)
        
        if not file_path:
            raise FileNotFoundError(f"File not found: {filename}")
        
        if not is_excel_file(str(file_path)):
            raise ValueError("This endpoint only supports Excel (.xlsx) files")
        
        sheets_info = FileService.get_excel_sheets_info(file_path)
        
        return {
            "filename": file_path.name,
            "totalSheets": len(sheets_info),
            "sheets": sheets_info,
            "source": source
        }
    
    @staticmethod
    def get_download_file_path(filename: str, brand: str = None) -> Path:
        """
        Get file path for download with priority order
        
        Args:
            filename: Name of file to download
            
        Returns:
            Path: File path for download
            
        Raises:
            FileNotFoundError: If file not found in any directory
        """
        # Brand-specific directories ONLY - no legacy fallback
        if not brand:
            raise ValueError("Brand parameter is required - no legacy fallback supported")
        
        brand_dirs = settings.get_brand_directories(brand)
        # Search in priority order: concat → processed → intermediate → raw (brand-specific)
        search_directories = [
            brand_dirs["concat_dir"],
            brand_dirs["processed_dir"], 
            brand_dirs["intermediate_dir"],
            brand_dirs["raw_dir"]
        ]
        
        file_path, _ = find_file_with_fallback(filename, search_directories)
        if not file_path:
            raise FileNotFoundError(f"File not found: {filename}")
        
        return file_path
    
    @staticmethod
    def list_files_in_directory(directory: Path) -> List[Dict[str, Any]]:
        """
        List all files in a directory with their information
        
        Args:
            directory: Directory path to list
            
        Returns:
            List of file information dictionaries
        """
        if not directory.exists():
            return []
        
        files_info = []
        for file_path in directory.glob("*"):
            if file_path.is_file():
                file_info = get_file_info(file_path)
                files_info.append(file_info)
        
        return files_info
    
    @staticmethod
    def validate_file_for_processing(file_path: Path) -> Dict[str, Any]:
        """
        Validate file for processing operations
        
        Args:
            file_path: Path to file
            
        Returns:
            Dict with validation results
        """
        validation_result = {
            "is_valid": True,
            "errors": [],
            "warnings": [],
            "file_info": {}
        }
        
        # Check if file exists
        if not file_path.exists():
            validation_result["is_valid"] = False
            validation_result["errors"].append(f"File does not exist: {file_path}")
            return validation_result
        
        # Get file information
        file_info = get_file_info(file_path)
        validation_result["file_info"] = file_info
        
        # Check file extension
        if not validate_file_extension(file_path.name):
            validation_result["is_valid"] = False
            validation_result["errors"].append(f"Invalid file extension: {file_path.suffix}")
        
        # Check file size
        if file_info.get("size", 0) > settings.MAX_FILE_SIZE:
            validation_result["is_valid"] = False
            validation_result["errors"].append(f"File too large: {file_info['size']} bytes")
        
        # Excel-specific validation
        if is_excel_file(file_path.name):
            try:
                sheet_names = get_excel_sheet_names(file_path)
                if not sheet_names:
                    validation_result["warnings"].append("No sheets found in Excel file")
                validation_result["file_info"]["sheet_count"] = len(sheet_names)
            except Exception as e:
                validation_result["warnings"].append(f"Could not read Excel file: {str(e)}")
        
        return validation_result
