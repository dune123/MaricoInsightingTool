"""
========================================
RPI ADDITION PACKAGE
========================================

Purpose: Modular package for RPI addition functionality

Description:
This package contains modular components for adding RPI (Relative Price Index) columns
to main concatenated data. The package is organized into focused modules that each
handle specific aspects of the RPI addition process.

Modules:
- rpi_addition_service: Main orchestration service
- pack_size_analyzer: Pack size analysis in main and RPI data
- pack_size_extractor: Pack size extraction from RPI column names
- data_matcher: Data matching logic between sheets
- excel_file_handler: Excel file I/O operations
- rpi_processor: Core RPI processing logic
- pack_size_coverage_analyzer: Coverage analysis and reporting

Key Features:
- Modular architecture for maintainability
- Separation of concerns for each functionality
- Comprehensive pack size analysis and matching
- Flexible user pack size ordering support
- Detailed logging and error handling

Last Updated: 2025-01-27
Author: BrandBloom Backend Team
"""

from .rpi_addition_service import RPIAdditionService
from .pack_size_analyzer import PackSizeAnalyzer
from .pack_size_extractor import PackSizeExtractor
from .data_matcher import DataMatcher
from .excel_file_handler import ExcelFileHandler
from .rpi_processor import RPIProcessor
from .pack_size_coverage_analyzer import PackSizeCoverageAnalyzer

__all__ = [
    'RPIAdditionService',
    'PackSizeAnalyzer',
    'PackSizeExtractor',
    'DataMatcher',
    'ExcelFileHandler',
    'RPIProcessor',
    'PackSizeCoverageAnalyzer'
]

