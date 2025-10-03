"""
========================================
PACK SIZE ANALYZER
========================================

Purpose: Analyze pack size structure in main data and RPI data sheets

Description:
This module handles the analysis of pack size information in both the main concatenated 
data and RPI data sheets. It identifies key columns (pack size, region, month, channel)
and extracts pack size information from RPI column names for matching purposes.

Key Functionality:
- Identify pack size column in main data
- Find key matching columns (region, month, channel)
- Extract pack sizes from RPI column names using our brand's side (before 'v/s')
- Load saved user pack size ordering from analysis metadata
- Prepare pack size analysis data for RPI matching logic

Business Logic:
- Pack size column detection using common naming patterns
- RPI column analysis to extract our brand's pack sizes
- User pack size ordering integration for intelligent matching
- Separation of main pack sizes (for user ordering) and RPI pack sizes

Last Updated: 2025-01-27
Author: BrandBloom Backend Team
"""

import pandas as pd
import json
from pathlib import Path
from typing import Dict, List, Any, Optional

from .pack_size_extractor import PackSizeExtractor


class PackSizeAnalyzer:
    """Analyzer for pack size structure in main and RPI data"""
    
    @staticmethod
    def analyze_pack_sizes(
        main_df: pd.DataFrame, 
        rpi_df: pd.DataFrame, 
        brand_name: str = None, 
        analysis_id: str = None
    ) -> Dict[str, Any]:
        """
        Analyze pack sizes in main and RPI data
        
        Args:
            main_df: Main concatenated data DataFrame
            rpi_df: RPI data DataFrame
            brand_name: Brand name for loading saved pack size ordering
            analysis_id: Analysis ID for loading saved pack size ordering
            
        Returns:
            Dict containing pack size analysis results
        """
        try:
            print("🔍 Analyzing pack sizes in both sheets...")
            
            # Find pack size column in main data
            main_packsize_column = PackSizeAnalyzer._find_pack_size_column(main_df)
            
            # Find key columns in main data
            region_column = PackSizeAnalyzer._find_column_by_pattern(main_df, ['region'])
            month_column = PackSizeAnalyzer._find_column_by_pattern(main_df, ['month'])
            channel_column = PackSizeAnalyzer._find_column_by_pattern(main_df, ['channel'])
            
            # Extract pack sizes from RPI columns (purely data-driven)
            rpi_columns_info = PackSizeAnalyzer._extract_rpi_columns_info(rpi_df)
            
            # Get unique pack sizes in main data
            main_pack_sizes = PackSizeAnalyzer._get_main_pack_sizes(main_df, main_packsize_column)
            
            # Try to load existing user pack size ordering from saved file
            user_pack_size_order = PackSizeAnalyzer._load_user_pack_size_ordering(
                brand_name, analysis_id
            )
            
            analysis = {
                'main_packsize_column': main_packsize_column,
                'region_column': region_column,
                'month_column': month_column,
                'channel_column': channel_column,
                'main_pack_sizes': main_pack_sizes,  # Only main pack sizes for user ordering
                'rpi_columns_info': rpi_columns_info,  # RPI pack sizes separate
                'total_rpi_columns': len(rpi_columns_info),
                'user_pack_size_order': user_pack_size_order  # Will be set by user via frontend
            }
            
            PackSizeAnalyzer._log_analysis_results(analysis)
            
            return analysis
            
        except Exception as e:
            print(f"❌ Error analyzing pack sizes: {e}")
            return {}
    
    @staticmethod
    def _find_pack_size_column(df: pd.DataFrame) -> Optional[str]:
        """Find pack size column in DataFrame"""
        columns_lower = [col.lower() for col in df.columns]
        
        for i, col in enumerate(columns_lower):
            if 'packsize' in col or 'pack_size' in col or 'size' in col:
                return df.columns[i]
        
        return None
    
    @staticmethod
    def _find_column_by_pattern(df: pd.DataFrame, patterns: List[str]) -> Optional[str]:
        """Find column matching any of the given patterns"""
        for col in df.columns:
            col_lower = col.lower()
            for pattern in patterns:
                if pattern in col_lower:
                    return col
        return None
    
    @staticmethod
    def _extract_rpi_columns_info(rpi_df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Extract pack size information from RPI columns"""
        rpi_columns_info = []
        
        for col in rpi_df.columns:
            # Skip key columns
            col_lower = col.lower()
            if any(key in col_lower for key in ['region', 'month', 'channel']):
                continue
            
            # Extract pack size from OUR BRAND's side (before 'v/s') in RPI column name
            # Format: "RPI <Our Brand> <Our PackSize> v/s <Competitor Brand> <Competitor PackSize>"
            pack_size = PackSizeExtractor.extract_our_brand_pack_size_from_rpi_column(col)
            if pack_size:
                rpi_columns_info.append({
                    'column_name': col,
                    'pack_size': pack_size,
                    'rank': None,  # No rank - will be assigned by user ordering
                    'category': None  # No category - user decides
                })
        
        return rpi_columns_info
    
    @staticmethod
    def _get_main_pack_sizes(df: pd.DataFrame, packsize_column: Optional[str]) -> List[str]:
        """Get unique pack sizes from main data"""
        if not packsize_column:
            return []
        
        return df[packsize_column].dropna().unique().tolist()
    
    @staticmethod
    def _load_user_pack_size_ordering(brand_name: str, analysis_id: str) -> Optional[List[str]]:
        """Load saved user pack size ordering from metadata file"""
        if not brand_name or not analysis_id:
            return None
        
        try:
            from app.core.config import settings
            brand_directories = settings.get_brand_directories(brand_name)
            ordering_file = brand_directories["metadata_dir"] / f"{analysis_id}_pack_size_order.json"
            
            if ordering_file.exists():
                with open(ordering_file, 'r') as f:
                    ordering_data = json.load(f)
                    user_pack_size_order = ordering_data.get('pack_size_order', [])
                    # Pack size order loaded - no verbose logging needed
                    return user_pack_size_order
            else:
                # No saved pack size ordering found - no verbose logging needed
                return None
        except Exception as e:
            print(f"   ⚠️  Error loading pack size ordering: {e}")
            return None
    
    @staticmethod
    def _log_analysis_results(analysis: Dict[str, Any]) -> None:
        """Log pack size analysis results - no verbose logging needed"""
        # Analysis results logged - no verbose output needed

