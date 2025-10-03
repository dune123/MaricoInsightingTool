"""
========================================
BRAND EXTRACTOR - EXCEL MODULE
========================================

Purpose: Brand name extraction and analysis utilities

Description:
Handles sophisticated brand name extraction from various column formats including
target variables, price columns, and RPI columns. Implements business logic for
brand identification, cleaning, and categorization with support for multiple
naming conventions and pack size handling.

Key Functionality:
- Brand extraction from target variables with prefix removal
- Brand-only extraction from price columns for matching
- Pack size aware brand cleaning to prevent duplication
- Support for multiple brand naming patterns
- Case-insensitive brand matching and comparison
- Special handling for entire brand categories

Business Logic:
- Remove common prefixes (Volume, Value, Price, etc.)
- Extract brand part while preserving pack size information
- Handle special cases like "(Entire Brand)" markers
- Clean brand names to prevent pack size duplication
- Support frontend-compatible brand extraction

Dependencies:
- re for regular expression pattern matching
- typing for type hints

Last Updated: 2024-12-23
Author: BrandBloom Backend Team
"""

import re
from typing import Optional, List, Dict, Any


class BrandExtractor:
    """Handles brand name extraction and analysis from various data formats"""
    
    # Common prefixes to remove from brand names
    COMMON_PREFIXES = [
        r'^Volume\s+',
        r'^Value\s+', 
        r'^Units?\s+',
        r'^Vol\s+',
        r'^Val\s+',
        r'^Unit\s+',
        r'^Offtake\s+',
        r'^WTD\s+',
        r'^Price\s+per\s+ml\s+',
        r'^Price\s+',
        r'^RPI\s+',
        r'^Promo\s+',
        r'^TUP\s+',
        r'^BTL\s+',
        r'^GRP\s+',
        r'^Spend\s+'
    ]
    
    # Pack size indicators for brand cleaning
    PACK_SIZE_INDICATORS = [
        'ml', 'oz', 'ltr', 'l', 'sachet', 'pouch', 'pack', 'bottle',
        'entire brand', 'category'
    ]
    
    @staticmethod
    def extract_brand_from_target_variable(target_variable: str) -> str:
        """
        Extract brand name from target variable - EXACT copy of frontend logic
        This extracts the complete brand name (e.g., "Volume X-Men Sachet" -> "X-Men Sachet")
        
        Args:
            target_variable: Target variable string to extract brand from
            
        Returns:
            Extracted brand name with prefixes removed
        """
        if not target_variable:
            return ''

        # Convert to string and trim whitespace
        brand_name = target_variable.strip()

        # Remove common measurement prefixes (case insensitive)
        for prefix in BrandExtractor.COMMON_PREFIXES:
            brand_name = re.sub(prefix, '', brand_name, flags=re.IGNORECASE)

        # Clean up excessive whitespace, preserve brand names as-is
        brand_name = re.sub(r'\s+', ' ', brand_name).strip()
        brand_name = brand_name.replace('_', ' ')

        return brand_name

    @staticmethod
    def extract_brand_only_from_price_column(column_name: str) -> str:
        """
        Extract ONLY the brand part from price column for brand matching
        This should match the frontend's brand extraction for comparison
        
        Examples:
        - "Price per ml X-Men Sachet" -> "X-Men" 
        - "Price per ml X-Men For Boss Sachet" -> "X-Men For Boss"
        - "Price per ml Clear Men 251-500ML" -> "Clear Men"
        
        Args:
            column_name: Price column name to extract brand from
            
        Returns:
            Extracted brand name without pack size information
        """
        if not column_name:
            return ''

        # First, extract the complete brand+packsize using frontend logic
        complete_brand_packsize = BrandExtractor.extract_brand_from_target_variable(column_name)
        
        # Now extract just the brand part by removing packsize indicators from the end
        parts = complete_brand_packsize.split()
        if not parts:
            return ''
        
        # Special case: Handle "(Entire Brand)" 
        if '(Entire Brand)' in complete_brand_packsize:
            return complete_brand_packsize.replace('(Entire Brand)', '').strip()
        
        # Work backwards to remove packsize parts
        brand_parts = []
        for part in parts:
            part_lower = part.lower()
            
            # Stop if we hit a size indicator
            if any(indicator in part_lower for indicator in BrandExtractor.PACK_SIZE_INDICATORS):
                break
                
            # Stop if we hit a number range (like 150-250, 251-500, >650)
            if BrandExtractor._is_pack_size_number(part):
                break
                
            brand_parts.append(part)
        
        return ' '.join(brand_parts).strip() if brand_parts else complete_brand_packsize
    
    @staticmethod
    def extract_brand_from_rpi_column(rpi_column_name: str) -> Dict[str, str]:
        """
        Extract both our brand and competitor brand from RPI column
        
        Args:
            rpi_column_name: RPI column name (format: "RPI OurBrand PackSize v/s CompetitorBrand PackSize")
            
        Returns:
            Dict with 'our_brand' and 'competitor_brand' keys
        """
        if not rpi_column_name or 'v/s' not in rpi_column_name:
            return {'our_brand': '', 'competitor_brand': ''}
        
        try:
            # Split on 'v/s' to get both sides
            parts = rpi_column_name.split(' v/s ')
            if len(parts) != 2:
                return {'our_brand': '', 'competitor_brand': ''}
            
            # Extract our brand (left side, remove "RPI " prefix)
            our_side = parts[0].replace('RPI ', '').strip()
            our_brand = BrandExtractor.extract_brand_only_from_price_column(f"Price {our_side}")
            
            # Extract competitor brand (right side)
            competitor_side = parts[1].strip()
            competitor_brand = BrandExtractor.extract_brand_only_from_price_column(f"Price {competitor_side}")
            
            return {
                'our_brand': our_brand,
                'competitor_brand': competitor_brand
            }
            
        except Exception:
            return {'our_brand': '', 'competitor_brand': ''}
    
    @staticmethod
    def remove_pack_size_from_brand_name(brand_name: str, pack_size: str) -> str:
        """
        Remove pack size from brand name to prevent duplication in RPI column names
        
        This method ensures that when we have a brand name like "Clear Men Sachet"
        and a pack size "Sachet", we remove the redundant pack size from the brand name
        to prevent "Clear Men Sachet Sachet" duplication.
        
        Args:
            brand_name: Brand name that may contain pack size
            pack_size: Pack size to remove from brand name
            
        Returns:
            Clean brand name without the redundant pack size
        """
        if not brand_name or not pack_size:
            return brand_name
        
        # Remove pack size from end of brand name (case-insensitive)
        pack_size_pattern = r'\s+' + re.escape(pack_size) + r'$'
        clean_brand = re.sub(pack_size_pattern, '', brand_name, flags=re.IGNORECASE)
        
        # Also handle cases where pack size is at the end without space
        if clean_brand == brand_name:  # No change, try without space
            pack_size_pattern_no_space = re.escape(pack_size) + r'$'
            clean_brand = re.sub(pack_size_pattern_no_space, '', brand_name, flags=re.IGNORECASE)
        
        return clean_brand.strip()
    
    @staticmethod
    def categorize_brands(brands: List[str], our_brand: str) -> Dict[str, List[str]]:
        """
        Categorize brands into our brand, competitors, and unknown
        
        Args:
            brands: List of brand names to categorize
            our_brand: Name of our brand for comparison
            
        Returns:
            Dict with categorized brand lists
        """
        our_brand_lower = our_brand.lower().strip()
        categorized = {
            'our_brand': [],
            'competitors': [],
            'unknown': []
        }
        
        for brand in brands:
            if not brand:
                continue
                
            brand_clean = brand.strip()
            if brand_clean.lower() == our_brand_lower:
                categorized['our_brand'].append(brand_clean)
            elif brand_clean.lower() != our_brand_lower and len(brand_clean) > 1:
                categorized['competitors'].append(brand_clean)
            else:
                categorized['unknown'].append(brand_clean)
        
        return categorized
    
    @staticmethod
    def normalize_brand_name(brand_name: str) -> str:
        """
        Normalize brand name for consistent comparison
        
        Args:
            brand_name: Brand name to normalize
            
        Returns:
            Normalized brand name
        """
        if not brand_name:
            return ''
        
        # Convert to title case and clean up spacing
        normalized = brand_name.strip()
        normalized = re.sub(r'\s+', ' ', normalized)  # Multiple spaces to single
        normalized = normalized.replace('_', ' ')     # Underscores to spaces
        
        return normalized
    
    @staticmethod
    def extract_brands_from_columns(columns: List[str]) -> List[str]:
        """
        Extract unique brand names from a list of columns
        
        Args:
            columns: List of column names to extract brands from
            
        Returns:
            List of unique brand names found
        """
        brands = set()
        
        for col in columns:
            # Try different extraction methods
            brand_complete = BrandExtractor.extract_brand_from_target_variable(col)
            brand_only = BrandExtractor.extract_brand_only_from_price_column(col)
            
            if brand_complete:
                brands.add(BrandExtractor.normalize_brand_name(brand_complete))
            if brand_only and brand_only != brand_complete:
                brands.add(BrandExtractor.normalize_brand_name(brand_only))
        
        # Filter out empty or very short brand names
        return [brand for brand in brands if brand and len(brand) > 1]
    
    @staticmethod
    def validate_brand_extraction(column_name: str, expected_brand: str) -> bool:
        """
        Validate that brand extraction produces expected result
        
        Args:
            column_name: Column name to test extraction on
            expected_brand: Expected brand name result
            
        Returns:
            True if extraction matches expected result
        """
        extracted = BrandExtractor.extract_brand_only_from_price_column(column_name)
        return extracted.lower().strip() == expected_brand.lower().strip()
    
    @staticmethod
    def _is_pack_size_number(text: str) -> bool:
        """
        Check if text represents a pack size number pattern
        
        Args:
            text: Text to check
            
        Returns:
            True if text matches pack size number patterns
        """
        # Patterns for pack size numbers
        patterns = [
            r'^\d+[-]?\d*$',      # 150, 150-, etc.
            r'^\d+[-]\d+$',       # 150-250, 251-500
            r'^>\d+$',            # >650
            r'^\d+ml$',           # 150ml
            r'^\d+\s*-\s*\d+ml$'  # 150-250ml
        ]
        
        for pattern in patterns:
            if re.match(pattern, text, re.IGNORECASE):
                return True
        
        return False
    
    @staticmethod
    def get_brand_extraction_statistics(columns: List[str]) -> Dict[str, Any]:
        """
        Get statistics about brand extraction from columns
        
        Args:
            columns: List of columns to analyze
            
        Returns:
            Dict with extraction statistics
        """
        stats = {
            'total_columns': len(columns),
            'columns_with_brands': 0,
            'unique_brands': [],
            'extraction_success_rate': 0.0,
            'common_patterns': {}
        }
        
        brands_found = []
        
        for col in columns:
            brand = BrandExtractor.extract_brand_only_from_price_column(col)
            if brand:
                brands_found.append(brand)
                stats['columns_with_brands'] += 1
        
        stats['unique_brands'] = list(set(brands_found))
        stats['extraction_success_rate'] = (
            stats['columns_with_brands'] / stats['total_columns'] * 100 
            if stats['total_columns'] > 0 else 0
        )
        
        # Count common patterns
        pattern_counts = {}
        for col in columns:
            for prefix in BrandExtractor.COMMON_PREFIXES:
                if re.search(prefix, col, re.IGNORECASE):
                    pattern_name = prefix.replace(r'^', '').replace(r'\s+', ' ').strip()
                    pattern_counts[pattern_name] = pattern_counts.get(pattern_name, 0) + 1
        
        stats['common_patterns'] = pattern_counts
        
        return stats
