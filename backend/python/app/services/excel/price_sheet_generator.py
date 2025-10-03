"""
========================================
PRICE SHEET GENERATOR - EXCEL MODULE
========================================

Purpose: Price sheet generation functionality

Description:
Handles the creation of price sheets from concatenated data with regional
and monthly aggregation, data formatting, and validation.

Key Functionality:
- Price sheet generation with regional and monthly aggregation
- Data formatting and validation for price analysis
- Column identification and data organization
- Date formatting and sorting

Last Updated: 2024-12-23
Author: BrandBloom Backend Team
"""

import pandas as pd
import re
from pathlib import Path
from typing import Dict, List, Any, Tuple
from datetime import datetime

from app.models.data_models import PriceSheetInfo


class PriceSheetGenerator:
    """Handles price sheet generation with data formatting and validation"""
    
    @staticmethod
    def create_price_sheet(file_path: Path, selected_sheets: List[str]) -> Tuple[pd.DataFrame, bool]:
        """
        Create a comprehensive price sheet from the Excel file
        
        Args:
            file_path: Path to the Excel file
            selected_sheets: List of sheet names to process
            
        Returns:
            Tuple of (price_dataframe, creation_success)
        """
        try:
            print(f"🏷️ Creating price sheet from: {file_path}")
            
            # Read all sheets and concatenate
            all_data = []
            for sheet_name in selected_sheets:
                try:
                    df = pd.read_excel(file_path, sheet_name=sheet_name)
                    print(f"   📄 Read sheet '{sheet_name}': {len(df)} rows")
                    all_data.append(df)
                except Exception as e:
                    print(f"   ❌ Error reading sheet '{sheet_name}': {e}")
                    continue
            
            if not all_data:
                print("❌ No data found in any sheet")
                return pd.DataFrame(), False
            
            # Concatenate all data
            combined_df = pd.concat(all_data, ignore_index=True, sort=False)
            print(f"📊 Combined data: {len(combined_df)} rows, {len(combined_df.columns)} columns")
            
            # Find required columns
            required_columns = PriceSheetGenerator._find_required_columns(combined_df.columns)
            
            if not all(required_columns.values()):
                print("❌ Missing required columns for price sheet")
                return pd.DataFrame(), False
            
            # Create price sheet
            price_df = PriceSheetGenerator._build_price_sheet(combined_df, required_columns)
            
            if len(price_df) == 0:
                print("❌ No price data could be generated")
                return pd.DataFrame(), False
            
            print(f"✅ Price sheet created: {len(price_df)} rows")
            return price_df, True
            
        except Exception as e:
            print(f"❌ Error creating price sheet: {e}")
            return pd.DataFrame(), False
    
    @staticmethod
    def _find_required_columns(columns: List[str]) -> Dict[str, str]:
        """Find required columns for price sheet"""
        required = {
            'region': '',
            'month': '',
            'channel': ''
        }
        
        for col in columns:
            col_lower = col.lower()
            if 'region' in col_lower and not required['region']:
                required['region'] = col
            elif 'month' in col_lower and not required['month']:
                required['month'] = col
            elif 'channel' in col_lower and not required['channel']:
                required['channel'] = col
        
        return required
    
    @staticmethod
    def _build_price_sheet(df: pd.DataFrame, required_columns: Dict[str, str]) -> pd.DataFrame:
        """Build the actual price sheet"""
        # Get price columns
        price_columns = PriceSheetGenerator._find_price_columns(df.columns)
        
        if not price_columns:
            return pd.DataFrame()
        
        # Select required columns + price columns
        columns_to_keep = list(required_columns.values()) + price_columns
        price_df = df[columns_to_keep].copy()
        
        # Remove rows where all price columns are null
        price_df = price_df.dropna(subset=price_columns, how='all')
        
        # Format month column to proper date format
        if required_columns['month']:
            price_df[required_columns['month']] = price_df[required_columns['month']].apply(
                PriceSheetGenerator._format_month_to_date
            )
        
        # Sort by date if possible
        if required_columns['month']:
            price_df = PriceSheetGenerator._sort_price_data_by_date(price_df, required_columns['month'])
        
        return price_df
    
    @staticmethod
    def _find_price_columns(columns: List[str]) -> List[str]:
        """Find columns that contain price data"""
        price_patterns = [
            r'price.*(?:rs|inr|₹)',
            r'(?:unit|avg|average)\s*price',
            r'price\s+\w+',
            r'\w+\s+price'
        ]
        
        price_columns = []
        for col in columns:
            col_lower = col.lower()
            # Skip non-price columns
            if any(skip in col_lower for skip in ['region', 'month', 'channel', 'packsize']):
                continue
            
            # Check if it matches price patterns
            for pattern in price_patterns:
                if re.search(pattern, col_lower):
                    price_columns.append(col)
                    break
        
        return price_columns
    
    @staticmethod
    def _find_our_brand_column(price_columns: List[str], our_brand: str) -> str:
        """Find the price column for our brand"""
        our_brand_lower = our_brand.lower()
        
        for col in price_columns:
            col_lower = col.lower()
            if our_brand_lower in col_lower:
                return col
        
        return ""
    

    
    @staticmethod
    def _format_month_to_date(month_value) -> str:
        """Format month value to standard date format"""
        if pd.isna(month_value):
            return ""
        
        try:
            # If it's already a datetime, format it
            if isinstance(month_value, pd.Timestamp):
                return month_value.strftime('%Y-%m')
            
            # Try to parse as string
            month_str = str(month_value).strip()
            
            # Handle various month formats
            month_patterns = [
                (r'(\d{4})-(\d{1,2})', r'\1-\2'),  # 2024-1 → 2024-01
                (r'(\w{3})\s*(\d{4})', r'\2-\1'),   # Jan 2024 → 2024-Jan
                (r'(\d{1,2})/(\d{4})', r'\2-\1'),   # 1/2024 → 2024-1
            ]
            
            for pattern, replacement in month_patterns:
                match = re.search(pattern, month_str)
                if match:
                    return re.sub(pattern, replacement, month_str)
            
            return month_str
            
        except Exception:
            return str(month_value)
    
    @staticmethod
    def _sort_price_data_by_date(price_df: pd.DataFrame, month_column: str) -> pd.DataFrame:
        """Sort price data by date column"""
        try:
            # Try to convert to datetime for proper sorting
            price_df[month_column] = pd.to_datetime(price_df[month_column], errors='coerce')
            return price_df.sort_values(by=month_column)
        except Exception:
            # If date parsing fails, return unsorted
            return price_df
