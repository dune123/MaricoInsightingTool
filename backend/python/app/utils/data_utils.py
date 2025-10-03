"""
========================================
BRANDBLOOM INSIGHTS - DATA UTILITIES
========================================

Purpose: Data processing and transformation utilities for Excel operations

Description:
This module provides specialized data processing utilities for the BrandBloom Insights
application. It includes column categorization, data quality filtering, business
logic transformations, and data validation functions.

Key Functionality:
- Business column categorization logic
- Data quality filtering and validation
- Column value determination from sheet names
- Data cleaning and preprocessing utilities
- Statistical data analysis helpers
- Type conversion and serialization

Dependencies:
- pandas for data manipulation
- datetime for timestamp handling
- typing for type annotations

Used by:
- Service modules for data processing
- Route modules for data transformation
- Excel processing workflows
- Data quality enhancement features

Last Updated: 2024-12-23
Author: BrandBloom Backend Team
"""

import pandas as pd
from datetime import datetime
from typing import Dict, List, Tuple, Any
from app.core.config import settings

def categorize_columns(columns: List[str]) -> Dict[str, List[str]]:
    """
    Categorize columns into business-relevant groups based on column names
    
    Categories:
    1. Revenue: Contains "Volume", "Value", or "Unit" (case-insensitive)
    2. Distribution: Contains "WTD" or "Stores" (case-insensitive)
    3. Pricing: Contains "Price" or "RPI" (case-insensitive)
    4. Promotion: Contains "Promo", "TUP", or "BTL" (case-insensitive)
    5. Media: Contains "GRP" or "Spend" (case-insensitive)
    6. Others: All other columns
    
    Args:
        columns: List of column names to categorize
        
    Returns:
        Dict with categorized column lists
    """
    categorized = {
        "Revenue": [],
        "Distribution": [],
        "Pricing": [],
        "Promotion": [],
        "Media": [],
        "Others": []
    }
    
    for col in columns:
        col_upper = col.upper()
        categorized_flag = False
        
        # Revenue category
        if any(keyword in col_upper for keyword in ["VOLUME", "VALUE", "UNIT"]):
            categorized["Revenue"].append(col)
            categorized_flag = True
        
        # Distribution category
        elif any(keyword in col_upper for keyword in ["WTD", "STORES"]):
            categorized["Distribution"].append(col)
            categorized_flag = True
        
        # Pricing category
        elif any(keyword in col_upper for keyword in ["PRICE", "RPI"]):
            categorized["Pricing"].append(col)
            categorized_flag = True
        
        # Promotion category
        elif any(keyword in col_upper for keyword in ["PROMO", "TUP", "BTL"]):
            categorized["Promotion"].append(col)
            categorized_flag = True
        
        # Media category
        elif any(keyword in col_upper for keyword in ["GRP", "SPEND"]):
            categorized["Media"].append(col)
            categorized_flag = True
        
        # Others category
        if not categorized_flag:
            categorized["Others"].append(col)
    
    return categorized

def determine_column_values(sheet_name: str) -> Tuple[str, str, str]:
    """
    Determine region, channel, and packsize values based on sheet name.
    
    Logic:
    - NTW sheets: region="NTW", channel="GT+MT", packsize=rest of sheet name after "NTW"
    - MT sheets: region="NTW", channel="MT", packsize=rest of sheet name after "MT"
    - GT sheets: region="NTW", channel="GT", packsize=rest of sheet name after "GT"
    - Other sheets: first word is region, remaining words are packsize, channel="GT"
    
    Args:
        sheet_name: Name of the Excel sheet
        
    Returns:
        Tuple of (region, channel, packsize)
    """
    sheet_upper = sheet_name.upper().strip()
    words = sheet_name.strip().split()
    
    if sheet_upper.startswith("NTW"):
        # Remove "NTW" and use rest as packsize
        packsize = " ".join(words[1:]) if len(words) > 1 else ""
        return "NTW", "GT+MT", packsize
    elif sheet_upper.startswith("MT"):
        # Remove "MT" and use rest as packsize
        packsize = " ".join(words[1:]) if len(words) > 1 else ""
        return "NTW", "MT", packsize
    elif sheet_upper.startswith("GT"):
        # Remove "GT" and use rest as packsize
        packsize = " ".join(words[1:]) if len(words) > 1 else ""
        return "NTW", "GT", packsize
    else:
        # Split sheet name into words
        if len(words) >= 1:
            region = words[0]
            packsize = " ".join(words[1:]) if len(words) > 1 else ""
            return region, "GT", packsize
        else:
            return "Unknown", "GT", ""

def remove_low_data_columns(df: pd.DataFrame, min_records: int = None) -> Tuple[pd.DataFrame, List[str]]:
    """
    Remove columns that have fewer than the minimum number of non-null/non-empty records.
    
    Args:
        df: Input dataframe
        min_records: Minimum number of valid records required (default from settings)
    
    Returns:
        tuple: (cleaned_dataframe, list_of_removed_column_names)
    """
    if df.empty:
        return df, []
    
    if min_records is None:
        min_records = settings.MIN_DATA_RECORDS
    
    columns_to_remove = []
    df_cleaned = df.copy()
    
    for column in df.columns:
        # Skip preserved business columns (case-insensitive)
        if column.lower() in settings.PRESERVE_COLUMNS:
            continue
            
        # Count valid (non-null, non-empty) records
        valid_count = 0
        for value in df[column]:
            # Check if value is not null, not NaN, and not empty string
            if pd.notna(value) and value != "" and str(value).strip() != "":
                valid_count += 1
        
        # Remove column if it has insufficient data
        if valid_count < min_records:
            columns_to_remove.append(column)
            df_cleaned = df_cleaned.drop(columns=[column])
    
    return df_cleaned, columns_to_remove

def add_or_update_business_columns(df: pd.DataFrame, region: str, channel: str, packsize: str) -> pd.DataFrame:
    """
    Add or update PackSize, Region, and Channel columns in the dataframe.
    
    These columns are positioned right after the "Month" column. If they already exist,
    replace their content. If they don't exist, create them and position correctly.
    
    Args:
        df: Input dataframe
        region: Region value to set
        channel: Channel value to set
        packsize: PackSize value to set
        
    Returns:
        pd.DataFrame: Modified dataframe with business columns
    """
    # Make a copy to avoid modifying the original
    df_modified = df.copy()
    
    # Define the columns we want to add/update with proper names
    target_columns = {
        'PackSize': packsize,
        'Region': region, 
        'Channel': channel
    }
    
    # Check if columns already exist (case-insensitive)
    existing_columns = {col.lower(): col for col in df_modified.columns}
    columns_to_update = {}
    columns_to_add = {}
    
    for col_name, col_value in target_columns.items():
        col_name_lower = col_name.lower()
        
        # Check if column already exists
        if col_name_lower in existing_columns:
            actual_col_name = existing_columns[col_name_lower]
            columns_to_update[actual_col_name] = col_value
        else:
            columns_to_add[col_name] = col_value
    
    # Update existing columns
    for col_name, col_value in columns_to_update.items():
        df_modified[col_name] = col_value
    
    # Add new columns after Month column if any
    if columns_to_add:
        # Find the Month column (case-insensitive)
        month_col_index = None
        
        for i, col in enumerate(df_modified.columns):
            if col.lower() == 'month':
                month_col_index = i
                break
        
        if month_col_index is not None:
            # Insert new columns right after Month column
            columns_list = list(df_modified.columns)
            insert_position = month_col_index + 1
            
            # Add the data for new columns
            for col_name, col_value in columns_to_add.items():
                df_modified[col_name] = col_value
            
            # Reorder columns to place new ones after Month
            new_column_names = list(columns_to_add.keys())
            
            # Create new column order: everything up to Month, new columns, everything after Month
            new_order = (
                columns_list[:insert_position] +  # Up to and including Month
                new_column_names +                # New columns
                [col for col in columns_list[insert_position:] if col not in new_column_names]  # Rest
            )
            
            df_modified = df_modified[new_order]
        else:
            # If no Month column found, add at the beginning
            columns_list = list(df_modified.columns)
            new_column_names = list(columns_to_add.keys())
            
            # Reorder: new columns first, then existing columns
            new_order = new_column_names + [col for col in columns_list if col not in new_column_names]
            df_modified = df_modified[new_order]
    
    return df_modified

def convert_to_json_serializable(value: Any) -> Any:
    """
    Convert pandas/numpy types to JSON serializable values
    
    Args:
        value: Value to convert
        
    Returns:
        JSON serializable value
    """
    if pd.isna(value):
        return None
    elif isinstance(value, (pd.Timestamp, datetime)):
        return value.strftime('%Y-%m-%d %H:%M:%S') if pd.notna(value) else None
    else:
        return str(value) if pd.notna(value) else None

def generate_preview_data(df: pd.DataFrame, max_rows: int = None) -> List[Dict[str, Any]]:
    """
    Generate preview data from dataframe for frontend display
    
    Args:
        df: Source dataframe
        max_rows: Maximum number of rows to include (default from settings)
        
    Returns:
        List of dictionaries representing rows
    """
    if max_rows is None:
        max_rows = settings.PREVIEW_ROWS
    
    preview_data = []
    preview_rows = min(max_rows, len(df))
    
    for i in range(preview_rows):
        row_data = {}
        for col in df.columns:
            value = df.iloc[i][col]
            row_data[col] = convert_to_json_serializable(value)
        preview_data.append(row_data)
    
    return preview_data

def validate_dataframe(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Validate dataframe and return quality metrics
    
    Args:
        df: Dataframe to validate
        
    Returns:
        Dict with validation results and metrics
    """
    if df.empty:
        return {
            "is_valid": False,
            "error": "Dataframe is empty",
            "metrics": {}
        }
    
    metrics = {
        "total_rows": len(df),
        "total_columns": len(df.columns),
        "null_counts": df.isnull().sum().to_dict(),
        "data_types": df.dtypes.astype(str).to_dict(),
        "memory_usage": df.memory_usage(deep=True).sum()
    }
    
    return {
        "is_valid": True,
        "metrics": metrics
    }

def remove_empty_columns(df: pd.DataFrame) -> Tuple[pd.DataFrame, List[str]]:
    """
    Remove columns that are 100% empty (all NaN or None values)
    
    Args:
        df: Input dataframe
        
    Returns:
        Tuple of (cleaned_dataframe, list_of_removed_columns)
    """
    if df.empty:
        return df, []
    
    empty_columns = []
    
    for col in df.columns:
        if df[col].isna().all() or df[col].isnull().all():
            empty_columns.append(col)
    
    if empty_columns:
        df_cleaned = df.drop(columns=empty_columns)
        return df_cleaned, empty_columns
    
    return df, []
