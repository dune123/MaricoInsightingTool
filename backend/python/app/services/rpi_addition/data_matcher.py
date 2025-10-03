"""
========================================
DATA MATCHER
========================================

Purpose: Handle data matching logic between main data and RPI data

Description:
This module contains the core logic for matching rows between main concatenated data
and RPI data. It implements various matching strategies including region/month/channel
matching and pack size relevance checking using user-defined pack size ordering.

Key Functionality:
- Find matching rows in RPI data for given main data rows
- Check RPI column relevance based on pack size relationships
- Handle different matching criteria (region, month, channel)
- Support sequence-based adjacency for pack size matching
- Normalize data formats for consistent matching

Business Logic:
- Match based on region, month, and optionally channel
- Handle month format normalization (e.g., "Feb 22" vs "Feb-22")
- Pack size relevance based on user ordering (same, ±1 position)
- Support RPI data with different dimensional structures

Last Updated: 2025-01-27
Author: BrandBloom Backend Team
"""

import pandas as pd
from typing import Optional, List


class DataMatcher:
    """Matcher for data between main and RPI sheets"""
    
    @staticmethod
    def find_matching_rpi_row(
        rpi_df: pd.DataFrame, 
        main_row: pd.Series, 
        region_col: Optional[str], 
        month_col: Optional[str], 
        channel_col: Optional[str]
    ) -> Optional[int]:
        """
        Find matching row in RPI data for given main data row
        
        Args:
            rpi_df: RPI DataFrame to search in
            main_row: Row from main data to find match for
            region_col: Name of region column
            month_col: Name of month column
            channel_col: Name of channel column
            
        Returns:
            Index of matching RPI row, or None if no match found
        """
        try:
            # Start with all RPI rows
            mask = pd.Series([True] * len(rpi_df), index=rpi_df.index)
            
            # Filter by region if available
            if region_col and region_col in rpi_df.columns:
                main_region = main_row.get(region_col)
                if pd.notna(main_region):
                    mask &= (rpi_df[region_col] == main_region)
            
            # Filter by month with format normalization
            if month_col and month_col in rpi_df.columns:
                main_month = main_row.get(month_col)
                if pd.notna(main_month):
                    # Normalize month formats for matching
                    # Convert "Feb 22" to "Feb-22" format for comparison
                    main_month_normalized = str(main_month).replace(' ', '-')
                    
                    # Create normalized RPI months for comparison
                    rpi_months_normalized = rpi_df[month_col].astype(str).str.replace(' ', '-')
                    
                    mask &= (rpi_months_normalized == main_month_normalized)
            
            # Skip channel filtering if channel column doesn't exist in RPI data
            # This handles cases where RPI data only has Region + Month dimensions
            if channel_col and channel_col in rpi_df.columns:
                main_channel = main_row.get(channel_col)
                if pd.notna(main_channel):
                    mask &= (rpi_df[channel_col] == main_channel)
            else:
                # If no channel column in RPI data, we match on Region + Month only
                # This is the correct behavior for your current RPI sheet structure
                pass
            
            # Get matching rows
            matching_indices = rpi_df.index[mask].tolist()
            
            # Return first match if found
            return matching_indices[0] if matching_indices else None
            
        except Exception as e:
            print(f"❌ Error finding matching RPI row: {e}")
            return None
    
    @staticmethod 
    def is_rpi_column_relevant_for_main_row(
        main_pack_size: str,
        rpi_column_name: str, 
        user_pack_size_order: List[str]
    ) -> bool:
        """
        Check if an RPI column is relevant for a given main data row using correct business logic.
        
        Correct Business Logic:
        1. RPI column format: "RPI <Our Brand> <Our PackSize> v/s <Competitor Brand> <Competitor PackSize>"
        2. For a main row with pack size X, ONLY consider RPI columns where Our PackSize = X
        3. Then check if Competitor PackSize is same/adjacent to X for relevance
        
        Args:
            main_pack_size: Pack size from main data row (e.g., "Sachet") 
            rpi_column_name: Full RPI column name (e.g., "RPI X-Men Sachet v/s Clear Men 150-250ML")
            user_pack_size_order: User's ordered list of pack sizes
            
        Returns:
            bool: True if RPI column is relevant for this main row
        """
        from .pack_size_extractor import PackSizeExtractor
        
        # Extract our brand's pack size (before v/s) 
        our_pack_size = PackSizeExtractor.extract_our_brand_pack_size_from_rpi_column(rpi_column_name)
        
        # First check: Our side must match main row's pack size EXACTLY
        if our_pack_size != main_pack_size:
            return False  # This RPI column is for a different pack size row
            
        # Extract competitor's pack size (after v/s)
        competitor_pack_size = PackSizeExtractor.extract_competitor_pack_size_from_rpi_column(rpi_column_name)
        
        if not competitor_pack_size:
            return False  # Cannot extract competitor pack size
            
        # Second check: Is competitor pack size same/adjacent to our pack size?
        return DataMatcher._is_pack_size_adjacent_or_same(
            main_pack_size, competitor_pack_size, user_pack_size_order
        )
    
    @staticmethod
    def _is_pack_size_adjacent_or_same(
        pack_size_a: str,
        pack_size_b: str, 
        user_pack_size_order: List[str]
    ) -> bool:
        """
        Check if two pack sizes are the same or adjacent in user's ordering.
        
        Args:
            pack_size_a: First pack size
            pack_size_b: Second pack size  
            user_pack_size_order: User's ordered list of pack sizes
            
        Returns:
            bool: True if pack sizes are same or adjacent (position difference <= 1)
        """
        # If no user ordering, use intelligent default ordering
        if not user_pack_size_order:
            default_order = ['Sachet', '150-250ML', '251-500ML', '501-650ML', '>650ML']
            user_pack_size_order = default_order
            
        try:
            position_a = user_pack_size_order.index(pack_size_a)
        except ValueError:
            # If pack size not in ordering, only allow exact match
            return pack_size_a == pack_size_b
            
        try:
            position_b = user_pack_size_order.index(pack_size_b)
        except ValueError:
            # If pack size not in ordering, not relevant  
            return False
            
        # Business Logic: Allow same position, position-1, position+1 only
        position_diff = abs(position_a - position_b)
        return position_diff <= 1
    
    @staticmethod
    def is_rpi_relevant_for_pack_size(
        main_rank: int, 
        rpi_rank: int, 
        actual_ranks_list: List[int]
    ) -> bool:
        """
        Check if an RPI column is relevant for a given main pack size using sequence-based adjacency.
        
        Logic (based on actual sequence of ranks found in data):
        - Smallest size in sequence: only same size and next in sequence
        - Largest size in sequence: only same size and previous in sequence  
        - Middle sizes: same size, previous in sequence, next in sequence
        
        Args:
            main_rank: Pack size rank of main data row
            rpi_rank: Pack size rank of RPI column
            actual_ranks_list: Sorted list of actual ranks found in the data
            
        Returns:
            bool: True if RPI is relevant for this main pack size
            
        Example:
            If actual_ranks_list = [1, 3, 5]:
            - Rank 1 (position 0): allows ranks 1, 3 (positions 0, 1)
            - Rank 3 (position 1): allows ranks 1, 3, 5 (positions 0, 1, 2)  
            - Rank 5 (position 2): allows ranks 3, 5 (positions 1, 2)
        """
        if main_rank == 99 or rpi_rank == 99:  # Unknown pack sizes
            return False
        
        if not actual_ranks_list or main_rank not in actual_ranks_list or rpi_rank not in actual_ranks_list:
            return False
        
        # Same pack size is always relevant
        if main_rank == rpi_rank:
            return True
        
        # Find positions in the actual sequence
        try:
            main_pos = actual_ranks_list.index(main_rank)
            rpi_pos = actual_ranks_list.index(rpi_rank)
        except ValueError:
            return False  # Rank not found in actual data
        
        # Allow only adjacent positions in the sequence
        # Smallest in sequence: can only go to next position
        if main_pos == 0:  # First in sequence
            return rpi_pos == 1 if len(actual_ranks_list) > 1 else False
        
        # Largest in sequence: can only go to previous position  
        elif main_pos == len(actual_ranks_list) - 1:  # Last in sequence
            return rpi_pos == main_pos - 1
        
        # Middle positions: can go to previous or next position
        else:
            return rpi_pos == main_pos - 1 or rpi_pos == main_pos + 1
    
    @staticmethod
    def normalize_month_format(month_value: str) -> str:
        """
        Normalize month format for consistent matching
        
        Args:
            month_value: Month value to normalize
            
        Returns:
            Normalized month format
        """
        if not month_value:
            return ""
        
        return str(month_value).replace(' ', '-')
    
    @staticmethod
    def validate_matching_criteria(
        main_row: pd.Series,
        region_col: Optional[str],
        month_col: Optional[str],
        channel_col: Optional[str]
    ) -> dict:
        """
        Validate that main row has required data for matching
        
        Args:
            main_row: Row from main data
            region_col: Name of region column
            month_col: Name of month column
            channel_col: Name of channel column
            
        Returns:
            Dict with validation results
        """
        validation = {
            'has_region': False,
            'has_month': False,
            'has_channel': False,
            'is_valid': False
        }
        
        if region_col and pd.notna(main_row.get(region_col)):
            validation['has_region'] = True
        
        if month_col and pd.notna(main_row.get(month_col)):
            validation['has_month'] = True
        
        if channel_col and pd.notna(main_row.get(channel_col)):
            validation['has_channel'] = True
        
        # At minimum, need region and month for matching
        validation['is_valid'] = validation['has_region'] and validation['has_month']
        
        return validation
