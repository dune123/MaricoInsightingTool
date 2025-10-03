"""
========================================
DATE FORMATTER - EXCEL MODULE
========================================

Purpose: Date and month formatting utilities for Excel operations

Description:
Handles date and month formatting operations across Excel sheets including
month value conversion, date parsing, chronological sorting, and format
standardization. Ensures consistent date handling for price sheets and
temporal data analysis.

Key Functionality:
- Month format conversion to standard MMM-YY format
- Date parsing from various input formats
- Chronological sorting of DataFrames by date columns
- Month format normalization for cross-sheet consistency
- Excel-compatible date format generation

Business Logic:
- Standardize month formats for proper chronological ordering
- Handle various input date formats (strings, timestamps, numeric)
- Convert text months to Excel-compatible date formats
- Support regional date format variations
- Maintain data integrity during format conversions

Dependencies:
- pandas for date manipulation and DataFrame operations
- datetime for timestamp operations
- re for pattern matching

Last Updated: 2024-12-23
Author: BrandBloom Backend Team
"""

import pandas as pd
import re
from typing import Optional, Any
from datetime import datetime


class DateFormatter:
    """Handles date and month formatting operations for Excel processing"""
    
    # Month name mappings for conversion
    MONTH_MAPPING = {
        'JAN': '01', 'JANUARY': '01',
        'FEB': '02', 'FEBRUARY': '02', 
        'MAR': '03', 'MARCH': '03',
        'APR': '04', 'APRIL': '04',
        'MAY': '05',
        'JUN': '06', 'JUNE': '06',
        'JUL': '07', 'JULY': '07',
        'AUG': '08', 'AUGUST': '08',
        'SEP': '09', 'SEPTEMBER': '09', 'SEPT': '09',
        'OCT': '10', 'OCTOBER': '10',
        'NOV': '11', 'NOVEMBER': '11',
        'DEC': '12', 'DECEMBER': '12'
    }
    
    # Month abbreviations for display
    MONTH_ABBREVIATIONS = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ]
    
    @staticmethod
    def format_month_to_date(month_value: Any) -> Optional[str]:
        """
        Convert month value to proper date format (MMM-YY) for correct chronological sorting
        
        This method handles various month formats and converts them to a standardized
        MMM-YY format that Excel can recognize as dates and sort chronologically.
        
        Args:
            month_value: Month value in various formats (string, date, etc.)
            
        Returns:
            Formatted month string in MMM-YY format, or None if conversion fails
        """
        try:
            if pd.isna(month_value):
                return None
                
            month_str = str(month_value).strip()
            
            # If already in MMM-YY format, validate and return
            if DateFormatter._is_mmm_yy_format(month_str):
                return month_str
            
            # Try to parse as pandas datetime
            parsed_date = DateFormatter._try_parse_datetime(month_value)
            if parsed_date:
                return parsed_date.strftime('%b-%y')
            
            # Handle common text formats
            formatted_date = DateFormatter._parse_text_month_format(month_str)
            if formatted_date:
                return formatted_date
            
            # If we can't parse it, return the original value (better than None)
            print(f"      ⚠️ Could not parse month format: '{month_value}', using as-is")
            return month_str
            
        except Exception as e:
            print(f"      ❌ Error formatting month '{month_value}': {str(e)}")
            return None
    
    @staticmethod
    def sort_dataframe_by_date(df: pd.DataFrame, date_column: str = 'Month') -> pd.DataFrame:
        """
        Sort DataFrame by Region and then by Month in chronological order
        
        This method ensures that months are sorted chronologically rather than alphabetically,
        which is crucial for time-series analysis and proper data visualization.
        
        Args:
            df: DataFrame with date column to sort
            date_column: Name of the date column to sort by
            
        Returns:
            Sorted DataFrame
        """
        try:
            # Create a copy to avoid modifying the original
            df_sorted = df.copy()
            
            if date_column not in df_sorted.columns:
                print(f"      ⚠️ Date column '{date_column}' not found, returning unsorted")
                return df_sorted
            
            # Create a proper datetime column for sorting
            df_sorted['sort_date'] = pd.to_datetime(df_sorted[date_column], format='%b-%y', errors='coerce')
            
            # Sort by Region first (if available), then by chronological date
            sort_columns = []
            if 'Region' in df_sorted.columns:
                sort_columns.append('Region')
            sort_columns.append('sort_date')
            
            df_sorted = df_sorted.sort_values(sort_columns).reset_index(drop=True)
            
            # Remove the temporary sort column
            df_sorted = df_sorted.drop(columns=['sort_date'])
            
            print(f"      ✅ Data sorted by {', '.join(sort_columns[:-1] + ['chronological Month'])} order")
            return df_sorted
            
        except Exception as e:
            print(f"      ⚠️ Error sorting by date, using basic sort: {str(e)}")
            # Fallback to basic sorting
            sort_columns = ['Region', date_column] if 'Region' in df.columns else [date_column]
            return df.sort_values(sort_columns).reset_index(drop=True)
    
    @staticmethod
    def normalize_month_formats(df: pd.DataFrame, month_column: str) -> pd.DataFrame:
        """
        Normalize all month formats in a DataFrame to consistent MMM-YY format
        
        Args:
            df: DataFrame containing month data
            month_column: Name of the month column to normalize
            
        Returns:
            DataFrame with normalized month formats
        """
        if month_column not in df.columns:
            return df
        
        df_normalized = df.copy()
        
        # Apply format normalization to each month value
        df_normalized[month_column] = df_normalized[month_column].apply(
            DateFormatter.format_month_to_date
        )
        
        # Remove rows where month formatting failed (returned None)
        initial_rows = len(df_normalized)
        df_normalized = df_normalized.dropna(subset=[month_column])
        removed_rows = initial_rows - len(df_normalized)
        
        if removed_rows > 0:
            print(f"      ⚠️ Removed {removed_rows} rows with invalid month formats")
        
        return df_normalized
    
    @staticmethod
    def validate_date_format(date_string: str, expected_format: str = '%b-%y') -> bool:
        """
        Validate that a date string matches the expected format
        
        Args:
            date_string: Date string to validate
            expected_format: Expected date format pattern
            
        Returns:
            True if date string matches expected format
        """
        try:
            datetime.strptime(date_string, expected_format)
            return True
        except (ValueError, TypeError):
            return False
    
    @staticmethod
    def convert_to_excel_date(date_value: Any) -> Optional[str]:
        """
        Convert various date formats to Excel-compatible date string
        
        Args:
            date_value: Date value to convert
            
        Returns:
            Excel-compatible date string or None if conversion fails
        """
        try:
            if pd.isna(date_value):
                return None
            
            # If it's already a datetime, format it
            if isinstance(date_value, (pd.Timestamp, datetime)):
                return date_value.strftime('%m/%d/%Y')
            
            # Try to parse as datetime
            parsed = pd.to_datetime(date_value, errors='coerce')
            if pd.notna(parsed):
                return parsed.strftime('%m/%d/%Y')
            
            return str(date_value)
            
        except Exception:
            return str(date_value) if date_value else None
    
    @staticmethod
    def get_date_range_info(df: pd.DataFrame, date_column: str) -> dict:
        """
        Get information about the date range in a DataFrame
        
        Args:
            df: DataFrame containing date data
            date_column: Name of the date column to analyze
            
        Returns:
            Dict with date range information
        """
        info = {
            'has_date_column': date_column in df.columns,
            'total_rows': len(df),
            'valid_dates': 0,
            'invalid_dates': 0,
            'date_range': None,
            'unique_dates': []
        }
        
        if not info['has_date_column']:
            return info
        
        try:
            # Parse dates and count valid/invalid
            parsed_dates = pd.to_datetime(df[date_column], format='%b-%y', errors='coerce')
            info['valid_dates'] = parsed_dates.notna().sum()
            info['invalid_dates'] = parsed_dates.isna().sum()
            
            # Get date range
            if info['valid_dates'] > 0:
                valid_dates = parsed_dates.dropna()
                info['date_range'] = {
                    'start': valid_dates.min().strftime('%b-%y'),
                    'end': valid_dates.max().strftime('%b-%y')
                }
                info['unique_dates'] = sorted(df[date_column].dropna().unique().tolist())
            
        except Exception as e:
            info['error'] = str(e)
        
        return info
    
    @staticmethod
    def _is_mmm_yy_format(date_string: str) -> bool:
        """Check if string is already in MMM-YY format"""
        try:
            return (len(date_string) == 6 and 
                    date_string[3] == '-' and
                    DateFormatter.validate_date_format(date_string, '%b-%y'))
        except:
            return False
    
    @staticmethod
    def _try_parse_datetime(date_value: Any) -> Optional[pd.Timestamp]:
        """Try to parse date value as pandas datetime"""
        try:
            # If it's already a datetime object
            if hasattr(date_value, 'strftime'):
                return pd.Timestamp(date_value)
            
            # Try to parse the string as a date
            parsed_date = pd.to_datetime(date_value, errors='coerce')
            if pd.notna(parsed_date):
                return parsed_date
            
            return None
        except:
            return None
    
    @staticmethod
    def _parse_text_month_format(month_str: str) -> Optional[str]:
        """Parse various text month formats"""
        try:
            month_str_upper = month_str.upper()
            
            # Pattern for "Jan 2023", "January 2023", etc.
            match = re.search(r'(\w+)\s+(\d{2,4})', month_str_upper)
            if match:
                month_name = match.group(1)
                year = match.group(2)
                if month_name in DateFormatter.MONTH_MAPPING:
                    year_short = year[-2:] if len(year) == 4 else year
                    month_abbr = list(DateFormatter.MONTH_MAPPING.keys())[
                        list(DateFormatter.MONTH_MAPPING.values()).index(DateFormatter.MONTH_MAPPING[month_name])
                    ]
                    return f"{month_abbr.capitalize()}-{year_short}"
            
            # Pattern for "2023-01", "2023/01", etc.
            match = re.search(r'(\d{2,4})[/-](\d{1,2})', month_str)
            if match:
                year = match.group(1)
                month_num = match.group(2).zfill(2)
                year_short = year[-2:] if len(year) == 4 else year
                
                # Convert month number to abbreviation
                if 1 <= int(month_num) <= 12:
                    month_abbr = DateFormatter.MONTH_ABBREVIATIONS[int(month_num)-1]
                    return f"{month_abbr}-{year_short}"
            
            return None
            
        except Exception:
            return None
