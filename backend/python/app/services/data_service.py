"""
========================================
BRANDBLOOM INSIGHTS - DATA SERVICE
========================================

Purpose: Data filtering, analysis, and processing service layer

Description:
This service module handles data analysis operations for the BrandBloom Insights
application. It provides data filtering, statistical analysis, data validation,
and export functionality for concatenated datasets.

Key Functionality:
- Real-time data filtering with multiple criteria
- Statistical analysis and data quality metrics
- Filter option generation and validation
- Data export and serialization
- Performance-optimized data operations
- Comprehensive error handling

Dependencies:
- pandas for data manipulation and analysis
- pathlib for file operations
- app.utils.data_utils for data processing
- app.core.config for settings

Used by:
- Route modules for data operations
- Filtering endpoints
- Data analysis workflows
- Export functionality

Last Updated: 2024-12-23
Author: BrandBloom Backend Team
"""

import pandas as pd
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime

from app.core.config import settings
from app.utils.file_utils import find_file_with_fallback
from app.utils.data_utils import convert_to_json_serializable, validate_dataframe
from app.models.data_models import FilterRequest, FilterData

class DataService:
    """Service class for data operations"""
    
    @staticmethod
    def get_filtered_data(request: FilterRequest, brand: str = None) -> Dict[str, Any]:
        """
        Apply filters to dataset and return filtered results
        
        Args:
            request: Filter request with filename, filters, columns, and limit
            
        Returns:
            Dict with filtered data and metadata
        """
        # Brand-specific directories ONLY - no legacy fallback
        if not brand:
            # Try to extract brand from filename if not provided
            brand = DataService._extract_brand_from_filename(request.filename)
            if not brand:
                raise ValueError("Brand parameter is required and could not be extracted from filename - no legacy fallback supported")
        
        brand_dirs = settings.get_brand_directories(brand)
        # Find the data file with priority order (brand-specific only)
        search_directories = [
            brand_dirs["concat_dir"],      # Brand concatenated files first
            brand_dirs["processed_dir"],   # Brand processed files
            brand_dirs["raw_dir"]         # Brand original uploads as fallback
        ]
        
        file_path, _ = find_file_with_fallback(request.filename, search_directories)
        if not file_path:
            raise FileNotFoundError(f"File not found: {request.filename}")
        
        # Load the dataset
        df = DataService._load_dataset(file_path)
        
        # Apply filters
        filtered_df, applied_filters = DataService._apply_filters(df, request.filters)
        
        # Select specific columns if requested
        if request.columns:
            available_columns = [col for col in request.columns if col in filtered_df.columns]
            if available_columns:
                filtered_df = filtered_df[available_columns]
        
        # Limit rows if necessary
        if len(filtered_df) > request.limit:
            filtered_df = filtered_df.head(request.limit)
        
        # Convert to JSON-serializable format
        result_data = DataService._convert_dataframe_to_dict(filtered_df)
        
        # Generate filter options
        filter_options = DataService._generate_filter_options(df, request.filters)
        
        return {
            "success": True,
            "message": f"Successfully filtered data: {len(result_data)} rows from {len(df)} total rows",
            "data": {
                "rows": result_data,
                "totalRows": len(result_data),
                "originalRows": len(df),
                "columns": list(filtered_df.columns),
                "appliedFilters": applied_filters,
                "filterOptions": filter_options,
                "filename": request.filename
            }
        }
    
    @staticmethod
    def analyze_dataset(file_path: Path) -> Dict[str, Any]:
        """
        Perform comprehensive analysis of dataset
        
        Args:
            file_path: Path to dataset file
            
        Returns:
            Dict with analysis results
        """
        df = DataService._load_dataset(file_path)
        
        # Basic validation
        validation_result = validate_dataframe(df)
        
        # Statistical analysis
        numeric_columns = df.select_dtypes(include=['number']).columns.tolist()
        categorical_columns = df.select_dtypes(include=['object']).columns.tolist()
        
        statistics = {
            "numeric_stats": df[numeric_columns].describe().to_dict() if numeric_columns else {},
            "categorical_stats": {
                col: {
                    "unique_count": df[col].nunique(),
                    "most_frequent": df[col].mode().iloc[0] if not df[col].mode().empty else None,
                    "null_count": df[col].isnull().sum()
                }
                for col in categorical_columns
            }
        }
        
        return {
            "validation": validation_result,
            "statistics": statistics,
            "column_info": {
                "total_columns": len(df.columns),
                "numeric_columns": len(numeric_columns),
                "categorical_columns": len(categorical_columns),
                "columns_by_type": {
                    "numeric": numeric_columns,
                    "categorical": categorical_columns
                }
            }
        }
    
    @staticmethod
    def export_filtered_data(request: FilterRequest, export_format: str = "csv") -> Path:
        """
        Export filtered data to specified format
        
        Args:
            request: Filter request
            export_format: Export format ('csv', 'xlsx', 'json')
            
        Returns:
            Path to exported file
        """
        # Get filtered data
        result = DataService.get_filtered_data(request)
        filtered_data = result["data"]["rows"]
        
        # Convert back to DataFrame for export
        df = pd.DataFrame(filtered_data)
        
        # Generate export filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_name = Path(request.filename).stem
        export_filename = f"{base_name}_filtered_{timestamp}.{export_format}"
        if not brand:
            brand = DataService._extract_brand_from_filename(request.filename)
            if not brand:
                raise ValueError("Brand parameter is required and could not be extracted from filename - no legacy fallback supported")
        
        brand_dirs = settings.get_brand_directories(brand)
        brand_dirs["processed_dir"].mkdir(parents=True, exist_ok=True)
        export_path = brand_dirs["processed_dir"] / export_filename
        
        # Export based on format
        if export_format.lower() == "csv":
            df.to_csv(export_path, index=False)
        elif export_format.lower() == "xlsx":
            df.to_excel(export_path, index=False)
        elif export_format.lower() == "json":
            df.to_json(export_path, orient='records', indent=2)
        else:
            raise ValueError(f"Unsupported export format: {export_format}")
        
        return export_path
    
    @staticmethod
    def _load_dataset(file_path: Path) -> pd.DataFrame:
        """Load dataset from file"""
        if file_path.suffix.lower() in ['.xlsx', '.xls', '.xlsm']:
            # For Excel files, read the first sheet or find concatenated sheet
            excel_file = pd.ExcelFile(file_path)
            sheet_names = excel_file.sheet_names
            
            # Try to find concatenated sheet first
            concat_sheet = None
            for sheet in sheet_names:
                if 'concatenated' in sheet.lower():
                    concat_sheet = sheet
                    break
            
            sheet_to_read = concat_sheet if concat_sheet else sheet_names[0]
            return pd.read_excel(file_path, sheet_name=sheet_to_read)
        elif file_path.suffix.lower() == '.csv':
            return pd.read_csv(file_path)
        else:
            raise ValueError(f"Unsupported file format: {file_path.suffix}")
    
    @staticmethod
    def _apply_filters(df: pd.DataFrame, filters: Dict[str, List[Any]]) -> tuple[pd.DataFrame, Dict[str, List[Any]]]:
        """Apply filters to dataframe"""
        filtered_df = df.copy()
        applied_filters = {}
        
        for filter_column, filter_values in filters.items():
            if filter_column in df.columns and filter_values:
                # Ensure filter_values is a list
                if not isinstance(filter_values, list):
                    filter_values = [filter_values]
                
                # Apply filter based on column type
                if df[filter_column].dtype == 'object':
                    # String column - case insensitive matching
                    filter_mask = filtered_df[filter_column].astype(str).str.lower().isin(
                        [str(val).lower() for val in filter_values]
                    )
                else:
                    # Numeric column - exact matching
                    filter_mask = filtered_df[filter_column].isin(filter_values)
                
                filtered_df = filtered_df[filter_mask]
                applied_filters[filter_column] = filter_values
        
        return filtered_df, applied_filters
    
    @staticmethod
    def _convert_dataframe_to_dict(df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Convert dataframe to list of dictionaries"""
        result_data = []
        for _, row in df.iterrows():
            row_dict = {}
            for col in df.columns:
                value = row[col]
                row_dict[col] = convert_to_json_serializable(value)
            result_data.append(row_dict)
        
        return result_data
    
    @staticmethod
    def _generate_filter_options(df: pd.DataFrame, requested_filters: Dict[str, List[Any]]) -> Dict[str, List[Any]]:
        """Generate filter options for frontend"""
        filter_options = {}
        
        # Include all columns if no specific filters requested
        columns_to_process = list(requested_filters.keys()) if requested_filters else df.columns.tolist()
        
        for col in columns_to_process:
            if col in df.columns:
                unique_vals = df[col].dropna().unique()
                # Convert to serializable format and limit to prevent UI overload
                filter_options[col] = [
                    convert_to_json_serializable(val)
                    for val in unique_vals[:settings.MAX_FILTER_OPTIONS]
                ]
        
        return filter_options
    
    @staticmethod
    def get_column_statistics(file_path: Path, column_name: str) -> Dict[str, Any]:
        """
        Get detailed statistics for a specific column
        
        Args:
            file_path: Path to dataset file
            column_name: Name of column to analyze
            
        Returns:
            Dict with column statistics
        """
        df = DataService._load_dataset(file_path)
        
        if column_name not in df.columns:
            raise ValueError(f"Column '{column_name}' not found in dataset")
        
        column_data = df[column_name]
        
        stats = {
            "column_name": column_name,
            "data_type": str(column_data.dtype),
            "total_count": len(column_data),
            "null_count": column_data.isnull().sum(),
            "unique_count": column_data.nunique(),
            "null_percentage": (column_data.isnull().sum() / len(column_data)) * 100
        }
        
        # Add type-specific statistics
        if pd.api.types.is_numeric_dtype(column_data):
            numeric_stats = column_data.describe()
            stats.update({
                "min": numeric_stats['min'],
                "max": numeric_stats['max'],
                "mean": numeric_stats['mean'],
                "median": numeric_stats['50%'],
                "std": numeric_stats['std']
            })
        else:
            # Categorical statistics
            value_counts = column_data.value_counts().head(10)
            stats.update({
                "most_frequent": value_counts.index[0] if not value_counts.empty else None,
                "most_frequent_count": value_counts.iloc[0] if not value_counts.empty else 0,
                "top_values": value_counts.to_dict()
            })
        
        return stats
    
    @staticmethod
    def _extract_brand_from_filename(filename: str) -> Optional[str]:
        """
        Extract brand name from filename
        
        Args:
            filename: The filename to extract brand from
            
        Returns:
            str or None: Extracted brand name or None if not identifiable
        """
        try:
            # Common patterns for brand extraction from filenames
            # Pattern 1: "NIELSEN - BRAND_NAME - ..." format
            if " - " in filename:
                parts = filename.split(" - ")
                if len(parts) >= 2:
                    # Second part is usually the brand name
                    brand_part = parts[1].strip()
                    # Remove common suffixes and file extensions
                    brand_part = brand_part.replace("_concatenated", "").replace(".xlsx", "").replace(".csv", "")
                    # Remove timestamp patterns like _1234567890
                    import re
                    brand_part = re.sub(r'_\d{10,}', '', brand_part)
                    return brand_part.strip()
            
            # Pattern 2: Brand name at the beginning before underscore or space
            # This is a fallback pattern
            base_name = filename.replace(".xlsx", "").replace(".csv", "")
            if "_" in base_name:
                potential_brand = base_name.split("_")[0]
                if len(potential_brand) > 2:  # Reasonable brand name length
                    return potential_brand
                    
            return None
            
        except Exception:
            return None
