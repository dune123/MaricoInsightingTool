"""
========================================
COLUMN MODIFIER - EXCEL MODULE
========================================

Purpose: Excel column modification and enhancement

Description:
Handles modification of Excel columns with business logic including
PackSize, Region, and Channel enhancements, as well as data quality improvements.

Key Functionality:
- Column modification with business rules
- Data quality enhancement (removes columns with <18 records)
- Business column addition and updates (PackSize, Region, Channel)
- Month column formatting to proper datetime (CRITICAL for sorting/analysis)
- Sheet information updates and data type optimization

Last Updated: 2024-12-23
Author: BrandBloom Backend Team
"""

import pandas as pd
from pathlib import Path
from typing import Dict, List, Any, Tuple
from datetime import datetime

from app.core.config import settings
from app.utils.data_utils import add_or_update_business_columns, remove_low_data_columns, determine_column_values
from app.utils.file_utils import find_file_with_fallback


class ColumnModifier:
    """Handles Excel column modification operations"""
    
    @staticmethod
    def modify_excel_columns(filename: str, selected_sheets: List[str], brand: str = None) -> Dict[str, Any]:
        """
        Modify Excel file columns with business logic enhancements
        
        Args:
            filename: Name of the Excel file to modify
            selected_sheets: List of sheet names to process
            
        Returns:
            Dict with modification results
        """
        try:
            print(f"🔧 Starting column modification for: {filename}")
            
            # Use brand-aware file search - brand is required
            if not brand:
                raise ValueError("Brand parameter is required - no legacy fallback supported")
            
            from app.services.file_service import FileService
            file_path, source = FileService.find_file(filename, brand)
            if not file_path:
                raise FileNotFoundError(f"File not found: {filename}")
            
            print(f"📁 Found file at: {file_path}")
            
            # Read Excel file and get all sheets
            excel_file = pd.ExcelFile(file_path)
            all_sheets = excel_file.sheet_names
            
            # Filter to only selected sheets that exist
            sheets_to_process = [sheet for sheet in selected_sheets if sheet in all_sheets]
            
            if not sheets_to_process:
                raise ValueError("None of the selected sheets exist in the file")
            
            print(f"📋 Processing {len(sheets_to_process)} sheets: {sheets_to_process}")
            
            # Process each sheet
            modified_sheets = []
            modification_log = []
            total_removed_columns = {}  # Track data quality improvements across all sheets
            
            with pd.ExcelWriter(file_path, engine='openpyxl', mode='a', if_sheet_exists='replace') as writer:
                for sheet_name in sheets_to_process:
                    try:
                        print(f"🔧 Modifying sheet: {sheet_name}")
                        
                        # Read the sheet
                        df = pd.read_excel(file_path, sheet_name=sheet_name)
                        original_shape = df.shape
                        
                        # Apply column modifications with data quality filtering (like original code)
                        df, modifications, removed_columns = ColumnModifier._apply_column_modifications(df, sheet_name)
                        
                        # Track removed columns for data quality reporting
                        if removed_columns:
                            total_removed_columns[sheet_name] = removed_columns
                        
                        # Write back to Excel
                        df.to_excel(writer, sheet_name=sheet_name, index=False)
                        
                        modified_sheets.append(sheet_name)
                        modification_log.extend(modifications)
                        
                        print(f"✅ Modified '{sheet_name}': {original_shape} → {df.shape}")
                        
                    except Exception as e:
                        error_msg = f"❌ Error modifying sheet '{sheet_name}': {str(e)}"
                        modification_log.append(error_msg)
                        print(error_msg)
            
            # Get updated sheet information
            updated_sheet_info = ColumnModifier._get_updated_sheet_info(file_path, modified_sheets)
            
            # Create enhanced success message like original code
            message_parts = [f"Excel file enhanced successfully. Added PackSize, Region, and Channel columns to {len(modified_sheets)} selected sheets."]
            total_columns_removed = sum(len(cols) for cols in total_removed_columns.values())
            if total_columns_removed > 0:
                message_parts.append(f"Data quality improvement: Removed {total_columns_removed} columns with insufficient data (<18 records).")
            
            return {
                "success": True,
                "message": " ".join(message_parts),
                "data": {
                    "modified_sheets": modified_sheets,
                    "modification_log": modification_log,
                    "updated_sheet_info": updated_sheet_info,
                    "sheets": updated_sheet_info,  # Add this for frontend compatibility
                    "sheetsModified": len(modified_sheets),  # Add this for frontend compatibility
                    "dataQuality": {  # Add this for frontend compatibility
                        "totalColumnsRemoved": sum(len(cols) for cols in total_removed_columns.values()),
                        "removedColumnsBySheet": total_removed_columns,
                        "sheetsWithRemovedColumns": len(total_removed_columns),
                        "totalRowsRemoved": 0
                    }
                },
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            error_msg = f"Column modification failed: {str(e)}"
            print(f"❌ {error_msg}")
            return {
                "success": False,
                "message": error_msg,
                "error": error_msg,
                "data": {
                    "modified_sheets": [],
                    "modification_log": [],
                    "updated_sheet_info": [],
                    "sheets": [],
                    "sheetsModified": 0,
                    "dataQuality": {
                        "totalColumnsRemoved": 0,
                        "removedColumnsBySheet": {},
                        "sheetsWithRemovedColumns": 0,
                        "totalRowsRemoved": 0
                    }
                },
                "timestamp": datetime.now().isoformat()
            }
    
    @staticmethod
    def _apply_column_modifications(df: pd.DataFrame, sheet_name: str) -> Tuple[pd.DataFrame, List[str], List[str]]:
        """
        Apply business logic modifications to DataFrame columns (replicating original logic)
        
        Args:
            df: DataFrame to modify
            sheet_name: Name of the sheet for logging
            
        Returns:
            Tuple of (modified_dataframe, modification_log, removed_columns)
        """
        modifications = []
        removed_columns = []
        
        try:
            # STEP 1: Apply data quality filter - remove columns with <18 records (like original code)
            df_cleaned, low_data_columns = remove_low_data_columns(df, min_records=18)
            if low_data_columns:
                removed_columns.extend(low_data_columns)
                modifications.append(f"   🗑️ Removed {len(low_data_columns)} columns with insufficient data (<18 records)")
                modifications.append(f"       Removed columns: {', '.join(low_data_columns[:5])}{'...' if len(low_data_columns) > 5 else ''}")
                df = df_cleaned
            
            # STEP 2: Determine values based on sheet name (like original code)
            region, channel, packsize = determine_column_values(sheet_name)
            
            # STEP 3: Add or update business columns (PackSize, Region, Channel) 
            df = add_or_update_business_columns(df, region, channel, packsize)
            modifications.append(f"   ✅ Added business columns: region='{region}', channel='{channel}', packsize='{packsize}'")
            
            # STEP 4: Format Month column as proper dates (CRITICAL for downstream operations)
            df, month_modifications = ColumnModifier._format_month_column(df, sheet_name)
            modifications.extend(month_modifications)
            
            # STEP 6: Clean up column names
            original_columns = df.columns.tolist()
            df.columns = df.columns.str.strip()  # Remove leading/trailing spaces
            df.columns = df.columns.str.replace(r'\s+', ' ', regex=True)  # Normalize spaces
            
            if df.columns.tolist() != original_columns:
                modifications.append(f"   🧹 Cleaned column names")
            
            # STEP 7: Remove completely empty columns (additional safety check)
            empty_cols = df.columns[df.isnull().all()].tolist()
            if empty_cols:
                df = df.drop(columns=empty_cols)
                removed_columns.extend(empty_cols)
                modifications.append(f"   🗑️ Removed {len(empty_cols)} completely empty columns")
            
            # STEP 8: Remove rows that are completely empty
            initial_rows = len(df)
            df = df.dropna(how='all')
            removed_rows = initial_rows - len(df)
            
            if removed_rows > 0:
                modifications.append(f"   🗑️ Removed {removed_rows} empty rows")
            
            # STEP 9: Data type optimization
            numeric_conversions = 0
            for col in df.columns:
                if df[col].dtype == 'object':
                    # Try to convert to numeric if possible
                    numeric_series = pd.to_numeric(df[col], errors='coerce')
                    if not numeric_series.isna().all():
                        df[col] = numeric_series
                        numeric_conversions += 1
            
            if numeric_conversions > 0:
                modifications.append(f"   🔢 Optimized {numeric_conversions} columns to numeric")
            
            return df, modifications, removed_columns
            
        except Exception as e:
            error_msg = f"Error applying modifications to {sheet_name}: {str(e)}"
            modifications.append(f"   ❌ {error_msg}")
            return df, modifications, removed_columns
    
    @staticmethod
    def _get_updated_sheet_info(file_path: Path, modified_sheets: List[str]) -> List[Dict[str, Any]]:
        """
        Get updated information about ALL sheets in the file (for frontend compatibility)
        
        Args:
            file_path: Path to the Excel file
            modified_sheets: List of sheet names that were modified (for reference)
            
        Returns:
            List of sheet information dictionaries with frontend-compatible format
        """
        sheet_info = []
        
        try:
            excel_file = pd.ExcelFile(file_path)
            
            # Get information for ALL sheets, not just modified ones
            for sheet_name in excel_file.sheet_names:
                try:
                    df = pd.read_excel(file_path, sheet_name=sheet_name)
                    
                    # Use frontend-compatible camelCase format
                    info = {
                        "sheetName": sheet_name,  # Frontend expects camelCase
                        "totalRows": len(df),     # Frontend expects totalRows
                        "totalColumns": len(df.columns),  # Frontend expects totalColumns
                        "columns": df.columns.tolist(),   # Frontend expects columns array
                        "hasData": not df.empty,
                        "isModified": sheet_name in modified_sheets,  # Mark which sheets were modified
                        "updatedAt": datetime.now().isoformat()
                    }
                    
                    sheet_info.append(info)
                    print(f"   📊 Sheet '{sheet_name}': {len(df)} rows × {len(df.columns)} columns")
                    
                except Exception as e:
                    print(f"❌ Error getting info for sheet {sheet_name}: {e}")
                    # Add placeholder info for failed sheets
                    sheet_info.append({
                        "sheetName": sheet_name,
                        "totalRows": 0,
                        "totalColumns": 0,
                        "columns": [],
                        "hasData": False,
                        "isModified": sheet_name in modified_sheets,
                        "error": str(e)
                    })
                    
        except Exception as e:
            print(f"❌ Error reading updated file: {e}")
        
        return sheet_info
    
    @staticmethod
    def _format_month_column(df: pd.DataFrame, sheet_name: str) -> Tuple[pd.DataFrame, List[str]]:
        """
        Format Month column as proper dates during column modification step
        
        This is CRITICAL for downstream operations (price sheets, RPI analysis, sorting).
        Must happen early in the pipeline to ensure month data is properly recognized.
        
        Args:
            df: DataFrame to modify
            sheet_name: Sheet name for logging
            
        Returns:
            Tuple of (modified_dataframe, modification_log)
        """
        modifications = []
        
        try:
            # Find month column (case-insensitive)
            month_column = None
            for col in df.columns:
                if 'month' in col.lower():
                    month_column = col
                    break
            
            if not month_column:
                modifications.append(f"   ⚠️ No Month column found in sheet '{sheet_name}'")
                return df, modifications
            
            # Get sample values for logging
            sample_values = df[month_column].dropna().head(5).tolist()
            modifications.append(f"   📅 Formatting Month column '{month_column}'")
            modifications.append(f"       Sample values before: {sample_values}")
            
            # Convert month values to proper datetime format
            df_modified = df.copy()
            
            # Convert to string first to handle any mixed types
            df_modified[month_column] = df_modified[month_column].astype(str)
            
            # Handle different month formats
            formatted_dates = []
            conversion_count = 0
            
            for value in df_modified[month_column]:
                if pd.isna(value) or value == 'nan' or value.strip() == '':
                    formatted_dates.append(pd.NaT)
                    continue
                
                try:
                    # Try to parse various month formats
                    cleaned_value = str(value).strip()
                    
                    # Handle formats like "Apr 22", "Aug 22", "Dec 22"
                    if len(cleaned_value.split()) == 2:
                        month_part, year_part = cleaned_value.split()
                        
                        # Handle 2-digit years by adding 2000
                        if len(year_part) == 2:
                            year_part = '20' + year_part
                        
                        # Create full date string for parsing
                        date_string = f"{month_part} {year_part}"
                        parsed_date = pd.to_datetime(date_string, format='%b %Y', errors='coerce')
                        
                        if not pd.isna(parsed_date):
                            formatted_dates.append(parsed_date)
                            conversion_count += 1
                            continue
                    
                    # Try direct parsing for other formats
                    parsed_date = pd.to_datetime(cleaned_value, errors='coerce')
                    if not pd.isna(parsed_date):
                        formatted_dates.append(parsed_date)
                        conversion_count += 1
                    else:
                        # Keep original value if parsing fails
                        formatted_dates.append(cleaned_value)
                        
                except Exception:
                    # Keep original value if any error occurs
                    formatted_dates.append(cleaned_value)
            
            # Update the dataframe with formatted dates
            df_modified[month_column] = formatted_dates
            
            # Convert datetime back to MMM-YY format for display and consistency
            final_month_values = []
            for value in df_modified[month_column]:
                if pd.isna(value):
                    final_month_values.append(value)
                elif hasattr(value, 'strftime'):
                    # Convert datetime to MMM-YY format (e.g., "Feb-22")
                    final_month_values.append(value.strftime('%b-%y'))
                else:
                    # Keep original value if not datetime
                    final_month_values.append(value)
            
            df_modified[month_column] = final_month_values
            
            # Log results
            sample_formatted = df_modified[month_column].dropna().head(5).tolist()
            modifications.append(f"       Sample values after: {sample_formatted}")
            modifications.append(f"       Successfully converted {conversion_count} month values to MMM-YY format")
            modifications.append(f"   ✅ Month column '{month_column}' formatted as MMM-YY (e.g., Feb-22)")
            
            return df_modified, modifications
            
        except Exception as e:
            error_msg = f"Error formatting month column in {sheet_name}: {str(e)}"
            modifications.append(f"   ❌ {error_msg}")
            return df, modifications
