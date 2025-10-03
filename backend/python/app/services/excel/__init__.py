"""
========================================
EXCEL SERVICES MODULE - BACKEND
========================================

Purpose: Modular Excel processing services

Description:
This module provides a collection of specialized Excel processing services,
each focused on a specific aspect of Excel operations. This modular approach
improves maintainability, testability, and code organization.

Modules:
- sheet_concatenator: Sheet concatenation and processing
- price_sheet_generator: Price sheet and RPI calculations
- column_modifier: Column modification and enhancement

Usage:
    from app.services.excel import SheetConcatenator, PriceSheetGenerator, ColumnModifier
    
    # Use modular services
    result = SheetConcatenator.concatenate_sheets(filename, sheets)
    price_df = PriceSheetGenerator.create_price_sheet(file_path, sheets)
    mod_result = ColumnModifier.modify_excel_columns(filename, sheets)

Last Updated: 2024-12-23
Author: BrandBloom Backend Team
"""

from .sheet_concatenator import SheetConcatenator
from .price_sheet_generator import PriceSheetGenerator
from .rpi_sheet_generator import RPISheetGenerator
from .column_modifier import ColumnModifier
from .data_quality_enhancer import DataQualityEnhancer
from .brand_extractor import BrandExtractor
from .pack_size_analyzer import PackSizeAnalyzer
from .date_formatter import DateFormatter

__all__ = [
    'SheetConcatenator',
    'PriceSheetGenerator',
    'RPISheetGenerator',
    'ColumnModifier',
    'DataQualityEnhancer',
    'BrandExtractor',
    'PackSizeAnalyzer',
    'DateFormatter'
]
