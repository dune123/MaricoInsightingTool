"""
========================================
PACK SIZE EXTRACTOR
========================================

Purpose: Extract pack sizes from RPI column names

Description:
This module handles the extraction of pack sizes from RPI column names, specifically
focusing on extracting the pack size from our brand's side (before 'v/s') in the
RPI column naming format. This is crucial for matching RPI data with main data
based on pack size relationships.

Key Functionality:
- Parse RPI column names to extract our brand's pack size
- Handle various RPI column naming formats
- Extract pack size information using PackSizeRanker utility
- Provide detailed logging for pack size extraction process

Business Logic:
- RPI columns follow format: "RPI <Our Brand> <Our PackSize> v/s <Competitor Brand> <Competitor PackSize>"
- Extract pack size from the portion before 'v/s' (our brand's side)
- Use PackSizeRanker for consistent pack size extraction
- Handle edge cases and malformed column names gracefully

Last Updated: 2025-01-27
Author: BrandBloom Backend Team
"""

from typing import Optional
from app.utils.packsize_utils import PackSizeRanker


class PackSizeExtractor:
    """Extractor for pack sizes from RPI column names"""
    
    @staticmethod
    def extract_our_brand_pack_size_from_rpi_column(rpi_column_name: str) -> Optional[str]:
        """
        Extract pack size from OUR BRAND's side (before 'v/s') in RPI column name.
        
        RPI column format: "RPI <Our Brand> <Our PackSize> v/s <Competitor Brand> <Competitor PackSize>"
        
        Args:
            rpi_column_name: RPI column name to extract pack size from
            
        Returns:
            Pack size from our brand's side, or None if not found
            
        Examples:
            "RPI X-Men 150-250ML v/s Clear Men Sachet" -> "150-250ML"
            "RPI X-Men Sachet v/s Romano 251-500ML" -> "Sachet"
        """
        if not rpi_column_name or 'v/s' not in rpi_column_name:
            return None
        
        try:
            # Split by 'v/s' and take the first part (our brand's side)
            our_side = rpi_column_name.split('v/s')[0].strip()
            
            # Remove "RPI " prefix to get "<Our Brand> <Our PackSize>"
            if our_side.startswith('RPI '):
                our_side = our_side[4:].strip()
            
            # Extract pack size from our side using the pack size extractor
            pack_size = PackSizeRanker.extract_pack_size(our_side)
            
            # Pack size extraction completed - no verbose logging needed
            return pack_size
            
        except Exception as e:
            print(f"   ❌ Error extracting pack size from RPI column '{rpi_column_name}': {e}")
            return None
    
    @staticmethod
    def validate_rpi_column_format(rpi_column_name: str) -> bool:
        """
        Validate if RPI column follows expected format
        
        Args:
            rpi_column_name: RPI column name to validate
            
        Returns:
            True if column follows expected RPI format
        """
        if not rpi_column_name:
            return False
        
        # Check for basic RPI format requirements
        has_rpi_prefix = rpi_column_name.strip().startswith('RPI ')
        has_vs_separator = 'v/s' in rpi_column_name
        
        return has_rpi_prefix and has_vs_separator
    
    @staticmethod
    def extract_competitor_info(rpi_column_name: str) -> Optional[dict]:
        """
        Extract competitor brand and pack size information from RPI column
        
        Args:
            rpi_column_name: RPI column name to extract from
            
        Returns:
            Dict with competitor brand and pack size, or None if not found
        """
        if not PackSizeExtractor.validate_rpi_column_format(rpi_column_name):
            return None
        
        try:
            # Split by 'v/s' and take the second part (competitor's side)
            competitor_side = rpi_column_name.split('v/s')[1].strip()
            
            # Extract pack size from competitor side
            competitor_pack_size = PackSizeRanker.extract_pack_size(competitor_side)
            
            # Extract brand name (everything before the pack size)
            competitor_brand = competitor_side
            if competitor_pack_size:
                # Remove pack size from end to get brand name
                competitor_brand = competitor_side.replace(competitor_pack_size, '').strip()
            
            return {
                'competitor_brand': competitor_brand,
                'competitor_pack_size': competitor_pack_size,
                'full_competitor_side': competitor_side
            }
            
        except Exception as e:
            print(f"   ❌ Error extracting competitor info from RPI column '{rpi_column_name}': {e}")
            return None
    
    @staticmethod
    def extract_competitor_pack_size_from_rpi_column(rpi_column_name: str) -> Optional[str]:
        """
        Extract pack size from COMPETITOR's side (after 'v/s') in RPI column name.
        
        RPI column format: "RPI <Our Brand> <Our PackSize> v/s <Competitor Brand> <Competitor PackSize>"
        
        Args:
            rpi_column_name: RPI column name to extract pack size from
            
        Returns:
            Pack size from competitor's side, or None if not found
            
        Examples:
            "RPI X-Men 150-250ML v/s Clear Men Sachet" -> "Sachet"
            "RPI X-Men Sachet v/s Romano 251-500ML" -> "251-500ML"
        """
        if not rpi_column_name or 'v/s' not in rpi_column_name:
            return None
        
        try:
            # Split by 'v/s' and take the second part (competitor's side)
            competitor_side = rpi_column_name.split('v/s')[1].strip()
            
            # Extract pack size from competitor side
            competitor_pack_size = PackSizeRanker.extract_pack_size(competitor_side)
            
            return competitor_pack_size
            
        except Exception as e:
            print(f"   ❌ Error extracting competitor pack size from RPI column '{rpi_column_name}': {e}")
            return None

