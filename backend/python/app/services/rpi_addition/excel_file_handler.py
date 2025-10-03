"""
========================================
EXCEL FILE HANDLER
========================================

Purpose: Handle Excel file I/O operations for RPI addition process

Description:
This module manages all Excel file operations including reading concatenated files
with main data and RPI sheets, and saving enhanced files with added RPI columns.
It provides robust file handling with proper error management and sheet detection.

Key Functionality:
- Read main data and RPI sheets from concatenated Excel files
- Detect sheet names using flexible naming patterns
- Save enhanced files with RPI columns added
- Handle multiple sheet formats and structures
- Provide detailed logging for file operations

Business Logic:
- Flexible sheet name detection (try multiple common names)
- Dynamic RPI sheet discovery when exact name not found
- Enhanced file naming with "_with_rpis" suffix
- Preserve original RPI data in enhanced files for reference
- Robust error handling for file operations

Last Updated: 2025-01-27
Author: BrandBloom Backend Team
"""

import pandas as pd
from pathlib import Path
from typing import Tuple


class ExcelFileHandler:
    """Handler for Excel file operations in RPI addition process"""
    
    @staticmethod
    def read_concatenated_file(
        file_path: Path, 
        main_sheet_name: str, 
        rpi_sheet_name: str
    ) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Read main data and RPI sheets from concatenated file
        
        Args:
            file_path: Path to concatenated Excel file
            main_sheet_name: Expected name of main data sheet
            rpi_sheet_name: Expected name of RPI data sheet
            
        Returns:
            Tuple of (main_df, rpi_df)
        """
        try:
            print(f"📖 Reading sheets from: {file_path}")
            
            # Get available sheet names
            with pd.ExcelFile(file_path) as xl_file:
                available_sheets = xl_file.sheet_names
            print(f"   📋 Available sheets: {available_sheets}")
            
            # Find main sheet (try multiple names)
            main_sheet = ExcelFileHandler._find_main_sheet(available_sheets, main_sheet_name)
            
            # Find RPI sheet dynamically (no hardcoded fallbacks)
            rpi_sheet = ExcelFileHandler._find_rpi_sheet(available_sheets, rpi_sheet_name)
            
            if not main_sheet:
                raise ValueError(f"Main data sheet not found. Available: {available_sheets}")
            if not rpi_sheet:
                raise ValueError(f"RPI data sheet not found. Available: {available_sheets}")
            
            # Read the sheets
            main_df = pd.read_excel(file_path, sheet_name=main_sheet)
            rpi_df = pd.read_excel(file_path, sheet_name=rpi_sheet)
            
            # Sheets read successfully - no verbose logging needed
            return main_df, rpi_df
            
        except Exception as e:
            print(f"❌ Error reading concatenated file: {e}")
            return pd.DataFrame(), pd.DataFrame()
    
    @staticmethod
    def save_enhanced_file(
        enhanced_df: pd.DataFrame,
        rpi_df: pd.DataFrame,
        original_file_path: Path,
        main_sheet_name: str,
        rpi_sheet_name: str
    ) -> Path:
        """
        Save enhanced data with RPI columns to new file
        
        Args:
            enhanced_df: Main data with RPI columns added
            rpi_df: Original RPI data
            original_file_path: Path to original file
            main_sheet_name: Name for main data sheet
            rpi_sheet_name: Name for RPI data sheet
            
        Returns:
            Path to saved enhanced file
        """
        try:
            # Create new filename
            original_stem = original_file_path.stem
            enhanced_filename = f"{original_stem}_with_rpis.xlsx"
            enhanced_file_path = original_file_path.parent / enhanced_filename
            
            # Saving enhanced file - no verbose logging needed
            
            # Save with both sheets
            with pd.ExcelWriter(enhanced_file_path, engine='openpyxl') as writer:
                # Save enhanced main data
                enhanced_df.to_excel(writer, sheet_name=f"{main_sheet_name}_Enhanced", index=False)
                
                # Save original RPI data for reference
                rpi_df.to_excel(writer, sheet_name=rpi_sheet_name, index=False)
            
            # Enhanced file saved successfully - no verbose logging needed
            return enhanced_file_path
            
        except Exception as e:
            # Error saving enhanced file - no verbose logging needed
            # Fall back to original path
            return original_file_path
    
    @staticmethod
    def _find_main_sheet(available_sheets: list, main_sheet_name: str) -> str:
        """
        Find main data sheet name from available sheets
        
        Args:
            available_sheets: List of available sheet names
            main_sheet_name: Preferred main sheet name
            
        Returns:
            Found main sheet name or None
        """
        main_options = [main_sheet_name, "Concatenated_Data_Enhanced", "Main_Data", "Data"]
        
        for option in main_options:
            if option in available_sheets:
                return option
        
        return None
    
    @staticmethod
    def _find_rpi_sheet(available_sheets: list, rpi_sheet_name: str) -> str:
        """
        Find RPI data sheet name from available sheets
        
        Args:
            available_sheets: List of available sheet names
            rpi_sheet_name: Preferred RPI sheet name
            
        Returns:
            Found RPI sheet name or None
        """
        # Try exact match first
        if rpi_sheet_name in available_sheets:
            return rpi_sheet_name
        
        # Dynamic search for RPI-like sheet names
        for sheet in available_sheets:
            if 'rpi' in sheet.lower():
                return sheet
        
        return None
    
    @staticmethod
    def validate_file_exists(file_path: Path) -> bool:
        """
        Validate that file exists and is readable
        
        Args:
            file_path: Path to file to validate
            
        Returns:
            True if file exists and is readable
        """
        try:
            return file_path.exists() and file_path.is_file()
        except Exception:
            return False
    
    @staticmethod
    def get_sheet_info(file_path: Path) -> dict:
        """
        Get information about sheets in Excel file
        
        Args:
            file_path: Path to Excel file
            
        Returns:
            Dict with sheet information
        """
        try:
            with pd.ExcelFile(file_path) as xl_file:
                sheet_names = xl_file.sheet_names
            
            sheet_info = {
                'total_sheets': len(sheet_names),
                'sheet_names': sheet_names,
                'has_main_sheet': any('data' in name.lower() or 'concatenated' in name.lower() 
                                    for name in sheet_names),
                'has_rpi_sheet': any('rpi' in name.lower() for name in sheet_names)
            }
            
            return sheet_info
            
        except Exception as e:
            return {
                'error': str(e),
                'total_sheets': 0,
                'sheet_names': [],
                'has_main_sheet': False,
                'has_rpi_sheet': False
            }

