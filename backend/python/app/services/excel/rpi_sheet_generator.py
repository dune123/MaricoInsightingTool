"""
========================================
RPI SHEET GENERATOR - EXCEL MODULE
========================================

Purpose: RPI (Relative Price Index) sheet generation with advanced business logic

Description:
Handles the creation of RPI sheets from price data with sophisticated pack size
intelligence, brand extraction, and competitive analysis. Implements business
rules for RPI calculations with pack size prioritization and brand matching.

Key Functionality:
- RPI sheet generation from price data with brand analysis
- Pack size intelligent comparison and prioritization
- Brand extraction from price columns with deduplication logic
- RPI column naming with consistent format
- Competitive analysis with pack size insights
- Data sorting and organization

Business Logic:
- RPI calculation: Our Brand Price / Competitor Price
- Pack size prioritization using ranking systems
- Brand name cleaning to prevent duplication
- Consistent RPI column naming format
- Regional and temporal data organization

Dependencies:
- pandas for data manipulation
- app.utils.packsize_utils for pack size analysis
- app.models.data_models for data structures

Last Updated: 2024-12-23
Author: BrandBloom Backend Team
"""

import pandas as pd
import re
from typing import Dict, List, Any, Tuple, Optional
from datetime import datetime

from app.utils.packsize_utils import PackSizeRanker, PackSizeRPIAnalyzer, extract_pack_size_from_column
from app.models.data_models import RPISheetInfo


class RPISheetGenerator:
    """Handles RPI (Relative Price Index) sheet generation with advanced business logic"""
    
    @staticmethod
    def create_rpi_sheet(price_df: pd.DataFrame, brand_name: str) -> Tuple[pd.DataFrame, bool]:
        """
        Create an RPI (Relative Price Index) sheet from Price sheet data
        
        Simple Logic: Our Brand Price / Every Other Price Column
        - Creates RPI for our brand vs every single other price column
        - Includes Category and Entire Brand aggregations
        - Maintains Month and Region columns from Price sheet
        
        Args:
            price_df: DataFrame from Price sheet with region, month, and price columns
            brand_name: Name of our brand (e.g., "X-Men")
            
        Returns:
            Tuple of (rpi_sheet_dataframe, success_flag)
        """
        try:
            if price_df is None or price_df.empty:
                print("❌ No Price sheet data available for RPI calculation")
                return None, False
                
            print(f"📊 Creating RPI sheet with Our Brand: '{brand_name}'...")
            
            # Step 1: Identify price columns (exclude Region, Month)
            base_columns = ['Region', 'Month']
            price_columns = [col for col in price_df.columns if col not in base_columns and 'price' in col.lower()]
            
            if len(price_columns) < 2:
                print(f"❌ Need at least 2 price columns for RPI calculation, found {len(price_columns)}")
                return None, False
                
            print(f"   📋 Found {len(price_columns)} price columns: {price_columns}")
            
            # Step 2: Identify Our Brand columns using improved brand extraction
            brand_name_columns, other_columns = RPISheetGenerator._identify_brand_columns(
                price_columns, brand_name
            )
            
            if not brand_name_columns:
                print(f"❌ No price columns found for our brand '{brand_name}'")
                return None, False
            
            # Step 3: Create RPI calculations with pack size intelligence
            rpi_data = []
            pack_size_analysis = {}  # Track pack size comparisons for insights
            
            for _, row in price_df.iterrows():
                row_data = RPISheetGenerator._create_base_row_data(row)
                
                # For each Our Brand column, calculate RPI vs every other column with pack size awareness
                for our_col in brand_name_columns:
                    our_price = row.get(our_col)
                    if pd.isna(our_price) or our_price == 0:
                        continue
                    
                    # Process RPI calculations for this our brand column
                    rpi_calculations = RPISheetGenerator._calculate_rpi_for_brand_column(
                        row, our_col, price_columns, brand_name, pack_size_analysis
                    )
                    row_data.update(rpi_calculations)
                
                # Only add row if we have at least one RPI calculation
                if len(row_data) > 3:  # More than just Region, Month, Channel
                    rpi_data.append(row_data)
            
            # Step 4: Create RPI DataFrame
            if not rpi_data:
                print("❌ No valid RPI calculations could be performed")
                return None, False
                
            rpi_df = pd.DataFrame(rpi_data)
            
            # Step 5: Organize columns intelligently by pack size ranking
            rpi_df = RPISheetGenerator._organize_rpi_columns(rpi_df)
            
            # Generate pack size insights for logging
            RPISheetGenerator._log_pack_size_insights(pack_size_analysis)
            
            # Step 6: Sort by Region then Month for consistency with Price sheet
            rpi_df = RPISheetGenerator._sort_price_data_by_date(rpi_df)
            
            rpi_columns = [col for col in rpi_df.columns if col.startswith('RPI')]
            print(f"   ✅ RPI sheet created successfully with {len(rpi_df)} rows and {len(rpi_columns)} RPI columns")
            print(f"   📊 Sample RPI Columns: {rpi_columns[:5]}..." if len(rpi_columns) > 5 else f"   📊 RPI Columns: {rpi_columns}")
            
            return rpi_df, True
            
        except Exception as e:
            print(f"❌ Error creating RPI sheet: {str(e)}")
            import traceback
            traceback.print_exc()
            return None, False
    
    @staticmethod
    def _identify_brand_columns(price_columns: List[str], brand_name: str) -> Tuple[List[str], List[str]]:
        """Identify Our Brand columns vs other columns using improved brand extraction"""
        brand_name_columns = []
        other_columns = []
        
        print(f"   🔍 Looking for our brand: '{brand_name}'")
        brand_name_lower = brand_name.lower()
        
        for col in price_columns:
            # Extract complete brand+packsize and brand-only for comparison
            extracted_brand_full = RPISheetGenerator.extract_brand_from_target_variable(col)
            extracted_brand_only = RPISheetGenerator.extract_brand_only_from_price_column(col)
            
            print(f"   📋 Column: '{col}'")
            print(f"       -> Complete: '{extracted_brand_full}'")
            print(f"       -> Brand Only: '{extracted_brand_only}'")
            
            # Use EXACT equality matching like frontend (case-insensitive)
            if extracted_brand_only.lower().strip() == brand_name.lower().strip():
                brand_name_columns.append(col)
                print(f"       ✅ EXACT MATCH: '{extracted_brand_only}' == '{brand_name}'")
            else:
                other_columns.append(col)
                print(f"       ❌ No match: '{extracted_brand_only}' != '{brand_name}'")
        
        print(f"   🏢 Our Brand columns ({len(brand_name_columns)}): {brand_name_columns}")
        print(f"   🏭 Other columns ({len(other_columns)}): {other_columns}")
        
        return brand_name_columns, other_columns
    
    @staticmethod
    def _create_base_row_data(row: pd.Series) -> Dict[str, Any]:
        """Create base row data with Region, Month, Channel"""
        return {
            'Region': row['Region'],
            'Month': row['Month'],
            'Channel': row.get('Channel', '')
        }
    
    @staticmethod
    def _calculate_rpi_for_brand_column(
        row: pd.Series, 
        our_col: str, 
        price_columns: List[str], 
        brand_name: str,
        pack_size_analysis: Dict[str, List[float]]
    ) -> Dict[str, float]:
        """Calculate RPI values for one of our brand columns against all others"""
        rpi_calculations = {}
        
        # Extract our brand info and pack size for intelligent comparison
        brand_name_only = RPISheetGenerator.extract_brand_only_from_price_column(our_col)
        our_pack_size = extract_pack_size_from_column(our_col)
        
        # Skip if we can't determine pack size - no fallbacks
        if not our_pack_size:
            return rpi_calculations
        
        our_price = row.get(our_col)
        
        # RPI vs every other specific column with pack size prioritization
        all_other_columns = [col for col in price_columns if col != our_col]
        
        # Sort other columns by pack size comparison priority
        column_priorities = []
        for other_col in all_other_columns:
            other_pack_size = extract_pack_size_from_column(other_col)
            if not other_pack_size:
                continue  # Skip columns where we can't determine pack size
            priority = PackSizeRPIAnalyzer.get_rpi_comparison_priority(our_pack_size, other_pack_size)
            column_priorities.append((other_col, priority, other_pack_size))
        
        # Sort by priority (highest first) for more meaningful RPI ordering
        column_priorities.sort(key=lambda x: x[1], reverse=True)
        
        for other_col, priority, other_pack_size in column_priorities:
            other_price = row.get(other_col)
            if pd.isna(other_price) or other_price == 0:
                continue
            
            # Skip if we can't determine competitor pack size - no fallbacks
            if not other_pack_size:
                continue
            
            # Extract other brand info for RPI column naming
            other_brand_only = RPISheetGenerator.extract_brand_only_from_price_column(other_col)
            
            # Calculate RPI (simple division)
            rpi_value = float(our_price) / float(other_price)
            
            # Create CONSISTENT column name: RPI <Our Brand> <PackSize> v/s <Competitor Brand> <PackSize>
            # Clean the competitor brand name to remove duplicate pack sizes
            clean_other_brand = RPISheetGenerator._remove_pack_size_from_brand_name(other_brand_only, other_pack_size)
            
            # Only use detected pack sizes - no fallbacks
            display_our_pack = our_pack_size
            display_other_pack = other_pack_size
            
            # ALWAYS use consistent format: RPI <Brand> <PackSize> v/s <Brand> <PackSize>
            rpi_column_name = f"RPI {brand_name_only} {display_our_pack} v/s {clean_other_brand} {display_other_pack}".strip()
            
            rpi_calculations[rpi_column_name] = round(rpi_value, 4)
            
            # Track pack size analysis for insights
            pack_comparison_key = f"{our_pack_size}_vs_{other_pack_size}"
            if pack_comparison_key not in pack_size_analysis:
                pack_size_analysis[pack_comparison_key] = []
            pack_size_analysis[pack_comparison_key].append(rpi_value)
        
        return rpi_calculations
    
    @staticmethod
    def _organize_rpi_columns(rpi_df: pd.DataFrame) -> pd.DataFrame:
        """Organize RPI columns intelligently by pack size ranking"""
        rpi_columns = [col for col in rpi_df.columns if col.startswith('RPI')]
        
        # Sort RPI columns by pack size ranking for logical order
        def sort_rpi_columns(col_name):
            """Sort RPI columns by pack size ranking for logical presentation."""
            try:
                # Extract pack sizes from RPI column name
                # Format: "RPI Brand1 Size1 v/s Brand2 Size2"
                parts = col_name.split(' v/s ')
                if len(parts) == 2:
                    # Extract pack sizes from both sides
                    left_part = parts[0].replace('RPI ', '')
                    right_part = parts[1]
                    
                    # Try to extract pack sizes from the end of each part
                    left_size = extract_pack_size_from_column(left_part)
                    right_size = extract_pack_size_from_column(right_part)
                    
                    # Skip if we can't determine pack sizes - no fallbacks
                    if not left_size or not right_size:
                        return (99, 99, col_name)  # Sort unknown columns to end
                    
                    # Primary sort: our brand pack size rank
                    # Secondary sort: competitor pack size rank  
                    left_rank = PackSizeRanker.get_pack_size_rank(left_size)
                    right_rank = PackSizeRanker.get_pack_size_rank(right_size)
                    
                    return (left_rank, right_rank, col_name)
                
                return (99, 99, col_name)  # Unknown/unsorted columns go to end
            except Exception:
                return (99, 99, col_name)
        
        # Sort RPI columns by pack size logic
        sorted_rpi_columns = sorted(rpi_columns, key=sort_rpi_columns)
        columns_order = ['Region', 'Month', 'Channel'] + sorted_rpi_columns
        return rpi_df[columns_order]
    
    @staticmethod
    def _log_pack_size_insights(pack_size_analysis: Dict[str, List[float]]) -> None:
        """Log pack size insights and generate business insights"""
        print(f"   📊 Pack Size Analysis Summary:")
        for comparison, values in pack_size_analysis.items():
            if values:
                avg_rpi = sum(values) / len(values)
                print(f"       {comparison.replace('_vs_', ' vs ')}: Average RPI = {avg_rpi:.3f}")
        
        # Generate business insights using the new analyzer
        if pack_size_analysis:
            insights = PackSizeRPIAnalyzer.generate_rpi_insights(
                {k.replace('_vs_', ' vs '): sum(v)/len(v) for k, v in pack_size_analysis.items() if v}
            )
            if insights:
                print(f"   💡 Pack Size Insights:")
                for insight in insights[:3]:  # Show top 3 insights
                    print(f"       • {insight}")
    
    @staticmethod
    def _sort_price_data_by_date(price_df: pd.DataFrame) -> pd.DataFrame:
        """
        Sort price data by Region and then by Month in chronological order
        
        This method ensures that months are sorted chronologically rather than alphabetically,
        which is crucial for time-series analysis and proper data visualization.
        
        Args:
            price_df: DataFrame with Region and Month columns
            
        Returns:
            Sorted DataFrame
        """
        try:
            # Create a copy to avoid modifying the original
            df_sorted = price_df.copy()
            
            # Create a proper datetime column for sorting
            df_sorted['sort_date'] = pd.to_datetime(df_sorted['Month'], format='%b-%y', errors='coerce')
            
            # Sort by Region first, then by chronological date
            df_sorted = df_sorted.sort_values(['Region', 'sort_date']).reset_index(drop=True)
            
            # Remove the temporary sort column
            df_sorted = df_sorted.drop(columns=['sort_date'])
            
            print(f"      ✅ Data sorted by Region and chronological Month order")
            return df_sorted
            
        except Exception as e:
            print(f"      ⚠️ Error sorting by date, using basic sort: {str(e)}")
            # Fallback to basic sorting
            return price_df.sort_values(['Region', 'Month']).reset_index(drop=True)
    
    @staticmethod
    def extract_brand_from_target_variable(target_variable: str) -> str:
        """
        Extract brand name from target variable - EXACT copy of frontend logic
        This extracts just the brand name (e.g., "Volume X-Men" -> "X-Men")
        """
        if not target_variable:
            return ''

        # Convert to string and trim whitespace
        brand_name = target_variable.strip()

        # Remove common measurement prefixes (case insensitive) - EXACT same as frontend
        prefixes_to_remove = [
            r'^Volume\s+',
            r'^Value\s+', 
            r'^Units\s+',
            r'^Vol\s+',
            r'^Val\s+',
            r'^Unit\s+',
            r'^Offtake\s+',
            r'^Price\s+per\s+ml\s+',
            r'^Price\s+'
        ]

        for prefix in prefixes_to_remove:
            brand_name = re.sub(prefix, '', brand_name, flags=re.IGNORECASE)

        # Only clean up excessive whitespace, preserve brand names as-is
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
        """
        if not column_name:
            return ''

        # First, extract the complete brand+packsize using frontend logic
        complete_brand_packsize = RPISheetGenerator.extract_brand_from_target_variable(column_name)
        
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
            if any(indicator in part_lower for indicator in ['ml', 'oz', 'ltr', 'l', 'sachet', 'pouch', 'pack', 'bottle']):
                break
            # Stop if we hit a number range (like 150-250, 251-500, >650)
            if re.match(r'^\d+[-]?\d*$', part) or re.match(r'^\d+[-]\d+$', part) or re.match(r'^>\d+$', part):
                break
            brand_parts.append(part)
        
        return ' '.join(brand_parts).strip() if brand_parts else complete_brand_packsize
    
    @staticmethod
    def _remove_pack_size_from_brand_name(brand_name: str, pack_size: str) -> str:
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
