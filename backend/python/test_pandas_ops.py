#!/usr/bin/env python3
"""
Test pandas operations that might be causing issues
"""

import pandas as pd
import numpy as np

def test_pandas_operations():
    """Test pandas operations used in non-MMM routes"""
    try:
        print("Testing pandas operations...")
        
        # Create a simple test dataframe
        df = pd.DataFrame({
            'numeric_col': [1, 2, 3, 4, 5, np.nan, 7, 8, 9, 10],
            'datetime_col': pd.date_range('2023-01-01', periods=10),
            'character_col': ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']
        })
        
        print(f"Test dataframe shape: {df.shape}")
        print(f"Columns: {df.columns.tolist()}")
        
        # Test each column type
        for col in df.columns:
            print(f"\nTesting column: {col}")
            col_data = df[col]
            
            # Determine data type
            if pd.api.types.is_numeric_dtype(col_data):
                var_type = "numeric"
                print(f"  Type: {var_type}")
                
                # Test numeric operations
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
                    
                    print(f"    mean: {mean_val} (notna: {pd.notna(mean_val)})")
                    print(f"    median: {median_val} (notna: {pd.notna(median_val)})")
                    print(f"    mode: {mode_val.iloc[0] if len(mode_val) > 0 else 'None'}")
                    print(f"    min: {min_val} (notna: {pd.notna(min_val)})")
                    print(f"    max: {max_val} (notna: {pd.notna(max_val)})")
                    print(f"    std: {std_val} (notna: {pd.notna(std_val)})")
                    print(f"    var: {var_val} (notna: {pd.notna(var_val)})")
                    print(f"    skew: {skew_val} (notna: {pd.notna(skew_val)})")
                    print(f"    kurt: {kurt_val} (notna: {pd.notna(kurt_val)})")
                    
                    # Test the exact operations used in the route
                    variable_summary = {
                        "mean": float(mean_val) if pd.notna(mean_val) else None,
                        "median": float(median_val) if pd.notna(median_val) else None,
                        "mode": float(mode_val.iloc[0]) if len(mode_val) > 0 else None,
                        "min": float(min_val) if pd.notna(min_val) else None,
                        "max": float(max_val) if pd.notna(max_val) else None,
                        "stdDev": float(std_val) if pd.notna(std_val) else None,
                        "variance": float(var_val) if pd.notna(var_val) else None,
                        "skewness": float(skew_val) if pd.notna(skew_val) else None,
                        "kurtosis": float(kurt_val) if pd.notna(kurt_val) else None
                    }
                    print(f"    ✅ Summary created successfully: {list(variable_summary.keys())}")
                    
                except Exception as e:
                    print(f"    ❌ Error in numeric operations: {e}")
                    
            elif pd.api.types.is_datetime64_any_dtype(col_data):
                var_type = "datetime"
                print(f"  Type: {var_type}")
                
                # Test datetime operations
                try:
                    min_val = col_data.min()
                    max_val = col_data.max()
                    mode_val = col_data.mode()
                    
                    print(f"    min: {min_val} (notna: {pd.notna(min_val)})")
                    print(f"    max: {max_val} (notna: {pd.notna(max_val)})")
                    print(f"    mode: {mode_val.iloc[0] if len(mode_val) > 0 else 'None'}")
                    
                    # Test the exact operations used in the route
                    variable_summary = {
                        "min": min_val.timestamp() * 1000 if pd.notna(min_val) else None,
                        "max": max_val.timestamp() * 1000 if pd.notna(max_val) else None,
                        "mode": mode_val.iloc[0].strftime('%Y-%m-%d') if len(mode_val) > 0 else None
                    }
                    print(f"    ✅ Summary created successfully: {list(variable_summary.keys())}")
                    
                except Exception as e:
                    print(f"    ❌ Error in datetime operations: {e}")
                    
            else:
                var_type = "character"
                print(f"  Type: {var_type}")
                
                # Test character operations
                try:
                    mode_val = col_data.mode()
                    print(f"    mode: {mode_val.iloc[0] if len(mode_val) > 0 else 'None'}")
                    
                    # Test the exact operations used in the route
                    variable_summary = {
                        "mode": str(mode_val.iloc[0]) if len(mode_val) > 0 else None
                    }
                    print(f"    ✅ Summary created successfully: {list(variable_summary.keys())}")
                    
                except Exception as e:
                    print(f"    ❌ Error in character operations: {e}")
        
        print("\n🎉 All pandas operations tested successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error in test_pandas_operations: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_pandas_operations()
    if success:
        print("\n✅ Pandas operations test passed!")
    else:
        print("\n💥 Pandas operations test failed!")
