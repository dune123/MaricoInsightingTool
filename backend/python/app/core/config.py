"""
========================================
BRANDBLOOM INSIGHTS - CORE CONFIGURATION
========================================

Purpose: Centralized application configuration and brand-specific data directory structure management

Description:
This module provides centralized configuration management for the BrandBloom Insights
FastAPI application. It defines all application settings, environment variables,
and configuration constants in one location for easy maintenance and deployment.
The module implements a brand-specific data directory structure where each brand
gets its own isolated directory for all data operations.

CRITICAL: Brand-Specific Data Directory Structure:
- /backend/python/<brandname>/data/ - Brand-specific root for all data operations
- /<brandname>/data/uploads/ - Brand-specific file upload operations (raw, intermediate, concatenated)  
- /<brandname>/data/exports/ - Brand-specific export operations (results, reports)
- /<brandname>/data/metadata/ - Brand-specific analysis metadata and state files
- Structure: <brandname>/data/<internal folders> NOT data/<internal folders>/<brandname>
- Global data/ folder is deprecated in favor of brand-specific structure

Key Functions:
- get_brand_directories(brand_name): Returns brand-specific directory paths
  - Sanitizes brand name for filesystem safety
  - Creates dictionary with all required directory paths
  - Implements <brandname>/data/<internal folders> structure
- create_brand_directories(brand_name): Creates brand-specific directory structure
  - Creates all necessary directories for a brand
  - Returns dictionary with created directory paths
  - Ensures proper directory hierarchy
- _sanitize_brand_name(brand_name): Sanitizes brand names for filesystem use
  - Converts to lowercase and removes special characters
  - Replaces spaces with hyphens
  - Ensures minimum length and filesystem safety

Configuration Categories:
- FastAPI Configuration: API metadata, documentation URLs, versioning
- Server Configuration: Host, port, reload settings
- CORS Configuration: Allowed origins, methods, headers for frontend integration
- File Configuration: Allowed extensions, maximum file size limits
- Directory Configuration: Brand-specific directory structure paths
- Data Quality Configuration: Minimum records, preserved columns
- Preview Configuration: Preview rows, filter options, data limits

Dependencies:
- pathlib: For cross-platform path management
- os: For environment variable access
- re: For brand name sanitization

Used by:
- main.py: For application initialization and server configuration
- All route modules: For consistent configuration access
- Service modules: For path and validation settings
- Utility modules: For shared constants and directory operations
- Factory module: For application configuration

Directory Structure Benefits:
- Brand isolation and data separation
- Easier backup and restore per brand
- Scalable multi-tenant architecture
- Cleaner data organization
- Better security and access control

Last Updated: 2025-08-17 - Brand-Specific Directory Structure Implementation
Author: BrandBloom Backend Team
"""

import os
from pathlib import Path
from typing import List

class Settings:
    """Application settings and configuration"""
    
    # FastAPI Configuration
    API_TITLE: str = "Marico's Insighting Tool API"
    API_DESCRIPTION: str = """
    🚀 **Marico's Insighting Tool** - Advanced Analytics Platform for Marketing Mix Modeling
    
    ## 🎯 Features
    - **Brand-Specific Data Management**: Each brand gets isolated directory structure
    - **Excel & CSV Processing**: Upload, concatenate, and process data files
    - **Advanced Filtering**: Real-time data filtering with multiple criteria
    - **MMM Analysis**: Marketing Mix Modeling capabilities
    - **Export & Reports**: Multiple export formats and automated reporting
    
    ## 📁 Directory Structure
    Each brand gets its own directory: `<brandname>/data/<internal folders>`
    
    ## 📚 Documentation
    - **API Reference**: [Interactive Docs](/docs) | [ReDoc](/redoc)
    - **Complete Guide**: [README](https://github.com/brandbloom/insights/blob/main/backend/python/README.md)
    - **API Details**: [API Documentation](https://github.com/brandbloom/insights/blob/main/backend/python/API_DOCUMENTATION.md)
    - **Directory Structure**: [Directory Guide](https://github.com/brandbloom/insights/blob/main/backend/python/DIRECTORY_STRUCTURE.md)
    - **Troubleshooting**: [Help Guide](https://github.com/brandbloom/insights/blob/main/backend/python/TROUBLESHOOTING.md)
    
    ## 🚀 Quick Start
    1. Create brand analysis: `POST /api/analyses`
    2. Upload data files: `POST /api/files/upload`
    3. Process data: `POST /api/concatenate-sheets`
    4. Filter and analyze: `POST /api/data/filtered`
    5. Export results: `POST /api/data/export`
    """
    API_VERSION: str = "1.0.0"
    DOCS_URL: str = "/docs"
    REDOC_URL: str = "/redoc"
    
    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    RELOAD: bool = True
    
    # CORS Configuration
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000", 
        "http://localhost:8080",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8080"
    ]
    ALLOW_CREDENTIALS: bool = True
    ALLOW_METHODS: List[str] = ["*"]
    ALLOW_HEADERS: List[str] = ["*"]
    
    # File Configuration
    ALLOWED_EXTENSIONS: List[str] = ['.xlsx', '.csv']
    MAX_FILE_SIZE: int = 100 * 1024 * 1024  # 100MB
    
    # Directory Configuration - BRAND-SPECIFIC DATA STRUCTURE
    BASE_DIR: Path = Path(__file__).parent.parent.parent
    
    # Legacy global data directory (deprecated, for backward compatibility only)
    DATA_DIR: Path = BASE_DIR / "data"
    UPLOAD_DIR: Path = DATA_DIR / "uploads"
    RAW_DIR: Path = UPLOAD_DIR / "raw"
    INTERMEDIATE_DIR: Path = UPLOAD_DIR / "intermediate"
    CONCAT_DIR: Path = UPLOAD_DIR / "concatenated"
    EXPORT_DIR: Path = DATA_DIR / "exports"
    PROCESSED_DIR: Path = EXPORT_DIR / "results"
    REPORTS_DIR: Path = EXPORT_DIR / "reports"
    METADATA_BASE_DIR: Path = DATA_DIR / "metadata"
    METADATA_DIR: Path = METADATA_BASE_DIR / "concatenation_states"
    ANALYSES_BASE_DIR: Path = METADATA_BASE_DIR / "analyses"
    
    # Data Quality Configuration
    MIN_DATA_RECORDS: int = 18
    PRESERVE_COLUMNS: set = {'packsize', 'region', 'channel', 'month'}
    
    # Preview Configuration
    PREVIEW_ROWS: int = 100
    MAX_FILTER_OPTIONS: int = 50
    DEFAULT_DATA_LIMIT: int = 1000
    
    def __init__(self):
        """Initialize settings - no automatic directory creation"""
        # No longer auto-create legacy directories
        # Only brand-specific directories will be created on demand
        pass
    
    def get_brand_directories(self, brand_name: str) -> dict:
        """
        Get brand-specific directory structure: <brandname>/data/<internal folders>
        
        Args:
            brand_name: Name of the brand (will be sanitized for filesystem use)
            
        Returns:
            dict: Dictionary with all brand-specific directory paths
        """
        # Sanitize brand name for filesystem use
        safe_brand_name = self._sanitize_brand_name(brand_name)
        
        # Brand-specific root directory: <brandname>/data/<internal folders>
        brand_dir = self.BASE_DIR / safe_brand_name
        brand_data_dir = brand_dir / "data"
        
        return {
            "brand_root": brand_dir,
            "data_dir": brand_data_dir,
            # Upload directories: <brandname>/data/uploads/<type>
            "upload_dir": brand_data_dir / "uploads",
            "raw_dir": brand_data_dir / "uploads" / "raw",
            "intermediate_dir": brand_data_dir / "uploads" / "intermediate",
            "concat_dir": brand_data_dir / "uploads" / "concatenated",
            # Export directories: <brandname>/data/exports/<type>
            "export_dir": brand_data_dir / "exports",
            "processed_dir": brand_data_dir / "exports" / "results",
            "reports_dir": brand_data_dir / "exports" / "reports",
            # Metadata directories: <brandname>/data/metadata/<type>
            "metadata_base_dir": brand_data_dir / "metadata",
            "metadata_dir": brand_data_dir / "metadata" / "concatenation_states",
            "analyses_dir": brand_data_dir / "metadata" / "analyses"
        }
    
    def create_brand_directories(self, brand_name: str) -> dict:
        """
        Create brand-specific directory structure
        
        Args:
            brand_name: Name of the brand
            
        Returns:
            dict: Dictionary with all created brand-specific directory paths
        """
        directories = self.get_brand_directories(brand_name)
        
        # Create all directories
        for dir_path in directories.values():
            dir_path.mkdir(parents=True, exist_ok=True)
            
        return directories
    
    def _sanitize_brand_name(self, brand_name: str) -> str:
        """
        Sanitize brand name for filesystem use
        
        Args:
            brand_name: Original brand name
            
        Returns:
            str: Sanitized brand name safe for filesystem use
        """
        import re
        
        # Convert to lowercase and replace spaces with hyphens
        sanitized = brand_name.lower().strip()
        # Remove special characters except hyphens and underscores
        sanitized = re.sub(r'[^a-z0-9\-_\s]', '', sanitized)
        # Replace spaces with hyphens
        sanitized = re.sub(r'\s+', '-', sanitized)
        # Remove multiple consecutive hyphens
        sanitized = re.sub(r'-+', '-', sanitized)
        # Remove leading/trailing hyphens
        sanitized = sanitized.strip('-')
        
        # Ensure minimum length
        if len(sanitized) < 2:
            sanitized = f"brand-{sanitized}"
            
        return sanitized

# Create global settings instance
settings = Settings()
