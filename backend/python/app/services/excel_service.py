"""
========================================
BRANDBLOOM INSIGHTS - EXCEL SERVICE
========================================

Purpose: Main Excel service orchestrator and API facade

Description:
This service module provides a unified interface for all Excel operations by
orchestrating specialized modular services. It maintains backward compatibility
while delegating to focused, single-responsibility modules for better code
organization and maintainability.

Key Functionality:
- Main API facade for Excel operations
- Service orchestration and coordination
- Backward compatibility maintenance
- Error handling and logging coordination
- Configuration and settings management

Architecture:
- Delegates sheet concatenation to SheetConcatenator
- Delegates price sheet creation to PriceSheetGenerator
- Delegates RPI operations to RPISheetGenerator
- Delegates column modifications to ColumnModifier
- Delegates data quality to DataQualityEnhancer
- Delegates brand extraction to BrandExtractor
- Delegates pack size analysis to PackSizeAnalyzer
- Delegates date formatting to DateFormatter

Dependencies:
- app.services.excel modular services
- app.utils.data_utils for data processing
- app.core.config for settings

Used by:
- Route modules for Excel operations
- Data concatenation workflows
- Column modification endpoints
- File processing pipelines

Last Updated: 2024-12-23
Author: BrandBloom Backend Team
"""

import pandas as pd
import re
from pathlib import Path
from typing import Dict, List, Any, Tuple
from datetime import datetime

from app.core.config import settings
from app.utils.data_utils import (
    categorize_columns,
    determine_column_values,
    remove_low_data_columns,
    add_or_update_business_columns,
    generate_preview_data,
    remove_empty_columns
)
from app.utils.file_utils import find_file_with_fallback, find_most_recent_timestamped_file
from app.utils.packsize_utils import PackSizeRanker, PackSizeRPIAnalyzer, extract_pack_size_from_column
from app.models.data_models import ConcatenationResponse, ColumnCategories, ConcatenationDetails, PriceSheetInfo, RPISheetInfo

# Import modular Excel services
from app.services.excel.sheet_concatenator import SheetConcatenator
from app.services.excel.price_sheet_generator import PriceSheetGenerator
from app.services.excel.rpi_sheet_generator import RPISheetGenerator
from app.services.excel.column_modifier import ColumnModifier
from app.services.excel.data_quality_enhancer import DataQualityEnhancer
from app.services.excel.brand_extractor import BrandExtractor
from app.services.excel.pack_size_analyzer import PackSizeAnalyzer
from app.services.excel.date_formatter import DateFormatter

class ExcelService:
    """Service class for Excel operations"""
    
    @staticmethod
    def concatenate_sheets(original_filename: str, selected_sheets: List[str], custom_filename: str = "concatenated", brand_name: str = None) -> Dict[str, Any]:
        """
        Concatenate selected sheets using step-by-step column alignment algorithm
        
        Delegates to SheetConcatenator, PriceSheetGenerator, and RPISheetGenerator for
        modular processing while maintaining backward compatibility.
        
        Args:
            original_filename: Name of the original Excel file
            selected_sheets: List of sheet names to concatenate
            custom_filename: Custom name for output file
            brand_name: Brand name for processing
            
        Returns:
            Dict with concatenation results
        """
        if not selected_sheets:
            raise ValueError("No sheets selected for concatenation")
        
        if not brand_name:
            raise ValueError("Brand name is required - no legacy fallback supported")
        
        # Find source file
        from app.services.file_service import FileService
        file_path, source = FileService.find_file(original_filename, brand_name)
        if not file_path:
            raise FileNotFoundError(f"Source file not found: {original_filename}")
        
        # Validate selected sheets exist
        with pd.ExcelFile(file_path) as excel_file:
            available_sheets = excel_file.sheet_names
        
        valid_selected_sheets = [sheet for sheet in selected_sheets if sheet in available_sheets]
        if not valid_selected_sheets:
            raise ValueError("None of the selected sheets exist in the file")
        
        # Step 1: Perform sheet concatenation using modular service
        final_df, concatenation_log = SheetConcatenator._perform_step_by_step_concatenation(
            file_path, valid_selected_sheets
        )
        
        # Step 2: Apply data quality enhancements
        final_df, empty_columns = DataQualityEnhancer.remove_empty_columns(final_df)
        
        # Step 3: Categorize columns
        column_categories = categorize_columns(list(final_df.columns))
        
        # Step 4: Prepare output file
        brand_dirs = settings.get_brand_directories(brand_name)
        brand_dirs["concat_dir"].mkdir(parents=True, exist_ok=True)
        concatenated_filename = f"{custom_filename}.xlsx"
        output_path = brand_dirs["concat_dir"] / concatenated_filename
        
        # Step 5: Create Price sheet directly from concatenated data
        price_sheet_df, price_sheet_created = ExcelService._create_price_sheet_from_dataframe(final_df)
        
        # Step 6: Create RPI sheet using RPISheetGenerator if conditions are met
        rpi_sheet_df, rpi_sheet_created = None, False
        if price_sheet_created and price_sheet_df is not None and brand_name:
            rpi_sheet_df, rpi_sheet_created = RPISheetGenerator.create_rpi_sheet(price_sheet_df, brand_name)

        # Step 7: Save all sheets to output file
        with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
            final_df.to_excel(writer, sheet_name='Concatenated_Data_Enhanced', index=False)
            
            if price_sheet_created and price_sheet_df is not None:
                price_sheet_df.to_excel(writer, sheet_name='Price', index=False)
            
            if rpi_sheet_created and rpi_sheet_df is not None:
                rpi_sheet_df.to_excel(writer, sheet_name='RPI', index=False)
        
        # Step 8: Generate response data using helper methods
        preview_data = generate_preview_data(final_df, settings.PREVIEW_ROWS)
        
        concatenation_details = ConcatenationDetails(
            removedEmptyColumns=len(empty_columns),
            emptyColumnsRemoved=empty_columns
        )
        
        # Create Price sheet info
        price_sheet_info = ExcelService._create_price_sheet_info(price_sheet_df, price_sheet_created)
        
        # Create RPI sheet info
        rpi_sheet_info = ExcelService._create_rpi_sheet_info(
            rpi_sheet_df, rpi_sheet_created, price_sheet_df, brand_name
        )
        
        # Create response message
        message_parts = [f"Successfully concatenated {len(valid_selected_sheets)} sheets with step-by-step column alignment"]
        if price_sheet_created:
            message_parts.append(f"Created Price sheet with {price_sheet_info.rowCount} unique region-month combinations")
        if rpi_sheet_created:
            message_parts.append(f"Created RPI sheet with {len(rpi_sheet_info.rpiColumns)} price comparisons")
        
        return {
            "success": True,
            "message": ". ".join(message_parts),
            "concatenatedFileName": concatenated_filename,
            "selectedSheets": valid_selected_sheets,
            "totalRows": len(final_df),
            "totalSheets": len(valid_selected_sheets),
            "totalColumns": len(final_df.columns),
            "savedPath": str(output_path),
            "columns": list(final_df.columns),
            "columnCategories": column_categories,
            "previewData": preview_data,
            "concatenationDetails": concatenation_details.dict(),
            "priceSheet": price_sheet_info,
            "rpiSheet": rpi_sheet_info
        }
    
    @staticmethod
    def modify_excel_columns(filename: str, selected_sheets: List[str], brand: str = None) -> Dict[str, Any]:
        """
        Modify Excel file by adding business columns and applying data quality filtering
        
        Delegates to ColumnModifier for modular processing while maintaining
        backward compatibility.
        
        Args:
            filename: Name of Excel file to modify
            selected_sheets: List of sheet names to modify
            brand: Brand name for processing
            
        Returns:
            Dict with modification results
        """
        # Delegate to ColumnModifier service
        return ColumnModifier.modify_excel_columns(filename, selected_sheets, brand)
    
    @staticmethod
    def _create_price_sheet_from_dataframe(df: pd.DataFrame) -> Tuple[pd.DataFrame, bool]:
        """
        Create price sheet directly from concatenated DataFrame
        
        Args:
            df: Concatenated DataFrame with all data
            
        Returns:
            Tuple of (price_dataframe, creation_success)
        """
        try:
            print(f"🏷️ Creating price sheet from concatenated data: {len(df)} rows, {len(df.columns)} columns")
            
            # Find required columns in concatenated data
            required_columns = {}
            for col in df.columns:
                col_lower = col.lower()
                if 'region' in col_lower and 'region' not in required_columns:
                    required_columns['region'] = col
                elif 'month' in col_lower and 'month' not in required_columns:
                    required_columns['month'] = col
                elif 'channel' in col_lower and 'channel' not in required_columns:
                    required_columns['channel'] = col
            
            print(f"   📋 Found required columns: {required_columns}")
            
            if not all(required_columns.values()):
                missing = [k for k, v in required_columns.items() if not v]
                print(f"❌ Missing required columns for price sheet: {missing}")
                return pd.DataFrame(), False
            
            # Find price columns
            price_patterns = [
                r'price.*(?:rs|inr|₹)',
                r'(?:unit|avg|average)\s*price',
                r'price\s+per\s+ml',
                r'price.*\w+',
                r'\w+.*price'
            ]
            
            price_columns = []
            for col in df.columns:
                col_lower = col.lower()
                # Skip business columns
                if any(skip in col_lower for skip in ['region', 'month', 'channel', 'packsize']):
                    continue
                
                # Check if it matches price patterns
                for pattern in price_patterns:
                    if re.search(pattern, col_lower):
                        price_columns.append(col)
                        break
            
            print(f"   💰 Found {len(price_columns)} price columns: {price_columns[:5]}...")
            
            if not price_columns:
                print("❌ No price columns found")
                return pd.DataFrame(), False
            
            # Select required columns + price columns
            columns_to_keep = list(required_columns.values()) + price_columns
            price_df = df[columns_to_keep].copy()
            
            # Remove rows where all price columns are null
            price_df = price_df.dropna(subset=price_columns, how='all')
            
            # Rename columns to standard names for consistency
            column_renames = {}
            for key, col_name in required_columns.items():
                if key == 'region':
                    column_renames[col_name] = 'Region'
                elif key == 'month':
                    column_renames[col_name] = 'Month'
                elif key == 'channel':
                    column_renames[col_name] = 'Channel'
            
            if column_renames:
                price_df = price_df.rename(columns=column_renames)
                print(f"   🔄 Renamed columns: {column_renames}")
            
            # CRITICAL: Group by Month×Region×Channel and aggregate to prevent duplicate rows
            grouping_columns = ['Month', 'Region', 'Channel']
            # Remove any grouping columns that don't exist
            existing_grouping_columns = [col for col in grouping_columns if col in price_df.columns]
            
            if len(existing_grouping_columns) >= 2:  # Need at least Month and Region
                print(f"   📊 Grouping data by: {existing_grouping_columns}")
                
                # Aggregate price columns using mean (or first non-null value)
                agg_dict = {}
                for col in price_df.columns:
                    if col not in existing_grouping_columns:
                        # For price columns, use mean to handle any duplicates
                        agg_dict[col] = 'mean'
                
                # Group and aggregate
                price_df_grouped = price_df.groupby(existing_grouping_columns, as_index=False).agg(agg_dict)
                
                rows_before = len(price_df)
                rows_after = len(price_df_grouped)
                print(f"   🔄 Aggregation: {rows_before} rows → {rows_after} rows (removed {rows_before - rows_after} duplicate combinations)")
                
                price_df = price_df_grouped
            else:
                print(f"   ⚠️ Insufficient grouping columns for aggregation: {existing_grouping_columns}")
            
            # Sort data by Region, Channel, Month (with proper MMM-YY sorting)
            if 'Month' in price_df.columns:
                # Check current month format
                sample_months = price_df['Month'].dropna().head(5).tolist()
                print(f"   📅 Sample months: {sample_months}")
                
                # Create a temporary datetime column for proper sorting of MMM-YY format
                try:
                    # Convert MMM-YY back to datetime for sorting, then remove temp column
                    price_df['_temp_sort_date'] = pd.to_datetime(price_df['Month'], format='%b-%y', errors='coerce')
                    
                    # Sort by Region, Channel, then chronological Month
                    sort_columns = ['Region']
                    if 'Channel' in price_df.columns:
                        sort_columns.append('Channel')
                    sort_columns.append('_temp_sort_date')
                    
                    price_df = price_df.sort_values(sort_columns).reset_index(drop=True)
                    
                    # Remove temporary sorting column
                    price_df = price_df.drop(columns=['_temp_sort_date'])
                    
                    print(f"   🔄 Data sorted by Region, Channel, and chronological Month order")
                    
                except Exception as e:
                    print(f"   ⚠️ Could not sort by date, using alphabetical sort: {e}")
                    # Fallback to basic sorting
                    sort_columns = ['Region']
                    if 'Channel' in price_df.columns:
                        sort_columns.append('Channel')
                    sort_columns.append('Month')
                    price_df = price_df.sort_values(sort_columns).reset_index(drop=True)
                
                # Get unique counts for reporting
                unique_months = price_df['Month'].nunique()
                unique_regions = price_df['Region'].nunique()
                unique_channels = price_df['Channel'].nunique() if 'Channel' in price_df.columns else 0
                
                print(f"   📊 Price sheet created: {len(price_df)} rows, {unique_regions} regions, {unique_months} months, {unique_channels} channels")
                
                # Show final month order
                unique_months_list = price_df['Month'].drop_duplicates().tolist()
                print(f"   📅 Months in order: {unique_months_list[:10]}..." if len(unique_months_list) > 10 else f"   📅 Months in order: {unique_months_list}")
            else:
                print("   ⚠️ No Month column found in price data")
            
            return price_df, True
            
        except Exception as e:
            print(f"❌ Error creating price sheet from dataframe: {e}")
            import traceback
            traceback.print_exc()
            return pd.DataFrame(), False
    
    @staticmethod
    def _create_price_sheet_info(price_sheet_df: pd.DataFrame, price_sheet_created: bool) -> PriceSheetInfo:
        """Create PriceSheetInfo object from price sheet data"""
        if price_sheet_created and price_sheet_df is not None:
            price_columns = [col for col in price_sheet_df.columns if col not in ['Region', 'Month']]
            unique_regions = price_sheet_df['Region'].nunique() if 'Region' in price_sheet_df.columns else 0
            unique_months = price_sheet_df['Month'].nunique() if 'Month' in price_sheet_df.columns else 0
            
            return PriceSheetInfo(
                created=True,
                rowCount=len(price_sheet_df),
                columns=list(price_sheet_df.columns),
                uniqueRegions=unique_regions,
                uniqueMonths=unique_months,
                priceColumns=price_columns,
                message=f"Price sheet with {len(price_sheet_df)} region-month combinations, {unique_regions} regions, {unique_months} months, {len(price_columns)} price columns"
            )
        else:
            return PriceSheetInfo(
                created=False,
                message="Price sheet could not be created - no valid region/month/price data found"
            )
    
    @staticmethod
    def _create_rpi_sheet_info(
        rpi_sheet_df: pd.DataFrame, 
        rpi_sheet_created: bool, 
        price_sheet_df: pd.DataFrame, 
        brand_name: str
    ) -> RPISheetInfo:
        """Create RPISheetInfo object from RPI sheet data"""
        if rpi_sheet_created and rpi_sheet_df is not None:
            rpi_columns = [col for col in rpi_sheet_df.columns if col.startswith('RPI')]
            unique_regions = rpi_sheet_df['Region'].nunique() if 'Region' in rpi_sheet_df.columns else 0
            unique_months = rpi_sheet_df['Month'].nunique() if 'Month' in rpi_sheet_df.columns else 0
            
            # Extract competitor brands from the actual price columns analyzed
            competitor_brands = set()
            
            if price_sheet_df is not None and not price_sheet_df.empty:
                price_columns_for_competitors = [col for col in price_sheet_df.columns if col not in ['Region', 'Month'] and 'price' in col.lower()]
                
                for col in price_columns_for_competitors:
                    extracted_brand_only = BrandExtractor.extract_brand_only_from_price_column(col)
                    # Only add to competitors if it's NOT our brand
                    if extracted_brand_only.lower().strip() != brand_name.lower().strip():
                        if extracted_brand_only and extracted_brand_only != 'Unknown Brand':
                            competitor_brands.add(extracted_brand_only)
            else:
                # Fallback: Extract from RPI column names if price sheet is not available
                for col in rpi_columns:
                    if ' v/s ' in col:
                        competitor_part = col.split(' v/s ')[1]
                        extracted_competitor = BrandExtractor.extract_brand_only_from_price_column(f"Price per ml {competitor_part}")
                        if extracted_competitor and extracted_competitor != 'Unknown Brand':
                            competitor_brands.add(extracted_competitor)
            
            return RPISheetInfo(
                created=True,
                rowCount=len(rpi_sheet_df),
                columns=list(rpi_sheet_df.columns),
                uniqueRegions=unique_regions,
                uniqueMonths=unique_months,
                rpiColumns=rpi_columns,
                ourBrand=brand_name or "",
                competitorBrands=list(competitor_brands),
                message=f"RPI sheet with {len(rpi_sheet_df)} region-month combinations, {len(rpi_columns)} RPI calculations for {brand_name or 'Unknown'} vs {len(competitor_brands)} competitors"
            )
        else:
            return RPISheetInfo(
                created=False,
                message="RPI sheet could not be created - requires Price sheet and brand information"
            )
    
    # All remaining methods have been moved to modular services.
    # This file now serves as a facade/orchestrator for the modular Excel services.
    #
    # Modular services:
    # - SheetConcatenator: handles sheet concatenation operations
    # - PriceSheetGenerator: handles price sheet creation  
    # - RPISheetGenerator: handles RPI sheet generation
    # - ColumnModifier: handles column modification operations
    # - DataQualityEnhancer: handles data quality improvements
    # - BrandExtractor: handles brand name extraction
    # - PackSizeAnalyzer: handles pack size analysis
    # - DateFormatter: handles date/month formatting
    
    @staticmethod
    def extract_brand_from_target_variable(target_variable: str) -> str:
        """
        Extract brand name from target variable
        
        Delegates to BrandExtractor for consistent brand extraction logic.
        """
        return BrandExtractor.extract_brand_from_target_variable(target_variable)

    @staticmethod
    def extract_brand_only_from_price_column(column_name: str) -> str:
        """
        Extract ONLY the brand part from price column for brand matching
        
        Delegates to BrandExtractor for consistent brand extraction logic.
        """
        return BrandExtractor.extract_brand_only_from_price_column(column_name)
    
    @staticmethod
    def get_pack_size_rankings(column_names: List[str]) -> Dict[str, Any]:
        """
        Analyze pack sizes from column names and return ranking information.
        
        Delegates to PackSizeAnalyzer for consistent pack size analysis.
        
        Args:
            column_names: List of column names to analyze
            
        Returns:
            Dictionary with pack size analysis and rankings
        """
        return PackSizeAnalyzer.get_pack_size_rankings(column_names)
