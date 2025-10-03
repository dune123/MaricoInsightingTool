"""
========================================
DATA STANDARDIZATION SERVICE
========================================

Purpose: Handle data standardization for Non-MMM analysis workflows

Description:
This service provides comprehensive data standardization capabilities for
Non-MMM analysis, including multiple standardization methods, file creation,
and metadata tracking. It ensures that data is properly preprocessed before
statistical modeling to improve model performance and variable comparability.

Key Functionality:
- Apply various standardization methods to numeric data
- Create standardized Excel files with proper naming
- Track standardization metadata and parameters
- Handle different data types and edge cases
- Maintain data integrity and structure

Standardization Methods:
- Z-Score: (x - mean) / std
- Min-Max: (x - min) / (max - min)
- Robust: (x - median) / IQR
- Unit Vector: x / ||x||

Dependencies:
- pandas for data manipulation
- numpy for mathematical operations
- openpyxl for Excel file operations
- pathlib for file system operations

Used by:
- Non-MMM analysis workflows
- Statistical modeling endpoints
- Data preprocessing pipelines

Last Updated: 2025-01-31
Author: BrandBloom Backend Team
"""

import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Any
from datetime import datetime
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class DataStandardizationService:
    """
    Service for standardizing data in Non-MMM analysis workflows
    """
    
    # Standardization methods
    STANDARDIZATION_METHODS = {
        'zscore': 'Z-Score Standardization',
        'minmax': 'Min-Max Scaling',
        'robust': 'Robust Scaling',
        'unit_vector': 'Unit Vector Scaling'
    }
    
    @staticmethod
    def standardize_dataframe(
        df: pd.DataFrame, 
        method: str = 'zscore',
        columns_to_standardize: Optional[List[str]] = None,
        preserve_columns: Optional[List[str]] = None
    ) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Apply standardization to a DataFrame
        
        Args:
            df: Input DataFrame
            method: Standardization method ('zscore', 'minmax', 'robust', 'unit_vector')
            columns_to_standardize: Specific columns to standardize (None = all numeric)
            preserve_columns: Columns to preserve without standardization
            
        Returns:
            Tuple of (standardized_dataframe, standardization_metadata)
        """
        try:
            if method not in DataStandardizationService.STANDARDIZATION_METHODS:
                raise ValueError(f"Unsupported standardization method: {method}")
            
            # Create a copy to avoid modifying original data
            df_standardized = df.copy()
            
            # Determine columns to standardize
            if columns_to_standardize is None:
                # Standardize all numeric columns
                numeric_columns = df.select_dtypes(include=[np.number]).columns.tolist()
            else:
                # Validate specified columns exist
                missing_columns = [col for col in columns_to_standardize if col not in df.columns]
                if missing_columns:
                    raise ValueError(f"Columns not found in DataFrame: {missing_columns}")
                numeric_columns = columns_to_standardize
            
            # Remove preserve columns from standardization
            if preserve_columns:
                numeric_columns = [col for col in numeric_columns if col not in preserve_columns]
            
            if not numeric_columns:
                logger.warning("No numeric columns found for standardization")
                return df_standardized, {"method": method, "columns_standardized": [], "metadata": {}}
            
            # Store original statistics for metadata
            standardization_metadata = {
                "method": method,
                "columns_standardized": numeric_columns,
                "timestamp": datetime.now().isoformat(),
                "original_shape": [int(df.shape[0]), int(df.shape[1])],  # Convert to Python int
                "column_statistics": {}
            }
            
            # Apply standardization method
            for column in numeric_columns:
                original_values = df[column].dropna()
                
                if len(original_values) == 0:
                    logger.warning(f"Column {column} has no valid values, skipping standardization")
                    continue
                
                # Calculate statistics for metadata
                column_stats = {
                    "original_mean": float(original_values.mean()),
                    "original_std": float(original_values.std()),
                    "original_min": float(original_values.min()),
                    "original_max": float(original_values.max()),
                    "original_median": float(original_values.median()),
                    "original_q25": float(original_values.quantile(0.25)),
                    "original_q75": float(original_values.quantile(0.75)),
                    "valid_count": int(len(original_values)),  # Convert to Python int
                    "null_count": int(df[column].isnull().sum())  # Convert to Python int
                }
                
                # Apply standardization
                if method == 'zscore':
                    df_standardized[column] = (df[column] - original_values.mean()) / original_values.std()
                    column_stats["standardized_mean"] = 0.0
                    column_stats["standardized_std"] = 1.0
                    
                elif method == 'minmax':
                    min_val = original_values.min()
                    max_val = original_values.max()
                    if max_val != min_val:  # Avoid division by zero
                        df_standardized[column] = (df[column] - min_val) / (max_val - min_val)
                    else:
                        df_standardized[column] = 0.0  # Constant column
                    column_stats["standardized_min"] = 0.0
                    column_stats["standardized_max"] = 1.0
                    
                elif method == 'robust':
                    median_val = original_values.median()
                    q75 = original_values.quantile(0.75)
                    q25 = original_values.quantile(0.25)
                    iqr = q75 - q25
                    if iqr != 0:  # Avoid division by zero
                        df_standardized[column] = (df[column] - median_val) / iqr
                    else:
                        df_standardized[column] = 0.0  # Constant column
                    column_stats["standardized_median"] = 0.0
                    column_stats["standardized_iqr"] = 1.0
                    
                elif method == 'unit_vector':
                    # Calculate L2 norm for each row (excluding NaN values)
                    df_standardized[column] = df[column] / np.sqrt((df[column] ** 2).sum())
                    column_stats["standardized_norm"] = 1.0
                
                standardization_metadata["column_statistics"][column] = column_stats
            
            logger.info(f"Successfully standardized {len(numeric_columns)} columns using {method} method")
            return df_standardized, standardization_metadata
            
        except Exception as e:
            logger.error(f"Error in data standardization: {str(e)}")
            raise
    
    @staticmethod
    def create_standardized_file(
        original_file_path: Path,
        brand: str,
        analysis_id: str,
        method: str = 'zscore',
        columns_to_standardize: Optional[List[str]] = None,
        preserve_columns: Optional[List[str]] = None
    ) -> Tuple[Path, Dict[str, Any]]:
        """
        Create a standardized Excel file from an original file
        
        Args:
            original_file_path: Path to the original Excel file
            brand: Brand name for directory structure
            analysis_id: Analysis ID for file naming
            method: Standardization method
            columns_to_standardize: Specific columns to standardize
            preserve_columns: Columns to preserve without standardization
            
        Returns:
            Tuple of (standardized_file_path, standardization_metadata)
        """
        try:
            # Validate input file exists
            if not original_file_path.exists():
                raise FileNotFoundError(f"Original file not found: {original_file_path}")
            
            # Get brand directories
            brand_dirs = settings.get_brand_directories(brand)
            
            # Create standardized directory if it doesn't exist
            standardized_dir = brand_dirs["upload_dir"] / "standardized"
            standardized_dir.mkdir(parents=True, exist_ok=True)
            
            # Generate standardized filename
            original_name = original_file_path.stem
            # Use simple naming pattern as requested: <rawfilename>_std
            standardized_filename = f"{original_name}_std.xlsx"
            standardized_file_path = standardized_dir / standardized_filename
            
            # Read original data
            if original_file_path.suffix.lower() == '.xlsx':
                df = pd.read_excel(original_file_path)
            elif original_file_path.suffix.lower() == '.csv':
                df = pd.read_csv(original_file_path)
            else:
                raise ValueError(f"Unsupported file format: {original_file_path.suffix}")
            
            logger.info(f"Read original data: {df.shape} from {original_file_path}")
            
            # Apply standardization
            df_standardized, standardization_metadata = DataStandardizationService.standardize_dataframe(
                df, method, columns_to_standardize, preserve_columns
            )
            
            # Add file metadata
            standardization_metadata.update({
                "original_file": str(original_file_path),
                "standardized_file": str(standardized_file_path),
                "brand": brand,
                "analysis_id": analysis_id,
                "file_size_bytes": int(original_file_path.stat().st_size),  # Convert to Python int
                "standardized_shape": [int(df_standardized.shape[0]), int(df_standardized.shape[1])]  # Convert to Python int
            })
            
            # Save standardized data
            df_standardized.to_excel(standardized_file_path, index=False)
            
            # Verify file was created successfully
            if not standardized_file_path.exists():
                raise FileNotFoundError(f"Standardized file was not created: {standardized_file_path}")
            
            file_size = standardized_file_path.stat().st_size
            logger.info(f"✅ Created standardized file: {standardized_file_path}")
            logger.info(f"✅ File size: {file_size} bytes")
            logger.info(f"✅ Data shape: {df_standardized.shape}")
            
            # Save standardization metadata
            metadata_dir = brand_dirs["metadata_dir"] / "standardization"
            metadata_dir.mkdir(parents=True, exist_ok=True)
            
            metadata_file = metadata_dir / f"{analysis_id}_{method}.json"
            import json
            with open(metadata_file, 'w') as f:
                json.dump(standardization_metadata, f, indent=2)
            
            logger.info(f"✅ Saved metadata: {metadata_file}")
            
            return standardized_file_path, standardization_metadata
            
        except Exception as e:
            logger.error(f"Error creating standardized file: {str(e)}")
            raise
    
    @staticmethod
    def get_standardization_metadata(
        brand: str,
        analysis_id: str,
        method: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get standardization metadata for a brand and analysis
        
        Args:
            brand: Brand name
            analysis_id: Analysis ID
            method: Optional method filter
            
        Returns:
            List of standardization metadata dictionaries
        """
        try:
            brand_dirs = settings.get_brand_directories(brand)
            metadata_dir = brand_dirs["metadata_dir"] / "standardization"
            
            if not metadata_dir.exists():
                return []
            
            metadata_files = []
            for file_path in metadata_dir.glob(f"{analysis_id}_*.json"):
                if method is None or method in file_path.name:
                    import json
                    with open(file_path, 'r') as f:
                        metadata = json.load(f)
                        metadata["metadata_file"] = str(file_path)
                        metadata_files.append(metadata)
            
            # Sort by timestamp (newest first)
            metadata_files.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
            
            return metadata_files
            
        except Exception as e:
            logger.error(f"Error getting standardization metadata: {str(e)}")
            return []
    
    @staticmethod
    def find_standardized_file(
        original_filename: str,
        brand: str,
        method: Optional[str] = None
    ) -> Optional[Path]:
        """
        Find a standardized file for a given original file
        
        Args:
            original_filename: Name of the original file
            brand: Brand name
            method: Optional method filter
            
        Returns:
            Path to standardized file if found, None otherwise
        """
        try:
            brand_dirs = settings.get_brand_directories(brand)
            standardized_dir = brand_dirs["upload_dir"] / "standardized"
            
            if not standardized_dir.exists():
                return None
            
            # Look for standardized files matching the original filename
            original_name = Path(original_filename).stem
            standardized_filename = f"{original_name}_std.xlsx"
            standardized_file_path = standardized_dir / standardized_filename
            
            # Check if the exact file exists
            if standardized_file_path.exists():
                return standardized_file_path
            
            # File not found
            return None
            
        except Exception as e:
            logger.error(f"Error finding standardized file: {str(e)}")
            return None
    
    @staticmethod
    def validate_standardization_input(
        df: pd.DataFrame,
        columns_to_standardize: Optional[List[str]] = None,
        preserve_columns: Optional[List[str]] = None
    ) -> Tuple[bool, List[str]]:
        """
        Validate input for standardization
        
        Args:
            df: Input DataFrame
            columns_to_standardize: Columns to standardize
            preserve_columns: Columns to preserve
            
        Returns:
            Tuple of (is_valid, error_messages)
        """
        errors = []
        
        # Check DataFrame is not empty
        if df.empty:
            errors.append("DataFrame is empty")
        
        # Check specified columns exist
        if columns_to_standardize:
            missing_columns = [col for col in columns_to_standardize if col not in df.columns]
            if missing_columns:
                errors.append(f"Columns not found: {missing_columns}")
        
        # Check preserve columns exist
        if preserve_columns:
            missing_preserve = [col for col in preserve_columns if col not in df.columns]
            if missing_preserve:
                errors.append(f"Preserve columns not found: {missing_preserve}")
        
        # Check for numeric columns
        numeric_columns = df.select_dtypes(include=[np.number]).columns.tolist()
        if not numeric_columns:
            errors.append("No numeric columns found for standardization")
        
        return len(errors) == 0, errors
