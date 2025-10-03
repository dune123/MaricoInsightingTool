"""
========================================
BRANDBLOOM INSIGHTS - FILE UTILITIES
========================================

Purpose: File handling and validation utilities for data processing operations

Description:
This module provides comprehensive file handling utilities for the BrandBloom Insights
application. It includes file validation, path resolution, Excel file operations,
and file management functions used throughout the application.

Key Functionality:
- File validation and type checking
- Excel file detection and analysis
- File path resolution with fallback logic
- Timestamped filename generation
- File existence checking with directory traversal
- File size and format validation

Dependencies:
- pathlib for modern path handling
- pandas for Excel file operations
- time for timestamp generation
- urllib.parse for filename decoding

Used by:
- Route modules for file validation
- Service modules for file operations
- Data processing functions
- File upload and concatenation workflows

Last Updated: 2024-12-23
Author: BrandBloom Backend Team
"""

import time
import urllib.parse
from pathlib import Path
from typing import Tuple, Optional, List
import pandas as pd

from app.core.config import settings

def validate_file_extension(filename: str) -> bool:
    """
    Validate if file has an allowed extension
    
    Args:
        filename: Name of the file to validate
        
    Returns:
        bool: True if extension is allowed, False otherwise
    """
    file_extension = Path(filename).suffix.lower()
    return file_extension in settings.ALLOWED_EXTENSIONS

def generate_timestamped_filename(original_filename: str) -> str:
    """
    Generate a timestamped filename for unique file storage
    
    Args:
        original_filename: Original filename with extension
        
    Returns:
        str: Timestamped filename in format 'basename_timestamp.ext'
    """
    timestamp = int(time.time())
    base_name = Path(original_filename).stem
    extension = Path(original_filename).suffix
    return f"{base_name}_{timestamp}{extension}"

def decode_filename(filename: str) -> str:
    """
    Decode URL-encoded filename
    
    Args:
        filename: URL-encoded filename
        
    Returns:
        str: Decoded filename
    """
    return urllib.parse.unquote(filename)

def find_file_with_fallback(filename: str, directories: List[Path]) -> Tuple[Optional[Path], str]:
    """
    Find file in multiple directories with fallback logic
    
    Args:
        filename: Name of file to find
        directories: List of directories to search in order of priority
        
    Returns:
        Tuple of (file_path, source_directory_name) or (None, "")
    """
    decoded_filename = decode_filename(filename)
    
    for directory in directories:
        # Try exact filename first
        file_path = directory / decoded_filename
        if file_path.exists():
            return file_path, directory.name
        
        # Try with different extensions
        base_name = Path(decoded_filename).stem
        for ext in settings.ALLOWED_EXTENSIONS:
            test_path = directory / f"{base_name}{ext}"
            if test_path.exists():
                return test_path, directory.name
    
    return None, ""

def find_most_recent_timestamped_file(base_filename: str, directories: List[Path]) -> Tuple[Optional[Path], str]:
    """
    Find the most recent timestamped version of a file
    
    Args:
        base_filename: Base filename without timestamp
        directories: List of directories to search
        
    Returns:
        Tuple of (most_recent_file_path, source_directory) or (None, "")
    """
    base_name = Path(base_filename).stem
    matching_files = []
    
    for directory in directories:
        for file_path in directory.glob(f"{base_name}_*"):
            if file_path.is_file() and file_path.suffix.lower() in settings.ALLOWED_EXTENSIONS:
                matching_files.append((file_path, directory.name))
    
    if matching_files:
        # Sort by modification time (most recent first), prioritizing intermediate over raw
        matching_files.sort(key=lambda x: (x[1] == "raw", -x[0].stat().st_mtime))
        return matching_files[0]
    
    return None, ""

def get_excel_sheet_names(file_path: Path) -> List[str]:
    """
    Get all sheet names from an Excel file
    
    Args:
        file_path: Path to Excel file
        
    Returns:
        List of sheet names
    """
    try:
        excel_file = pd.ExcelFile(file_path)
        return excel_file.sheet_names
    except Exception:
        return []

def get_excel_columns(file_path: Path, sheet_name: str, max_columns: int = None) -> List[str]:
    """
    Get column names from Excel sheet
    
    Args:
        file_path: Path to Excel file
        sheet_name: Name of the sheet
        max_columns: Maximum number of columns to return (None for all columns)
        
    Returns:
        List of column names (limited to max_columns if specified)
    """
    try:
        df = pd.read_excel(file_path, sheet_name=sheet_name, nrows=0)
        columns = df.columns.tolist()
        if max_columns is not None:
            return columns[:max_columns]
        return columns
    except Exception:
        return []

def get_excel_sheet_size(file_path: Path, sheet_name: str) -> Tuple[int, int]:
    """
    Get dimensions of an Excel sheet
    
    Args:
        file_path: Path to Excel file
        sheet_name: Name of the sheet
        
    Returns:
        Tuple of (rows, columns)
    """
    try:
        df = pd.read_excel(file_path, sheet_name=sheet_name)
        return df.shape
    except Exception:
        return 0, 0

def is_excel_file(filename: str) -> bool:
    """
    Check if file is an Excel file
    
    Args:
        filename: Name of the file
        
    Returns:
        bool: True if Excel file, False otherwise
    """
    return Path(filename).suffix.lower() in ['.xlsx', '.xls', '.xlsm']

def clean_filename(filename: str) -> str:
    """
    Clean filename by removing invalid characters
    
    Args:
        filename: Raw filename
        
    Returns:
        str: Cleaned filename safe for filesystem
    """
    # Remove or replace invalid characters
    invalid_chars = '<>:"/\\|?*'
    cleaned = filename
    for char in invalid_chars:
        cleaned = cleaned.replace(char, '_')
    return cleaned

def get_file_info(file_path: Path) -> dict:
    """
    Get comprehensive file information
    
    Args:
        file_path: Path to file
        
    Returns:
        dict: File information including size, modification time, etc.
    """
    if not file_path.exists():
        return {}
    
    stat_info = file_path.stat()
    return {
        "name": file_path.name,
        "size": stat_info.st_size,
        "modified": stat_info.st_mtime,
        "is_file": file_path.is_file(),
        "extension": file_path.suffix.lower()
    }
