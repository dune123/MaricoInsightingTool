"""
========================================
DATA QUALITY ENHANCER - EXCEL MODULE
========================================

Purpose: Data quality improvement and validation utilities

Description:
Handles data quality enhancement operations including empty column removal,
low-data column filtering, data type optimization, null value handling,
and data validation. Ensures high-quality datasets for analysis workflows.

Key Functionality:
- Empty column detection and removal
- Low-data column filtering based on record thresholds
- Data type optimization and conversion
- Null value analysis and handling
- Data validation and quality scoring
- Column standardization and cleanup

Business Logic:
- Remove columns with insufficient data (<18 records by default)
- Clean up empty rows and columns automatically
- Optimize data types for memory efficiency
- Standardize column names and formats
- Provide detailed quality reports and recommendations

Dependencies:
- pandas for data manipulation and analysis
- typing for type hints
- app.core.config for quality thresholds

Last Updated: 2024-12-23
Author: BrandBloom Backend Team
"""

import pandas as pd
import re
from typing import Dict, List, Any, Tuple, Optional
from datetime import datetime

from app.core.config import settings


class DataQualityEnhancer:
    """Handles data quality enhancement and validation operations"""
    
    @staticmethod
    def remove_empty_columns(df: pd.DataFrame) -> Tuple[pd.DataFrame, List[str]]:
        """
        Remove completely empty columns from DataFrame
        
        Args:
            df: DataFrame to process
            
        Returns:
            Tuple of (cleaned_dataframe, list_of_removed_columns)
        """
        if df.empty:
            return df, []
        
        # Identify completely empty columns (all null or empty string)
        empty_columns = []
        
        for col in df.columns:
            col_data = df[col]
            # Check if all values are null, empty string, or whitespace
            is_empty = (
                col_data.isna().all() or
                (col_data.astype(str).str.strip() == '').all() or
                col_data.astype(str).str.lower().isin(['', 'nan', 'null', 'none']).all()
            )
            
            if is_empty:
                empty_columns.append(col)
        
        # Remove empty columns
        if empty_columns:
            df_cleaned = df.drop(columns=empty_columns)
            print(f"      🗑️ Removed {len(empty_columns)} empty columns: {empty_columns}")
        else:
            df_cleaned = df.copy()
            print(f"      ✅ No empty columns found")
        
        return df_cleaned, empty_columns
    
    @staticmethod
    def remove_low_data_columns(df: pd.DataFrame, min_records: int = None) -> Tuple[pd.DataFrame, List[str]]:
        """
        Remove columns with insufficient data records
        
        Args:
            df: DataFrame to process
            min_records: Minimum number of non-null records required (default from settings)
            
        Returns:
            Tuple of (filtered_dataframe, list_of_removed_columns)
        """
        if df.empty:
            return df, []
        
        if min_records is None:
            min_records = getattr(settings, 'MIN_DATA_RECORDS', 18)
        
        removed_columns = []
        
        for col in df.columns:
            non_null_count = df[col].count()  # count() excludes NaN values
            
            if non_null_count < min_records:
                removed_columns.append(col)
                print(f"      🗑️ Removing column '{col}': only {non_null_count} records (< {min_records})")
        
        # Remove low-data columns
        if removed_columns:
            df_filtered = df.drop(columns=removed_columns)
            print(f"      📊 Data quality filter: removed {len(removed_columns)} columns with <{min_records} records")
        else:
            df_filtered = df.copy()
            print(f"      ✅ All columns meet minimum data requirement ({min_records} records)")
        
        return df_filtered, removed_columns
    
    @staticmethod
    def remove_empty_rows(df: pd.DataFrame) -> Tuple[pd.DataFrame, int]:
        """
        Remove completely empty rows from DataFrame
        
        Args:
            df: DataFrame to process
            
        Returns:
            Tuple of (cleaned_dataframe, number_of_removed_rows)
        """
        if df.empty:
            return df, 0
        
        initial_rows = len(df)
        df_cleaned = df.dropna(how='all')  # Remove rows where all values are NaN
        removed_rows = initial_rows - len(df_cleaned)
        
        if removed_rows > 0:
            print(f"      🗑️ Removed {removed_rows} completely empty rows")
        
        return df_cleaned, removed_rows
    
    @staticmethod
    def optimize_data_types(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, str]]:
        """
        Optimize DataFrame data types for memory efficiency
        
        Args:
            df: DataFrame to optimize
            
        Returns:
            Tuple of (optimized_dataframe, dict_of_type_changes)
        """
        if df.empty:
            return df, {}
        
        df_optimized = df.copy()
        type_changes = {}
        
        for col in df_optimized.columns:
            original_dtype = str(df_optimized[col].dtype)
            
            # Try to convert object columns to numeric if possible
            if df_optimized[col].dtype == 'object':
                # Try numeric conversion
                numeric_series = pd.to_numeric(df_optimized[col], errors='coerce')
                non_null_original = df_optimized[col].dropna()
                non_null_numeric = numeric_series.dropna()
                
                # If we didn't lose too much data in conversion, use numeric
                if len(non_null_numeric) >= 0.8 * len(non_null_original):
                    df_optimized[col] = numeric_series
                    type_changes[col] = f"{original_dtype} -> {df_optimized[col].dtype}"
                    continue
                
                # Try datetime conversion for date-like strings
                if DataQualityEnhancer._looks_like_date(df_optimized[col]):
                    try:
                        df_optimized[col] = pd.to_datetime(df_optimized[col], errors='coerce')
                        type_changes[col] = f"{original_dtype} -> datetime64[ns]"
                        continue
                    except:
                        pass
            
            # Optimize numeric types
            elif pd.api.types.is_numeric_dtype(df_optimized[col]):
                optimized_col = DataQualityEnhancer._optimize_numeric_column(df_optimized[col])
                if str(optimized_col.dtype) != original_dtype:
                    df_optimized[col] = optimized_col
                    type_changes[col] = f"{original_dtype} -> {optimized_col.dtype}"
        
        if type_changes:
            print(f"      🔢 Optimized data types for {len(type_changes)} columns")
        
        return df_optimized, type_changes
    
    @staticmethod
    def standardize_column_names(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, str]]:
        """
        Standardize column names by cleaning and normalizing them
        
        Args:
            df: DataFrame to process
            
        Returns:
            Tuple of (dataframe_with_clean_names, dict_of_name_changes)
        """
        if df.empty:
            return df, {}
        
        df_clean = df.copy()
        name_changes = {}
        
        new_columns = []
        for col in df_clean.columns:
            # Clean the column name
            clean_name = DataQualityEnhancer._clean_column_name(col)
            
            if clean_name != col:
                name_changes[col] = clean_name
            
            new_columns.append(clean_name)
        
        # Handle duplicate column names
        new_columns = DataQualityEnhancer._handle_duplicate_columns(new_columns)
        
        df_clean.columns = new_columns
        
        if name_changes:
            print(f"      🧹 Standardized {len(name_changes)} column names")
        
        return df_clean, name_changes
    
    @staticmethod
    def analyze_data_quality(df: pd.DataFrame) -> Dict[str, Any]:
        """
        Perform comprehensive data quality analysis
        
        Args:
            df: DataFrame to analyze
            
        Returns:
            Dict with detailed quality analysis
        """
        if df.empty:
            return {
                'empty_dataset': True,
                'quality_score': 0.0,
                'issues': ['Dataset is empty']
            }
        
        analysis = {
            'total_rows': len(df),
            'total_columns': len(df.columns),
            'memory_usage_mb': df.memory_usage(deep=True).sum() / 1024 / 1024,
            'quality_score': 0.0,
            'issues': [],
            'recommendations': []
        }
        
        # Analyze null values
        null_analysis = DataQualityEnhancer._analyze_null_values(df)
        analysis.update(null_analysis)
        
        # Analyze data types
        type_analysis = DataQualityEnhancer._analyze_data_types(df)
        analysis.update(type_analysis)
        
        # Analyze duplicates
        duplicate_analysis = DataQualityEnhancer._analyze_duplicates(df)
        analysis.update(duplicate_analysis)
        
        # Calculate overall quality score
        analysis['quality_score'] = DataQualityEnhancer._calculate_quality_score(analysis)
        
        # Generate recommendations
        analysis['recommendations'] = DataQualityEnhancer._generate_quality_recommendations(analysis)
        
        return analysis
    
    @staticmethod
    def apply_comprehensive_enhancement(df: pd.DataFrame, min_records: int = None) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Apply comprehensive data quality enhancement pipeline
        
        Args:
            df: DataFrame to enhance
            min_records: Minimum records threshold for column filtering
            
        Returns:
            Tuple of (enhanced_dataframe, enhancement_report)
        """
        if df.empty:
            return df, {'error': 'Cannot enhance empty dataset'}
        
        enhancement_report = {
            'original_shape': df.shape,
            'operations_performed': [],
            'improvements': {}
        }
        
        enhanced_df = df.copy()
        
        # Step 1: Remove empty rows
        enhanced_df, removed_rows = DataQualityEnhancer.remove_empty_rows(enhanced_df)
        if removed_rows > 0:
            enhancement_report['operations_performed'].append('removed_empty_rows')
            enhancement_report['improvements']['removed_empty_rows'] = removed_rows
        
        # Step 2: Remove empty columns
        enhanced_df, empty_columns = DataQualityEnhancer.remove_empty_columns(enhanced_df)
        if empty_columns:
            enhancement_report['operations_performed'].append('removed_empty_columns')
            enhancement_report['improvements']['removed_empty_columns'] = empty_columns
        
        # Step 3: Remove low-data columns
        enhanced_df, low_data_columns = DataQualityEnhancer.remove_low_data_columns(enhanced_df, min_records)
        if low_data_columns:
            enhancement_report['operations_performed'].append('removed_low_data_columns')
            enhancement_report['improvements']['removed_low_data_columns'] = low_data_columns
        
        # Step 4: Standardize column names
        enhanced_df, name_changes = DataQualityEnhancer.standardize_column_names(enhanced_df)
        if name_changes:
            enhancement_report['operations_performed'].append('standardized_column_names')
            enhancement_report['improvements']['standardized_column_names'] = name_changes
        
        # Step 5: Optimize data types
        enhanced_df, type_changes = DataQualityEnhancer.optimize_data_types(enhanced_df)
        if type_changes:
            enhancement_report['operations_performed'].append('optimized_data_types')
            enhancement_report['improvements']['optimized_data_types'] = type_changes
        
        enhancement_report['final_shape'] = enhanced_df.shape
        enhancement_report['rows_change'] = enhanced_df.shape[0] - df.shape[0]
        enhancement_report['columns_change'] = enhanced_df.shape[1] - df.shape[1]
        
        print(f"      ✅ Data quality enhancement complete: {df.shape} → {enhanced_df.shape}")
        
        return enhanced_df, enhancement_report
    
    @staticmethod
    def _clean_column_name(column_name: str) -> str:
        """Clean and standardize a single column name"""
        if not column_name:
            return 'unnamed_column'
        
        # Convert to string and strip whitespace
        clean_name = str(column_name).strip()
        
        # Remove special characters except underscores and hyphens
        clean_name = re.sub(r'[^\w\s\-]', '', clean_name)
        
        # Replace multiple spaces with single space
        clean_name = re.sub(r'\s+', ' ', clean_name)
        
        # Replace spaces with underscores for consistent naming
        clean_name = clean_name.replace(' ', '_')
        
        # Remove consecutive underscores
        clean_name = re.sub(r'_+', '_', clean_name)
        
        # Remove leading/trailing underscores
        clean_name = clean_name.strip('_')
        
        # Ensure non-empty result
        if not clean_name:
            clean_name = 'unnamed_column'
        
        return clean_name
    
    @staticmethod
    def _handle_duplicate_columns(column_names: List[str]) -> List[str]:
        """Handle duplicate column names by adding numeric suffixes"""
        seen = {}
        result = []
        
        for name in column_names:
            if name in seen:
                seen[name] += 1
                result.append(f"{name}_{seen[name]}")
            else:
                seen[name] = 0
                result.append(name)
        
        return result
    
    @staticmethod
    def _looks_like_date(series: pd.Series) -> bool:
        """Check if a series looks like it contains date values"""
        if series.empty:
            return False
        
        # Sample a few non-null values
        sample = series.dropna().head(10)
        date_like_count = 0
        
        date_patterns = [
            r'\d{4}-\d{1,2}-\d{1,2}',  # YYYY-MM-DD
            r'\d{1,2}/\d{1,2}/\d{4}',  # MM/DD/YYYY
            r'\w{3}-\d{2}',            # MMM-YY
            r'\w{3}\s+\d{4}'           # MMM YYYY
        ]
        
        for value in sample:
            value_str = str(value)
            for pattern in date_patterns:
                if re.search(pattern, value_str):
                    date_like_count += 1
                    break
        
        # If more than 50% look like dates, consider it a date column
        return date_like_count > len(sample) * 0.5
    
    @staticmethod
    def _optimize_numeric_column(series: pd.Series) -> pd.Series:
        """Optimize numeric column to smallest appropriate dtype"""
        if not pd.api.types.is_numeric_dtype(series):
            return series
        
        # Check if it's integer-like
        if series.dropna().apply(lambda x: float(x).is_integer()).all():
            # Try to downcast integers
            min_val = series.min()
            max_val = series.max()
            
            if min_val >= 0:  # Unsigned integers
                if max_val <= 255:
                    return series.astype('uint8')
                elif max_val <= 65535:
                    return series.astype('uint16')
                elif max_val <= 4294967295:
                    return series.astype('uint32')
            else:  # Signed integers
                if -128 <= min_val and max_val <= 127:
                    return series.astype('int8')
                elif -32768 <= min_val and max_val <= 32767:
                    return series.astype('int16')
                elif -2147483648 <= min_val and max_val <= 2147483647:
                    return series.astype('int32')
        
        # For floating point, try float32 if precision allows
        try:
            float32_series = series.astype('float32')
            if float32_series.equals(series.astype('float64')):
                return float32_series
        except:
            pass
        
        return series
    
    @staticmethod
    def _analyze_null_values(df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze null values in DataFrame"""
        null_counts = df.isnull().sum()
        total_cells = len(df) * len(df.columns)
        total_nulls = null_counts.sum()
        
        return {
            'null_analysis': {
                'total_nulls': int(total_nulls),
                'null_percentage': (total_nulls / total_cells * 100) if total_cells > 0 else 0,
                'columns_with_nulls': int((null_counts > 0).sum()),
                'worst_columns': null_counts.nlargest(5).to_dict()
            }
        }
    
    @staticmethod
    def _analyze_data_types(df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze data types in DataFrame"""
        type_counts = df.dtypes.value_counts()
        
        return {
            'type_analysis': {
                'data_types': type_counts.to_dict(),
                'object_columns': len(df.select_dtypes(include=['object']).columns),
                'numeric_columns': len(df.select_dtypes(include=['number']).columns),
                'datetime_columns': len(df.select_dtypes(include=['datetime']).columns)
            }
        }
    
    @staticmethod
    def _analyze_duplicates(df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze duplicate rows in DataFrame"""
        duplicate_count = df.duplicated().sum()
        
        return {
            'duplicate_analysis': {
                'duplicate_rows': int(duplicate_count),
                'duplicate_percentage': (duplicate_count / len(df) * 100) if len(df) > 0 else 0,
                'unique_rows': len(df) - duplicate_count
            }
        }
    
    @staticmethod
    def _calculate_quality_score(analysis: Dict[str, Any]) -> float:
        """Calculate overall data quality score (0-100)"""
        score = 100.0
        
        # Penalize for null values
        null_penalty = min(analysis.get('null_analysis', {}).get('null_percentage', 0) * 0.5, 30)
        score -= null_penalty
        
        # Penalize for duplicates
        duplicate_penalty = min(analysis.get('duplicate_analysis', {}).get('duplicate_percentage', 0) * 0.3, 20)
        score -= duplicate_penalty
        
        # Bonus for good data type distribution
        type_analysis = analysis.get('type_analysis', {})
        if type_analysis.get('numeric_columns', 0) > 0:
            score += 5  # Bonus for having numeric data
        
        return max(0.0, min(100.0, score))
    
    @staticmethod
    def _generate_quality_recommendations(analysis: Dict[str, Any]) -> List[str]:
        """Generate recommendations based on quality analysis"""
        recommendations = []
        
        null_analysis = analysis.get('null_analysis', {})
        if null_analysis.get('null_percentage', 0) > 10:
            recommendations.append("Consider handling missing values - high null percentage detected")
        
        duplicate_analysis = analysis.get('duplicate_analysis', {})
        if duplicate_analysis.get('duplicate_rows', 0) > 0:
            recommendations.append("Remove duplicate rows to improve data quality")
        
        type_analysis = analysis.get('type_analysis', {})
        if type_analysis.get('object_columns', 0) > type_analysis.get('numeric_columns', 0):
            recommendations.append("Consider converting text columns to appropriate data types")
        
        if analysis.get('quality_score', 0) < 70:
            recommendations.append("Overall data quality is below recommended threshold")
        
        return recommendations
