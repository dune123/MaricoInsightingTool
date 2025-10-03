"""
========================================
RPI ADDITION SERVICE - BACKWARD COMPATIBILITY WRAPPER
========================================

Purpose: Backward compatibility wrapper for the modularized RPI addition service

Description:
This file provides backward compatibility for existing imports while delegating
all functionality to the new modular RPI addition package. It maintains the same
public API while using the improved modular architecture underneath.

The actual implementation has been moved to the `rpi_addition` package which
contains focused modules for better maintainability and separation of concerns.

Key Changes:
- Main functionality moved to `app.services.rpi_addition` package
- Modular architecture with specialized modules
- Improved error handling and logging
- Enhanced pack size analysis capabilities
- Better file operations and data processing

Migration Path:
- Existing imports continue to work unchanged
- New code should import from `app.services.rpi_addition` package directly
- This file serves as a transition wrapper

Last Updated: 2025-01-27
Author: BrandBloom Backend Team
"""

from pathlib import Path
from typing import Optional

from app.models.data_models import RPIAdditionResponse
from .rpi_addition import RPIAdditionService as ModularRPIAdditionService
from .rpi_addition import PackSizeCoverageAnalyzer


class RPIAdditionService:
    """
    Backward compatibility wrapper for the modularized RPI addition service
    
    This class provides the same public API as before but delegates to the
    new modular implementation for improved maintainability.
    """
    
    @staticmethod
    def add_rpis_to_main_data(
        file_path: Path,
        main_sheet_name: str = "Concatenated_Data_Enhanced",
        rpi_sheet_name: str = "RPI",
        brand_name: Optional[str] = None,
        analysis_id: Optional[str] = None
    ) -> RPIAdditionResponse:
        """
        Add relevant RPI columns to main concatenated data
        
        This method delegates to the new modular implementation while maintaining
        the same API for backward compatibility.
        
        Args:
            file_path: Path to concatenated Excel file
            main_sheet_name: Name of main data sheet
            rpi_sheet_name: Name of RPI data sheet
            brand_name: Name of the brand for loading saved pack size ordering
            analysis_id: Analysis ID for loading saved pack size ordering
            
        Returns:
            RPIAdditionResponse with processing results
        """
        return ModularRPIAdditionService.add_rpis_to_main_data(
            file_path=file_path,
            main_sheet_name=main_sheet_name,
            rpi_sheet_name=rpi_sheet_name,
            brand_name=brand_name,
            analysis_id=analysis_id
        )


# Utility functions for pack size analysis - delegated to new modules
def get_relevant_rpi_columns(main_pack_size, rpi_columns_info, user_pack_size_order=None):
    """Get RPI columns that are relevant for given main pack size using user's ordering"""
    return PackSizeCoverageAnalyzer.get_relevant_rpi_columns(
        main_pack_size, rpi_columns_info, user_pack_size_order
    )


def analyze_pack_size_coverage(main_pack_sizes, rpi_columns_info, user_pack_size_order=None):
    """Analyze how well RPI columns cover the main pack sizes using user's ordering"""
    return PackSizeCoverageAnalyzer.analyze_pack_size_coverage(
        main_pack_sizes, rpi_columns_info, user_pack_size_order
    )

