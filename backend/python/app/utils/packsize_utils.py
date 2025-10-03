"""
Pack Size Utility Module for BrandBloom Insights
Provides dynamic pack size extraction, ranking, and comparison functionality.

This module handles pack size analysis for the BrandBloom Insights platform, enabling
dynamic ranking of product pack sizes for better RPI (Relative Price Index) analysis.

Author: BrandBloom Insights Team
Created: 2024-12-23
Last Modified: 2024-12-23
"""

import re
from typing import Optional, Dict, List, Tuple
from enum import Enum


class PackSizeCategory(Enum):
    """Enumeration of pack size categories with their ranking order."""
    SACHET = 1
    SMALL = 2      # 150-250ML
    MEDIUM = 3     # 251-500ML  
    LARGE = 4      # 501-650ML
    EXTRA_LARGE = 5  # >650ML
    UNKNOWN = 99   # Unrecognized pack sizes


class PackSizeRanker:
    """
    Dynamic pack size ranking and comparison utility.
    
    Provides functionality to extract, categorize, and rank pack sizes from product names
    or column headers, enabling intelligent comparison for RPI calculations.
    """
    
    # Pack size patterns with their corresponding categories
    PACK_SIZE_PATTERNS = {
        # Sachet patterns (smallest)
        r'sachet|pouch': PackSizeCategory.SACHET,
        
        # Extra Large (>650ML) - Check this FIRST before other ML ranges
        r'>650\s*ml|700\s*ml|750\s*ml|1000\s*ml|1\s*ltr|1\s*l': PackSizeCategory.EXTRA_LARGE,
        
        # Large range (501-650ML)
        r'501[-\s]*650\s*ml|600\s*ml|650\s*ml': PackSizeCategory.LARGE,
        
        # Medium range (251-500ML)  
        r'251[-\s]*500\s*ml|300\s*ml|400\s*ml|500\s*ml': PackSizeCategory.MEDIUM,
        
        # Small range (150-250ML)
        r'150[-\s]*250\s*ml|150\s*ml|200\s*ml|250\s*ml': PackSizeCategory.SMALL,
    }
    
    # Numeric thresholds for size-based categorization
    SIZE_THRESHOLDS = {
        PackSizeCategory.SMALL: (150, 250),
        PackSizeCategory.MEDIUM: (251, 500),
        PackSizeCategory.LARGE: (501, 650),
        PackSizeCategory.EXTRA_LARGE: (651, float('inf')),
    }
    
    @staticmethod
    def extract_pack_size(text: str) -> Optional[str]:
        """
        Extract pack size from text (column name, product name, etc.).
        
        Args:
            text: Input text to extract pack size from
            
        Returns:
            Extracted pack size string or None if not found
            
        Examples:
            >>> PackSizeRanker.extract_pack_size("Price per ml X-Men Sachet")
            'Sachet'
            >>> PackSizeRanker.extract_pack_size("Volume X-Men 150-250ML")  
            '150-250ML'
            >>> PackSizeRanker.extract_pack_size("Value Clear Men >650ML")
            '>650ML'
        """
        if not text:
            return None
            
        text_lower = text.lower().strip()
        
        # Check for sachet/pouch first (highest priority)
        if re.search(r'\bsachet\b|\bpouch\b', text_lower):
            return 'Sachet'
            
        # Extract pack sizes exactly as they appear in the data (no hardcoded categories)
        # Look for any size patterns and return them as-is
        size_patterns = [
            r'\b(\d+[-\s]*\d+)\s*ml\b',        # Range patterns: 150-250ML, 251-500ML, etc.
            r'\b(>\s*\d+)\s*ml\b',             # Greater than: >650ML, > 500ML
            r'\b(<\s*\d+)\s*ml\b',             # Less than: <150ML
            r'\b(\d+)\s*ml\b',                 # Single values: 150ML, 500ML, 1000ML
            r'\b(\d+(?:\.\d+)?)\s*l(?:tr)?\b', # Liters: 1L, 1.5L, 2LTR
        ]
        
        for pattern in size_patterns:
            match = re.search(pattern, text_lower)
            if match:
                size_part = match.group(1).strip()
                # Clean up spacing in size part
                size_part = re.sub(r'\s+', '', size_part)  # Remove internal spaces
                
                # Determine unit based on original text
                if re.search(r'\bl(?:tr)?\b', match.group(0)):
                    return f"{size_part}L"
                else:
                    return f"{size_part}ML"
                    
        return None
    
    @staticmethod
    def categorize_pack_size(pack_size: str) -> PackSizeCategory:
        """
        Categorize a pack size string into its ranking category.
        
        Args:
            pack_size: Pack size string (e.g., "Sachet", "150-250ML", ">650ML")
            
        Returns:
            PackSizeCategory enum value
            
        Examples:
            >>> PackSizeRanker.categorize_pack_size("Sachet")
            PackSizeCategory.SACHET
            >>> PackSizeRanker.categorize_pack_size("150-250ML")
            PackSizeCategory.SMALL
        """
        if not pack_size:
            return PackSizeCategory.UNKNOWN
            
        pack_size_lower = pack_size.lower().strip()
        
        # Check against predefined patterns
        for pattern, category in PackSizeRanker.PACK_SIZE_PATTERNS.items():
            if re.search(pattern, pack_size_lower):
                return category
                
        # Try to extract numeric value for categorization
        numeric_match = re.search(r'(\d+)', pack_size_lower)
        if numeric_match:
            size_value = int(numeric_match.group(1))
            
            for category, (min_val, max_val) in PackSizeRanker.SIZE_THRESHOLDS.items():
                if min_val <= size_value <= max_val:
                    return category
                    
        return PackSizeCategory.UNKNOWN
    
    @staticmethod
    def get_pack_size_rank(pack_size: str) -> int:
        """
        Get the numeric rank of a pack size (1 = smallest, higher = larger).
        
        Args:
            pack_size: Pack size string
            
        Returns:
            Numeric rank (1-99, where 1 is smallest)
            
        Examples:
            >>> PackSizeRanker.get_pack_size_rank("Sachet")
            1
            >>> PackSizeRanker.get_pack_size_rank("150-250ML") 
            2
            >>> PackSizeRanker.get_pack_size_rank(">650ML")
            5
        """
        category = PackSizeRanker.categorize_pack_size(pack_size)
        return category.value
    
    @staticmethod
    def compare_pack_sizes(size1: str, size2: str) -> int:
        """
        Compare two pack sizes and return comparison result.
        
        Args:
            size1: First pack size string
            size2: Second pack size string
            
        Returns:
            -1 if size1 < size2, 0 if equal, 1 if size1 > size2
            
        Examples:
            >>> PackSizeRanker.compare_pack_sizes("Sachet", "150-250ML")
            -1
            >>> PackSizeRanker.compare_pack_sizes("500ML", "250ML") 
            1
            >>> PackSizeRanker.compare_pack_sizes("Sachet", "Sachet")
            0
        """
        rank1 = PackSizeRanker.get_pack_size_rank(size1)
        rank2 = PackSizeRanker.get_pack_size_rank(size2)
        
        if rank1 < rank2:
            return -1
        elif rank1 > rank2:
            return 1
        else:
            return 0
    
    @staticmethod
    def sort_pack_sizes(pack_sizes: List[str], reverse: bool = False) -> List[str]:
        """
        Sort a list of pack sizes by their ranking.
        
        Args:
            pack_sizes: List of pack size strings
            reverse: If True, sort from largest to smallest
            
        Returns:
            Sorted list of pack sizes
            
        Examples:
            >>> PackSizeRanker.sort_pack_sizes(["500ML", "Sachet", "150ML"])
            ['Sachet', '150ML', '500ML']
        """
        return sorted(pack_sizes, key=PackSizeRanker.get_pack_size_rank, reverse=reverse)
    
    @staticmethod
    def get_pack_size_info(text: str) -> Dict:
        """
        Get comprehensive pack size information from text.
        
        Args:
            text: Input text to analyze
            
        Returns:
            Dictionary with pack size analysis results
            
        Examples:
            >>> PackSizeRanker.get_pack_size_info("Price per ml X-Men Sachet")
            {
                'original_text': 'Price per ml X-Men Sachet',
                'extracted_pack_size': 'Sachet',
                'category': PackSizeCategory.SACHET,
                'rank': 1,
                'is_smallest': True,
                'is_largest': False
            }
        """
        pack_size = PackSizeRanker.extract_pack_size(text)
        category = PackSizeRanker.categorize_pack_size(pack_size) if pack_size else PackSizeCategory.UNKNOWN
        rank = category.value
        
        return {
            'original_text': text,
            'extracted_pack_size': pack_size,
            'category': category,
            'rank': rank,
            'is_smallest': rank == 1,
            'is_largest': rank == 5,
            'is_unknown': category == PackSizeCategory.UNKNOWN
        }


class PackSizeRPIAnalyzer:
    """
    Specialized analyzer for RPI calculations with pack size awareness.
    
    Provides intelligent RPI analysis that considers pack size relationships
    and generates meaningful comparisons.
    """
    
    @staticmethod
    def should_compare_pack_sizes(size1: str, size2: str) -> bool:
        """
        Determine if two pack sizes should be compared in RPI analysis.
        
        Args:
            size1: First pack size
            size2: Second pack size
            
        Returns:
            True if comparison is meaningful, False otherwise
        """
        if not size1 or not size2:
            return False
            
        # Always allow comparison - business users want to see all relationships
        return True
    
    @staticmethod
    def get_rpi_comparison_priority(size1: str, size2: str) -> int:
        """
        Get priority score for RPI comparison (higher = more important).
        
        Args:
            size1: First pack size
            size2: Second pack size
            
        Returns:
            Priority score (1-10, where 10 is highest priority)
        """
        rank1 = PackSizeRanker.get_pack_size_rank(size1)
        rank2 = PackSizeRanker.get_pack_size_rank(size2)
        
        # Higher priority for comparing adjacent sizes
        rank_difference = abs(rank1 - rank2)
        
        if rank_difference == 1:
            return 10  # Adjacent sizes - highest priority
        elif rank_difference == 2:
            return 8   # One size apart - high priority
        elif rank_difference == 3:
            return 6   # Two sizes apart - medium priority
        else:
            return 4   # Far apart - lower priority
    
    @staticmethod
    def generate_rpi_insights(pack_size_data: Dict[str, float]) -> List[str]:
        """
        Generate business insights from pack size RPI data.
        
        Args:
            pack_size_data: Dictionary mapping pack sizes to RPI values
            
        Returns:
            List of business insight strings
        """
        insights = []
        
        if not pack_size_data:
            return insights
            
        # Sort by pack size rank for analysis
        sorted_sizes = sorted(pack_size_data.keys(), key=PackSizeRanker.get_pack_size_rank)
        
        # Check for pack size premiums/discounts
        for i in range(len(sorted_sizes) - 1):
            current_size = sorted_sizes[i]
            next_size = sorted_sizes[i + 1]
            
            current_rpi = pack_size_data[current_size]
            next_rpi = pack_size_data[next_size]
            
            if current_rpi > next_rpi:
                premium_pct = ((current_rpi - next_rpi) / next_rpi) * 100
                insights.append(f"{current_size} commands {premium_pct:.1f}% premium over {next_size}")
            elif next_rpi > current_rpi:
                discount_pct = ((next_rpi - current_rpi) / next_rpi) * 100
                insights.append(f"{current_size} offers {discount_pct:.1f}% discount vs {next_size}")
        
        return insights


# Convenience functions for direct use
def extract_pack_size_from_column(column_name: str) -> Optional[str]:
    """Extract pack size from column name - convenience function."""
    return PackSizeRanker.extract_pack_size(column_name)


def rank_pack_sizes(pack_sizes: List[str]) -> List[Tuple[str, int]]:
    """Rank pack sizes and return with their scores - convenience function."""
    return [(size, PackSizeRanker.get_pack_size_rank(size)) for size in pack_sizes]


def is_smaller_pack_size(size1: str, size2: str) -> bool:
    """Check if size1 is smaller than size2 - convenience function."""
    return PackSizeRanker.compare_pack_sizes(size1, size2) < 0
