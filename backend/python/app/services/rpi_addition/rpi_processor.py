"""
========================================
RPI PROCESSOR
========================================

Purpose: Core RPI processing logic for adding RPI columns to main data

Description:
This module contains the core logic for processing RPI addition to main data.
It handles the iteration through main data rows, matching with RPI data,
and adding relevant RPI columns based on pack size relationships and user ordering.

Key Functionality:
- Process RPI addition to main concatenated data
- Match main data rows with RPI data using pack size ordering
- Add RPI columns based on pack size relevance rules
- Track processing statistics and column addition results
- Handle pack size ordering logic for intelligent matching

Business Logic:
- For each RPI column, determine if it's relevant for each main data row
- Use user pack size ordering to determine relevance (same, ±1 position)
- Match rows based on region, month, channel criteria
- Only keep RPI columns that have actual matches found
- Provide detailed statistics on processing results

Last Updated: 2025-01-27
Author: BrandBloom Backend Team
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any, Tuple

from app.models.data_models import RPIColumnInfo
from .data_matcher import DataMatcher


class RPIProcessor:
    """Processor for core RPI addition logic"""
    
    @staticmethod
    def process_rpi_addition(
        main_df: pd.DataFrame, 
        rpi_df: pd.DataFrame, 
        pack_size_analysis: Dict[str, Any]
    ) -> Tuple[pd.DataFrame, List[RPIColumnInfo]]:
        """
        Process the actual RPI column addition to main data
        
        Args:
            main_df: Main concatenated data DataFrame
            rpi_df: RPI data DataFrame
            pack_size_analysis: Pack size analysis results
            
        Returns:
            Tuple of (enhanced_df, rpi_columns_added)
        """
        try:
            print("🔄 Processing RPI addition to main data...")
            
            enhanced_df = main_df.copy()
            rpi_columns_added = []
            
            # Get column mappings and analysis data
            column_mappings = RPIProcessor._extract_column_mappings(pack_size_analysis)
            user_pack_size_order = pack_size_analysis.get('user_pack_size_order', [])
            rpi_columns_info = pack_size_analysis.get('rpi_columns_info', [])
            
            # Validate required columns
            if not column_mappings['main_packsize_col']:
                print("❌ No pack size column found in main data")
                return enhanced_df, rpi_columns_added
            
            # Debug: Show what user ordering was received
            print(f"   🔍 Received user pack size order: {user_pack_size_order}")
            
            # Set up pack size ordering  
            user_pack_size_order = RPIProcessor._setup_pack_size_ordering(
                main_df, column_mappings['main_packsize_col'], user_pack_size_order
            )
            
            print(f"   📋 Final pack size order being used: {user_pack_size_order}")
            
            # Process each RPI column
            total_rows = len(main_df)
            for rpi_col_info in rpi_columns_info:
                rpi_column_result = RPIProcessor._process_single_rpi_column(
                    enhanced_df, main_df, rpi_df, rpi_col_info, 
                    column_mappings, user_pack_size_order, total_rows
                )
                
                if rpi_column_result:
                    rpi_columns_added.append(rpi_column_result)
            
            # RPI processing completed - no verbose logging needed
            return enhanced_df, rpi_columns_added
            
        except Exception as e:
            print(f"❌ Error processing RPI addition: {e}")
            return main_df, []
    
    @staticmethod
    def _extract_column_mappings(pack_size_analysis: Dict[str, Any]) -> Dict[str, str]:
        """Extract column mappings from pack size analysis"""
        return {
            'main_packsize_col': pack_size_analysis.get('main_packsize_column'),
            'region_col': pack_size_analysis.get('region_column'),
            'month_col': pack_size_analysis.get('month_column'),
            'channel_col': pack_size_analysis.get('channel_column')
        }
    
    @staticmethod
    def _setup_pack_size_ordering(
        main_df: pd.DataFrame, 
        main_packsize_col: str, 
        user_pack_size_order: List[str]
    ) -> List[str]:
        """Set up pack size ordering, using fallback if user ordering not available"""
        if not user_pack_size_order:
            # No pack size ordering available - using alphabetical order
            # Fall back to main pack sizes in alphabetical order
            main_pack_sizes_for_order = main_df[main_packsize_col].dropna().unique().tolist()
            return sorted(main_pack_sizes_for_order)
        
        return user_pack_size_order
    
    @staticmethod
    def _process_single_rpi_column(
        enhanced_df: pd.DataFrame,
        main_df: pd.DataFrame,
        rpi_df: pd.DataFrame,
        rpi_col_info: Dict[str, Any],
        column_mappings: Dict[str, str],
        user_pack_size_order: List[str],
        total_rows: int
    ) -> RPIColumnInfo:
        """
        Process a single RPI column addition
        
        Args:
            enhanced_df: Enhanced DataFrame being built
            main_df: Original main data
            rpi_df: RPI data
            rpi_col_info: Information about this RPI column
            column_mappings: Column name mappings
            user_pack_size_order: User's pack size ordering
            total_rows: Total number of rows in main data
            
        Returns:
            RPIColumnInfo if column was added, None if skipped
        """
        rpi_col_name = rpi_col_info['column_name']
        rpi_pack_size = rpi_col_info['pack_size']
        
        # Use the original RPI column name directly
        new_col_name = rpi_col_name
        enhanced_df[new_col_name] = np.nan
        
        # Track rows where we added RPI data
        matches_found = 0
        
        # For each row in main data, check if this RPI column is relevant
        for idx, row in main_df.iterrows():
            main_pack_size = row.get(column_mappings['main_packsize_col'])
            
            if pd.notna(main_pack_size):
                # Check if this RPI column is relevant using correct business logic
                # This checks: 1) Our side = main pack size, 2) Competitor side = same/adjacent
                is_relevant = DataMatcher.is_rpi_column_relevant_for_main_row(
                    str(main_pack_size), rpi_col_name, user_pack_size_order
                )
                
                if is_relevant:
                    # Find matching row in RPI data
                    rpi_match = DataMatcher.find_matching_rpi_row(
                        rpi_df, row, 
                        column_mappings['region_col'], 
                        column_mappings['month_col'], 
                        column_mappings['channel_col']
                    )
                    
                    if rpi_match is not None and rpi_col_name in rpi_df.columns:
                        rpi_value = rpi_df.loc[rpi_match, rpi_col_name]
                        if pd.notna(rpi_value):
                            enhanced_df.loc[idx, new_col_name] = rpi_value
                            matches_found += 1
        
        # Only keep the column if we found matches
        if matches_found > 0:
            # Column added successfully - no verbose logging needed
            return RPIColumnInfo(
                original_rpi_column=rpi_col_name,
                new_column_name=new_col_name,
                pack_size=rpi_pack_size,
                pack_size_rank=0,  # No rank - using user ordering
                matches_found=matches_found,
                total_rows=total_rows
            )
        else:
            # Remove the column if no matches found
            enhanced_df.drop(columns=[new_col_name], inplace=True)
            # Column skipped - no verbose logging needed
            return None
    
    @staticmethod
    def calculate_processing_stats(
        main_df: pd.DataFrame,
        enhanced_df: pd.DataFrame,
        rpi_columns_added: List[RPIColumnInfo]
    ) -> Dict[str, Any]:
        """
        Calculate processing statistics
        
        Args:
            main_df: Original main data
            enhanced_df: Enhanced data with RPI columns
            rpi_columns_added: List of RPI columns that were added
            
        Returns:
            Dict with processing statistics
        """
        original_columns = len(main_df.columns)
        enhanced_columns = len(enhanced_df.columns)
        total_matches = sum(col.matches_found for col in rpi_columns_added)
        
        return {
            'original_columns': original_columns,
            'enhanced_columns': enhanced_columns,
            'rpi_columns_added': len(rpi_columns_added),
            'total_rows_processed': len(main_df),
            'total_rpi_matches': total_matches,
            'average_matches_per_column': total_matches / len(rpi_columns_added) if rpi_columns_added else 0,
            'columns_with_matches': [col.new_column_name for col in rpi_columns_added]
        }
    
    @staticmethod
    def validate_processing_inputs(
        main_df: pd.DataFrame,
        rpi_df: pd.DataFrame,
        pack_size_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Validate inputs for RPI processing
        
        Args:
            main_df: Main data DataFrame
            rpi_df: RPI data DataFrame
            pack_size_analysis: Pack size analysis results
            
        Returns:
            Dict with validation results
        """
        validation = {
            'is_valid': True,
            'errors': [],
            'warnings': []
        }
        
        # Check DataFrames
        if main_df.empty:
            validation['errors'].append("Main data is empty")
            validation['is_valid'] = False
        
        if rpi_df.empty:
            validation['errors'].append("RPI data is empty")
            validation['is_valid'] = False
        
        # Check pack size analysis
        if not pack_size_analysis.get('main_packsize_column'):
            validation['errors'].append("No pack size column found in main data")
            validation['is_valid'] = False
        
        if not pack_size_analysis.get('rpi_columns_info'):
            validation['warnings'].append("No RPI columns with pack sizes found")
        
        # Check matching columns
        required_cols = ['region_column', 'month_column']
        for col in required_cols:
            if not pack_size_analysis.get(col):
                validation['warnings'].append(f"No {col.replace('_', ' ')} found - may affect matching")
        
        return validation

