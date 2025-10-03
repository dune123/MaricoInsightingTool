#!/usr/bin/env python3
"""
Debug script for Non-MMM data summary endpoint
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.utils.file_utils import find_file_with_fallback
import pandas as pd
import numpy as np
from datetime import datetime

def test_data_summary():
    """Test the data summary generation logic"""
    try:
        print("Testing Non-MMM data summary...")
        
        # Test parameters
        filename = "MBL Analytics data - 210825_1756674673.xlsx"
        brand = "MBL"
        
        print(f"Filename: {filename}")
        print(f"Brand: {brand}")
        
        # Get brand directories
        brand_dirs = settings.get_brand_directories(brand)
        print(f"Brand directories: {brand_dirs}")
        
        # Create brand directories if they don't exist
        settings.create_brand_directories(brand)
        
        # Find the file
        search_directories = [
            brand_dirs["concat_dir"], 
            brand_dirs["raw_dir"],
            settings.UPLOAD_DIR / "raw",  # Global upload directory as fallback
            settings.RAW_DIR  # Legacy raw directory as fallback
        ]
        
        print(f"Search directories: {search_directories}")
        
        file_path, source_dir = find_file_with_fallback(filename, search_directories)
        
        if not file_path:
            print("❌ File not found!")
            return
        
        print(f"✅ File found at: {file_path}")
        print(f"Source directory: {source_dir}")
        
        # Read the data
        print("Reading Excel file...")
        df = pd.read_excel(file_path)
        print(f"✅ File read successfully. Shape: {df.shape}")
        print(f"Columns: {df.columns.tolist()}")
        
        # Generate summary for each variable
        print("\nGenerating summary for each variable...")
        summary_data = []
        
        for i, column in enumerate(df.columns):
            print(f"Processing column {i+1}/{len(df.columns)}: {column}")
            
            col_data = df[column]
            
            # Determine data type
            if pd.api.types.is_numeric_dtype(col_data):
                var_type = "numeric"
            elif pd.api.types.is_datetime64_any_dtype(col_data):
                var_type = "datetime"
            else:
                var_type = "character"
            
            print(f"  Type: {var_type}")
            
            # Basic statistics
            variable_summary = {
                "name": column,
                "type": var_type,
                "count": len(col_data.dropna()),
                "nullCount": col_data.isnull().sum(),
                "uniqueCount": col_data.nunique()
            }
            
            # Type-specific statistics
            if var_type == "numeric":
                try:
                    mean_val = col_data.mean()
                    median_val = col_data.median()
                    mode_val = col_data.mode()
                    min_val = col_data.min()
                    max_val = col_data.max()
                    std_val = col_data.std()
                    var_val = col_data.var()
                    skew_val = col_data.skew()
                    kurt_val = col_data.kurtosis()
                    
                    variable_summary.update({
                        "mean": float(mean_val) if pd.notna(mean_val) else None,
                        "median": float(median_val) if pd.notna(median_val) else None,
                        "mode": float(mode_val.iloc[0]) if len(mode_val) > 0 else None,
                        "min": float(min_val) if pd.notna(min_val) else None,
                        "max": float(max_val) if pd.notna(max_val) else None,
                        "stdDev": float(std_val) if pd.notna(std_val) else None,
                        "variance": float(var_val) if pd.notna(var_val) else None,
                        "skewness": float(skew_val) if pd.notna(skew_val) else None,
                        "kurtosis": float(kurt_val) if pd.notna(kurt_val) else None
                    })
                    print(f"  ✅ Numeric stats calculated successfully")
                except Exception as e:
                    print(f"  ❌ Error calculating numeric stats: {e}")
                    variable_summary.update({
                        "mean": None, "median": None, "mode": None, "min": None, 
                        "max": None, "stdDev": None, "variance": None, 
                        "skewness": None, "kurtosis": None
                    })
                    
            elif var_type == "datetime":
                try:
                    min_val = col_data.min()
                    max_val = col_data.max()
                    mode_val = col_data.mode()
                    
                    variable_summary.update({
                        "min": min_val.timestamp() * 1000 if pd.notna(min_val) else None,
                        "max": max_val.timestamp() * 1000 if pd.notna(max_val) else None,
                        "mode": mode_val.iloc[0].strftime('%Y-%m-%d') if len(mode_val) > 0 else None
                    })
                    print(f"  ✅ Datetime stats calculated successfully")
                except Exception as e:
                    print(f"  ❌ Error calculating datetime stats: {e}")
                    variable_summary.update({
                        "min": None, "max": None, "mode": None
                    })
            else:  # character
                try:
                    mode_val = col_data.mode()
                    variable_summary.update({
                        "mode": str(mode_val.iloc[0]) if len(mode_val) > 0 else None
                    })
                    print(f"  ✅ Character stats calculated successfully")
                except Exception as e:
                    print(f"  ❌ Error calculating character stats: {e}")
                    variable_summary.update({
                        "mode": None
                    })
            
            summary_data.append(variable_summary)
        
        print(f"\n✅ Summary generated for {len(summary_data)} variables")
        
        # Create final response
        response = {
            "success": True,
            "message": f"Data summary generated for {len(summary_data)} variables",
            "data": {
                "variables": summary_data,
                "totalRows": len(df),
                "totalColumns": len(df.columns),
                "filename": filename,
                "generatedAt": datetime.now().isoformat()
            }
        }
        
        print(f"\n✅ Final response created successfully")
        print(f"Response keys: {list(response.keys())}")
        print(f"Data keys: {list(response['data'].keys())}")
        
        return response
        
    except Exception as e:
        print(f"❌ Error in test_data_summary: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    result = test_data_summary()
    if result:
        print("\n🎉 Test completed successfully!")
    else:
        print("\n💥 Test failed!")
