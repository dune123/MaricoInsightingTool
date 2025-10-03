"""
========================================
SHEET CONCATENATOR - EXCEL MODULE
========================================

Purpose: Excel sheet concatenation and processing

Description:
Handles the core functionality of concatenating multiple Excel sheets
with intelligent column alignment and data quality enhancement.

Key Functionality:
- Step-by-step sheet concatenation algorithm
- Column alignment and data merging
- Data quality filtering and validation
- Processing logs and status tracking

Last Updated: 2024-12-23
Author: BrandBloom Backend Team
"""

import pandas as pd
from pathlib import Path
from typing import Dict, List, Any, Tuple
from datetime import datetime

from app.core.config import settings
from app.utils.data_utils import (
    remove_empty_columns,
    categorize_columns,
    remove_low_data_columns,
    generate_preview_data
)
from app.utils.file_utils import find_file_with_fallback


class SheetConcatenator:
    """Handles Excel sheet concatenation operations"""
    
    @staticmethod
    def concatenate_sheets(original_filename: str, selected_sheets: List[str], 
                          custom_filename: str = "concatenated", brand_name: str = None) -> Dict[str, Any]:
        """
        Concatenate selected sheets using step-by-step column alignment algorithm
        
        Args:
            original_filename: Name of the original Excel file
            selected_sheets: List of sheet names to concatenate
            custom_filename: Custom name for output file
            
        Returns:
            Dict with concatenation results
        """
        if not selected_sheets:
            raise ValueError("No sheets selected for concatenation")
        
        # Use brand-aware file search - brand is required
        if not brand_name:
            raise ValueError("Brand name is required - no legacy fallback supported")
        
        from app.services.file_service import FileService
        file_path, source = FileService.find_file(original_filename, brand_name)
        if not file_path:
            raise FileNotFoundError(f"Source file not found: {original_filename}")
        
        # Read and process Excel file
        excel_file = pd.ExcelFile(file_path)
        available_sheets = excel_file.sheet_names
        
        # Filter to only selected sheets that exist
        valid_selected_sheets = [sheet for sheet in selected_sheets if sheet in available_sheets]
        if not valid_selected_sheets:
            raise ValueError("None of the selected sheets exist in the file")
        
        # Perform step-by-step concatenation
        final_df, concatenation_log = SheetConcatenator._perform_step_by_step_concatenation(
            file_path, valid_selected_sheets
        )
        
        # Remove empty columns
        final_df, empty_columns = remove_empty_columns(final_df)
        
        # Categorize columns
        column_categories = categorize_columns(list(final_df.columns))
        
        # Remove low data columns
        final_df, removed_columns = remove_low_data_columns(final_df)
        
        # Generate preview data
        preview_data = generate_preview_data(final_df, limit=100)
        
        # Generate output filename with timestamp
        timestamp = int(datetime.now().timestamp())
        base_name = original_filename.replace('.xlsx', '').replace('.csv', '')
        output_filename = f"{base_name}_{timestamp}_concatenated.xlsx"
        # Use brand-specific concat directory
        if not brand_name:
            raise ValueError("Brand name is required - no legacy fallback supported")
        
        brand_dirs = settings.get_brand_directories(brand_name)
        brand_dirs["concat_dir"].mkdir(parents=True, exist_ok=True)
        output_path = brand_dirs["concat_dir"] / output_filename
        
        # Note: Legacy global CONCAT_DIR creation removed
        # Brand-specific directories should be created by brand analysis service
        # settings.CONCAT_DIR.mkdir(parents=True, exist_ok=True)
        
        # Save concatenated file
        final_df.to_excel(output_path, index=False)
        
        return {
            "success": True,
            "concatenated_filename": output_filename,
            "source": source,
            "sheets_processed": valid_selected_sheets,
            "total_rows": len(final_df),
            "total_columns": len(final_df.columns),
            "column_categories": column_categories,
            "preview_data": preview_data,
            "empty_columns_removed": empty_columns,
            "low_data_columns_removed": removed_columns,
            "concatenation_log": concatenation_log,
            "created_at": datetime.now().isoformat()
        }
    
    @staticmethod
    def _find_source_file(filename: str, directories: List[Path]) -> Tuple[Path, str]:
        """Find source file in priority order"""
        for directory in directories:
            file_path = find_file_with_fallback(directory, filename)
            if file_path and file_path.exists():
                return file_path, directory.name
        return None, None
    
    @staticmethod
    def _perform_step_by_step_concatenation(file_path: Path, selected_sheets: List[str]) -> Tuple[pd.DataFrame, List[str]]:
        """
        Perform step-by-step concatenation with detailed logging
        
        Args:
            file_path: Path to the Excel file
            selected_sheets: List of sheet names to concatenate
            
        Returns:
            Tuple of (concatenated_dataframe, concatenation_log)
        """
        concatenation_log = []
        final_df = None
        
        concatenation_log.append(f"📋 Starting concatenation of {len(selected_sheets)} sheets")
        
        for i, sheet_name in enumerate(selected_sheets):
            try:
                # Read the sheet
                df = pd.read_excel(file_path, sheet_name=sheet_name)
                initial_rows = len(df)
                initial_cols = len(df.columns)
                
                concatenation_log.append(f"📄 Step {i+1}: Processing '{sheet_name}' ({initial_rows} rows, {initial_cols} columns)")
                
                # Enhance the sheet (clean data, standardize columns)
                df, enhancement_log = SheetConcatenator._enhance_sheet(df, sheet_name)
                concatenation_log.extend(enhancement_log)
                
                if final_df is None:
                    # First sheet becomes the base
                    final_df = df.copy()
                    concatenation_log.append(f"✅ Base dataframe established with {len(df)} rows and {len(df.columns)} columns")
                else:
                    # Concatenate with existing data
                    before_concat_rows = len(final_df)
                    final_df = pd.concat([final_df, df], ignore_index=True, sort=False)
                    after_concat_rows = len(final_df)
                    added_rows = after_concat_rows - before_concat_rows
                    
                    concatenation_log.append(f"✅ Added {added_rows} rows from '{sheet_name}' (Total: {after_concat_rows} rows)")
                
            except Exception as e:
                error_msg = f"❌ Error processing sheet '{sheet_name}': {str(e)}"
                concatenation_log.append(error_msg)
                print(error_msg)
        
        if final_df is not None:
            final_rows = len(final_df)
            final_cols = len(final_df.columns)
            concatenation_log.append(f"🎯 Final result: {final_rows} rows, {final_cols} columns")
        
        return final_df, concatenation_log
    
    @staticmethod
    def _enhance_sheet(df: pd.DataFrame, sheet_name: str) -> Tuple[pd.DataFrame, List[str]]:
        """
        Enhance individual sheet data quality
        
        Args:
            df: DataFrame to enhance
            sheet_name: Name of the sheet for logging
            
        Returns:
            Tuple of (enhanced_dataframe, enhancement_log)
        """
        enhancement_log = []
        
        # Remove completely empty rows and columns
        initial_shape = df.shape
        df = df.dropna(how='all')  # Remove empty rows
        df = df.loc[:, ~df.columns.str.contains('^Unnamed')]  # Remove unnamed columns
        
        if df.shape != initial_shape:
            enhancement_log.append(f"   🧹 Cleaned empty data: {initial_shape} → {df.shape}")
        
        # Standardize column names (remove extra spaces, normalize case)
        df.columns = df.columns.str.strip()
        
        return df, enhancement_log
