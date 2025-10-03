"""
========================================
RPI ADDITION SERVICE - MAIN ORCHESTRATOR
========================================

Purpose: Main orchestration service for adding RPI columns to concatenated data

Description:
This is the primary service that orchestrates the RPI addition process. It coordinates
between all the specialized modules to provide a complete RPI addition workflow.
The service handles the high-level flow while delegating specific tasks to focused modules.

Key Functionality:
- Orchestrate complete RPI addition workflow
- Coordinate between specialized modules
- Handle errors and provide comprehensive responses
- Manage file operations and result tracking
- Provide main API interface for RPI addition

Business Logic:
- Read concatenated file with main data and RPI sheets
- Analyze pack size structure using PackSizeAnalyzer
- Process RPI addition using RPIProcessor
- Save enhanced results using ExcelFileHandler
- Return comprehensive response with statistics

Architecture:
This service follows the orchestrator pattern, coordinating between:
- ExcelFileHandler: File I/O operations
- PackSizeAnalyzer: Pack size structure analysis
- RPIProcessor: Core RPI processing logic
- DataMatcher: Row matching logic (used by RPIProcessor)
- PackSizeExtractor: Pack size extraction (used by PackSizeAnalyzer)

Last Updated: 2025-01-27
Author: BrandBloom Backend Team
"""

from pathlib import Path
from typing import Optional

from app.models.data_models import RPIAdditionResponse
from .pack_size_analyzer import PackSizeAnalyzer
from .excel_file_handler import ExcelFileHandler
from .rpi_processor import RPIProcessor


class RPIAdditionService:
    """Main orchestration service for adding RPI columns to main concatenated data"""
    
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
        
        This is the main entry point for the RPI addition process. It orchestrates
        the entire workflow from file reading to enhanced file saving.
        
        Args:
            file_path: Path to concatenated Excel file
            main_sheet_name: Name of main data sheet
            rpi_sheet_name: Name of RPI data sheet
            brand_name: Name of the brand for loading saved pack size ordering
            analysis_id: Analysis ID for loading saved pack size ordering
            
        Returns:
            RPIAdditionResponse with processing results and statistics
        """
        try:
            print(f"🔄 Starting RPI addition process for: {file_path}")
            
            # Step 1: Read both sheets from the concatenated file
            main_df, rpi_df = ExcelFileHandler.read_concatenated_file(
                file_path, main_sheet_name, rpi_sheet_name
            )
            
            # Validate that we successfully read the data
            if main_df.empty or rpi_df.empty:
                return RPIAdditionService._create_error_response(
                    "Failed to read main data or RPI data sheets",
                    main_rows=0,
                    rpi_columns=0
                )
            
            # Step 2: Analyze pack sizes in both sheets
            pack_size_analysis = PackSizeAnalyzer.analyze_pack_sizes(
                main_df, rpi_df, brand_name, analysis_id
            )
            
            # Validate pack size analysis results
            if not pack_size_analysis.get("main_packsize_column"):
                return RPIAdditionService._create_error_response(
                    "Could not find pack size column in main data",
                    main_rows=len(main_df),
                    rpi_columns=0
                )
            
            # Step 3: Process RPI addition using the analyzed pack size structure
            enhanced_df, rpi_columns_added = RPIProcessor.process_rpi_addition(
                main_df, rpi_df, pack_size_analysis
            )
            
            # Step 4: Save enhanced file with RPI columns added
            enhanced_file_path = ExcelFileHandler.save_enhanced_file(
                enhanced_df, rpi_df, file_path, main_sheet_name, rpi_sheet_name
            )
            
            # Step 5: Calculate processing statistics
            processing_stats = RPIProcessor.calculate_processing_stats(
                main_df, enhanced_df, rpi_columns_added
            )
            
            # Log success summary
            RPIAdditionService._log_success_summary(enhanced_file_path, processing_stats)
            
            # Step 6: Create comprehensive success response
            return RPIAdditionResponse(
                success=True,
                message="RPI columns added successfully",
                main_rows_processed=processing_stats['total_rows_processed'],
                rpi_columns_added=processing_stats['rpi_columns_added'],
                rpi_columns_info=rpi_columns_added,
                enhanced_file_path=str(enhanced_file_path),
                pack_size_analysis=pack_size_analysis,
                processing_statistics=processing_stats
            )
            
        except Exception as e:
            print(f"❌ Error in RPI addition process: {e}")
            return RPIAdditionService._create_error_response(
                f"Error adding RPI columns: {str(e)}",
                main_rows=0,
                rpi_columns=0
            )
    
    @staticmethod
    def _create_error_response(
        error_message: str,
        main_rows: int,
        rpi_columns: int
    ) -> RPIAdditionResponse:
        """
        Create standardized error response
        
        Args:
            error_message: Error message to include
            main_rows: Number of main data rows processed
            rpi_columns: Number of RPI columns processed
            
        Returns:
            RPIAdditionResponse with error details
        """
        return RPIAdditionResponse(
            success=False,
            message=error_message,
            main_rows_processed=main_rows,
            rpi_columns_added=rpi_columns,
            enhanced_file_path=""
        )
    
    @staticmethod
    def _log_success_summary(enhanced_file_path: Path, processing_stats: dict) -> None:
        """
        Log comprehensive success summary
        
        Args:
            enhanced_file_path: Path to enhanced file
            processing_stats: Processing statistics
        """
        print(f"✅ RPI addition completed successfully")
        print(f"   📊 Rows processed: {processing_stats['total_rows_processed']}")
        print(f"   📈 RPI columns added: {processing_stats['rpi_columns_added']}")
        print(f"   🎯 Total RPI matches: {processing_stats['total_rpi_matches']}")
        print(f"   📋 Original columns: {processing_stats['original_columns']}")
        print(f"   📋 Enhanced columns: {processing_stats['enhanced_columns']}")
        print(f"   💾 Enhanced file: {enhanced_file_path}")
        
        if processing_stats['columns_with_matches']:
            print(f"   📝 Added columns: {', '.join(processing_stats['columns_with_matches'][:3])}")
            if len(processing_stats['columns_with_matches']) > 3:
                print(f"       ... and {len(processing_stats['columns_with_matches']) - 3} more")
    
    @staticmethod
    def validate_inputs(
        file_path: Path,
        main_sheet_name: str,
        rpi_sheet_name: str
    ) -> dict:
        """
        Validate inputs before processing
        
        Args:
            file_path: Path to Excel file
            main_sheet_name: Main sheet name
            rpi_sheet_name: RPI sheet name
            
        Returns:
            Dict with validation results
        """
        validation = {
            'is_valid': True,
            'errors': [],
            'warnings': []
        }
        
        # Check file existence
        if not ExcelFileHandler.validate_file_exists(file_path):
            validation['errors'].append(f"File does not exist: {file_path}")
            validation['is_valid'] = False
            return validation  # No point checking further if file doesn't exist
        
        # Check sheet information
        sheet_info = ExcelFileHandler.get_sheet_info(file_path)
        
        if 'error' in sheet_info:
            validation['errors'].append(f"Cannot read file: {sheet_info['error']}")
            validation['is_valid'] = False
            return validation
        
        # Check for required sheets
        if not sheet_info['has_main_sheet']:
            validation['warnings'].append("No obvious main data sheet found")
        
        if not sheet_info['has_rpi_sheet']:
            validation['warnings'].append("No obvious RPI sheet found")
        
        # Check sheet names
        if main_sheet_name not in sheet_info['sheet_names']:
            validation['warnings'].append(f"Specified main sheet '{main_sheet_name}' not found")
        
        if rpi_sheet_name not in sheet_info['sheet_names']:
            validation['warnings'].append(f"Specified RPI sheet '{rpi_sheet_name}' not found")
        
        return validation

