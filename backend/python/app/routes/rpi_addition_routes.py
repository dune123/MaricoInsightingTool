"""
========================================
BRANDBLOOM INSIGHTS - RPI ADDITION ROUTES
========================================

Purpose: API endpoints for Revenue Per Item (RPI) addition functionality and pack size analysis

Description:
This module provides comprehensive API endpoints for the "Add RPIs" step that processes
concatenated data to add relevant RPI columns based on pack size relationships and
business logic. The routes support intelligent RPI analysis, pack size relationship
mapping, and enhanced data file generation for marketing mix modeling workflows.

Key Functions:
- add_rpis_to_data(brand_name, analysis_id, main_sheet_name, rpi_sheet_name): Main RPI addition endpoint
  - Processes concatenated files for RPI column addition
  - Implements intelligent pack size relationship mapping
  - Adds RPI values based on size adjacency and matching criteria
  - Returns enhanced file with comprehensive RPI data
- analyze_pack_sizes_for_rpi(brand_name, analysis_id, main_sheet_name, rpi_sheet_name): Pack size analysis endpoint
  - Analyzes pack sizes in main data and RPI data
  - Provides insights about RPI column coverage and potential additions
  - Supports RPI addition planning and strategy development
  - Returns comprehensive pack size analysis and coverage metrics
- download_enhanced_file(brand_name, analysis_id): Enhanced file download endpoint
  - Downloads the enhanced Excel file with added RPI columns
  - Provides access to processed data after RPI addition
  - Supports data sharing and analysis workflows
  - Returns downloadable enhanced Excel file
- preview_rpi_columns(brand_name, analysis_id, main_sheet_name, rpi_sheet_name): RPI preview endpoint
  - Previews RPI columns that would be added without processing
  - Shows potential RPI additions based on pack size relationships
  - Supports decision-making before actual processing
  - Returns preview of RPI columns and coverage analysis
- save_pack_size_order(brand_name, analysis_id, pack_size_order): Pack size ordering endpoint
  - Saves user's pack size ordering preferences
  - Stores drag-and-drop ordering for RPI adjacency calculations
  - Enables custom pack size relationship mapping
  - Returns confirmation of saved ordering

Business Logic for RPI Addition:
- For each row in main data: check month, packsize, region, channel
- From RPI sheet: find columns with pack sizes:
  * Same size as current row's packsize (rank N)
  * 1 size smaller (rank N-1) - adjacent smaller
  * 1 size larger (rank N+1) - adjacent larger
- Add those RPI values to main sheet for matching criteria
- Maintain data integrity and relationship consistency

Pack Size Relationship Mapping:
- Intelligent pack size recognition and categorization
- Adjacent size relationship determination
- User-defined pack size ordering support
- Coverage analysis and optimization
- RPI relevance scoring and prioritization

API Endpoints:
- POST /api/rpi/add-rpis: Add RPI columns to main data
  - Accepts: brand_name, analysis_id, main_sheet_name, rpi_sheet_name (Form data)
  - Returns: RPIAdditionResponse with processing results
  - Purpose: Main RPI addition processing and file enhancement
- POST /api/rpi/analyze-pack-sizes: Analyze pack sizes for RPI planning
  - Accepts: brand_name, analysis_id, main_sheet_name, rpi_sheet_name (Form data)
  - Returns: Dict with pack size analysis and coverage metrics
  - Purpose: RPI addition planning and strategy development
- GET /api/rpi/download-enhanced/{brand_name}/{analysis_id}: Download enhanced file
  - Accepts: brand_name, analysis_id (path parameters)
  - Returns: FileResponse with enhanced Excel file
  - Purpose: Access to processed data after RPI addition
- GET /api/rpi/preview-rpi-columns/{brand_name}/{analysis_id}: Preview RPI additions
  - Accepts: brand_name, analysis_id (path parameters), sheet names (query parameters)
  - Returns: Dict with RPI columns preview and coverage analysis
  - Purpose: Decision support before RPI processing
- POST /api/rpi/save-pack-size-order: Save pack size ordering
  - Accepts: brand_name, analysis_id, pack_size_order (Form data)
  - Returns: Dict with save confirmation and ordering details
  - Purpose: User preference storage for pack size relationships

RPI Processing Features:
- Intelligent pack size relationship detection
- Adjacent size RPI mapping and addition
- Data matching based on multiple criteria
- Enhanced file generation with RPI columns
- Coverage analysis and optimization
- User-defined pack size ordering support

Data Enhancement Capabilities:
- Automatic RPI column addition
- Pack size relationship mapping
- Data integrity preservation
- Enhanced file generation
- Download and sharing support
- Processing status tracking

File Management Features:
- Brand-specific directory structure support
- Flexible file naming and location detection
- Enhanced file generation and storage
- Download and access management
- File versioning and tracking

Error Handling:
- Comprehensive HTTP status code usage
- Detailed error messages for debugging
- File not found handling and validation
- Processing error recovery and reporting
- Input validation and sanitization
- Graceful error handling and logging

Dependencies:
- FastAPI: For routing, request handling, and HTTP responses
- RPIAdditionService: For RPI processing and business logic
- app.models.data_models: For request/response models
- app.core.config: For brand-specific directory configuration
- ExcelFileHandler: For Excel file operations
- PackSizeAnalyzer: For pack size analysis and relationships
- DataMatcher: For RPI relevance determination

Used by:
- RPI addition workflows: For revenue per item analysis
- Pack size analysis: For size relationship mapping
- Data enhancement: For RPI column addition
- File processing: For enhanced data generation
- Analysis workflows: For marketing mix modeling
- Data sharing: For enhanced file distribution

RPI Addition Benefits:
- Automated RPI column addition based on business logic
- Intelligent pack size relationship mapping
- Enhanced data for marketing mix modeling
- Comprehensive coverage analysis and optimization
- User-defined pack size ordering support
- Scalable brand-specific processing

Processing Flow:
1. File location and validation
2. Pack size analysis and relationship mapping
3. RPI relevance determination and scoring
4. Column addition and data enhancement
5. Enhanced file generation and storage
6. Result reporting and status confirmation

Business Intelligence Features:
- Revenue per item analysis and optimization
- Pack size relationship intelligence
- Coverage analysis and gap identification
- RPI strategy development and planning
- Data enhancement and quality improvement
- Marketing mix modeling support

File Enhancement Process:
1. Load concatenated data with main and RPI sheets
2. Analyze pack sizes and relationships
3. Determine RPI column relevance and priority
4. Add RPI columns based on business logic
5. Generate enhanced file with RPI data
6. Provide download and access capabilities

Last Updated: 2025-01-27
Author: BrandBloom Backend Team
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional
from pathlib import Path
from datetime import datetime

from app.services.rpi_addition_service import RPIAdditionService
from app.models.data_models import RPIAdditionRequest, RPIAdditionResponse
from app.core.config import settings

router = APIRouter(prefix="/api/rpi", tags=["RPI Addition"])


@router.post("/add-rpis", response_model=RPIAdditionResponse)
async def add_rpis_to_data(
    brand_name: str = Form(...),
    analysis_id: str = Form(...),
    main_sheet_name: str = Form("Concatenated_Data_Enhanced"),
    rpi_sheet_name: str = Form("RPI")
):
    """
    Add relevant RPI columns to main concatenated data based on pack size logic.
    
    This endpoint processes the concatenated file for a specific brand analysis
    and adds RPI columns from the RPI sheet to the main data sheet based on
    pack size relationships and data matching criteria.
    
    Args:
        brand_name: Name of the brand for analysis
        analysis_id: Analysis ID for file location
        main_sheet_name: Name of main data sheet (default: "Concatenated_Data_Enhanced")
        rpi_sheet_name: Name of RPI data sheet (default: "RPI")
        
    Returns:
        RPIAdditionResponse with processing results and enhanced file info
        
    Business Logic:
        - For each row in main data, check: month, packsize, region, channel
        - From RPI sheet, find columns with pack sizes:
          * Same size as current row's packsize (rank N)
          * 1 size smaller (rank N-1)
          * 1 size larger (rank N+1)
        - Add those RPI values to main sheet for matching rows
        
    Example:
        POST /api/rpi/add-rpis
        Form data:
        - brand_name: "X-Men"
        - analysis_id: "x-men-analysis"
        - main_sheet_name: "Concatenated_Data_Enhanced"
        - rpi_sheet_name: "RPI"
    """
    try:
        print(f"🔄 Starting RPI addition for brand: {brand_name}, analysis: {analysis_id}")
        
        # Construct file path using brand-based directory structure
        brand_directories = settings.get_brand_directories(brand_name)
        
        # Find concatenated file with RPI data
        concatenated_file = None
        possible_files = [
            brand_directories["concat_dir"] / f"{analysis_id}_concatenated.xlsx",
            brand_directories["concat_dir"] / f"{brand_name}_concatenated.xlsx", 
            brand_directories["data_dir"] / f"{analysis_id}_concatenated.xlsx",
            brand_directories["data_dir"] / f"{brand_name}_concatenated.xlsx"
        ]
        
        for file_path in possible_files:
            if file_path.exists():
                concatenated_file = file_path
                break
        
        # If no exact match found, search for files containing the analysis_id or brand_name
        if not concatenated_file:
            # Search in concatenated directory
            concat_dir = brand_directories["concat_dir"]
            if concat_dir.exists():
                for file_path in concat_dir.glob("*_concatenated.xlsx"):
                    # Check if filename contains analysis_id or brand_name
                    filename = file_path.stem.lower()
                    if (analysis_id.lower() in filename or 
                        brand_name.lower().replace("-", " ").replace("_", " ") in filename.replace("-", " ").replace("_", " ")):
                        concatenated_file = file_path
                        break
        
        if not concatenated_file:
            raise HTTPException(
                status_code=404, 
                detail=f"Concatenated file not found for brand '{brand_name}' and analysis '{analysis_id}'"
            )
        
        print(f"📁 Found concatenated file: {concatenated_file}")
        
        # Process RPI addition
        result = RPIAdditionService.add_rpis_to_main_data(
            file_path=concatenated_file,
            main_sheet_name=main_sheet_name,
            rpi_sheet_name=rpi_sheet_name,
            brand_name=brand_name,
            analysis_id=analysis_id
        )
        
        if not result.success:
            raise HTTPException(status_code=500, detail=result.message)
        
        print(f"✅ RPI addition completed successfully")
        print(f"   📊 Rows processed: {result.main_rows_processed}")
        print(f"   📈 RPI columns added: {result.rpi_columns_added}")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in RPI addition endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Error adding RPIs: {str(e)}")


@router.post("/analyze-pack-sizes", response_model=dict)
async def analyze_pack_sizes_for_rpi(
    brand_name: str = Form(...),
    analysis_id: str = Form(...),
    main_sheet_name: str = Form("Concatenated_Data_Enhanced"),
    rpi_sheet_name: str = Form("RPI")
):
    """
    Analyze pack sizes in concatenated data for RPI addition planning.
    
    This endpoint analyzes the pack sizes present in both the main data and RPI data
    to provide insights about what RPI columns can be added and potential coverage.
    
    Args:
        brand_name: Name of the brand for analysis
        analysis_id: Analysis ID for file location
        main_sheet_name: Name of main data sheet
        rpi_sheet_name: Name of RPI data sheet
        
    Returns:
        Dictionary with pack size analysis results
        
    Example:
        POST /api/rpi/analyze-pack-sizes
        Form data:
        - brand_name: "X-Men"
        - analysis_id: "x-men-analysis"
    """
    try:
        print(f"🔍 Analyzing pack sizes for RPI addition: {brand_name}, {analysis_id}")
        
        # Find concatenated file
        brand_directories = settings.get_brand_directories(brand_name)
        
        concatenated_file = None
        possible_files = [
            brand_directories["concat_dir"] / f"{analysis_id}_concatenated.xlsx",
            brand_directories["concat_dir"] / f"{brand_name}_concatenated.xlsx", 
            brand_directories["data_dir"] / f"{analysis_id}_concatenated.xlsx",
            brand_directories["data_dir"] / f"{brand_name}_concatenated.xlsx"
        ]
        
        for file_path in possible_files:
            if file_path.exists():
                concatenated_file = file_path
                break
        
        # If no exact match found, search for files containing the analysis_id or brand_name
        if not concatenated_file:
            # Search in concatenated directory
            concat_dir = brand_directories["concat_dir"]
            if concat_dir.exists():
                for file_path in concat_dir.glob("*_concatenated.xlsx"):
                    # Check if filename contains analysis_id or brand_name
                    filename = file_path.stem.lower()
                    if (analysis_id.lower() in filename or 
                        brand_name.lower().replace("-", " ").replace("_", " ") in filename.replace("-", " ").replace("_", " ")):
                        concatenated_file = file_path
                        break
        
        if not concatenated_file:
            raise HTTPException(
                status_code=404, 
                detail=f"Concatenated file not found for brand '{brand_name}'"
            )
        
        # Read and analyze pack sizes
        from app.services.rpi_addition.excel_file_handler import ExcelFileHandler
        main_df, rpi_df = ExcelFileHandler.read_concatenated_file(
            concatenated_file, main_sheet_name, rpi_sheet_name
        )
        
        if main_df.empty or rpi_df.empty:
            raise HTTPException(
                status_code=400, 
                detail="Could not read main data or RPI data from file"
            )
        
        # Analyze pack sizes
        from app.services.rpi_addition.pack_size_analyzer import PackSizeAnalyzer
        pack_size_analysis = PackSizeAnalyzer.analyze_pack_sizes(main_df, rpi_df, brand_name, analysis_id)
        
        # Add coverage analysis using user ordering (if available)
        from app.services.rpi_addition_service import analyze_pack_size_coverage
        coverage = analyze_pack_size_coverage(
            pack_size_analysis.get('main_pack_sizes', []),
            pack_size_analysis.get('rpi_columns_info', []),
            pack_size_analysis.get('user_pack_size_order', None)
        )
        
        return {
            "success": True,
            "message": "Pack size analysis completed",
            "file_path": str(concatenated_file),
            "pack_size_analysis": pack_size_analysis,
            "coverage_analysis": coverage
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"❌ Error in pack size analysis: {e}")
        print(f"❌ Full traceback: {error_details}")
        raise HTTPException(status_code=500, detail=f"Error analyzing pack sizes: {str(e)}. Check server logs for details.")


@router.get("/download-enhanced/{brand_name}/{analysis_id}")
async def download_enhanced_file(
    brand_name: str,
    analysis_id: str
):
    """
    Download the enhanced file with RPI columns added.
    
    This endpoint allows downloading the enhanced Excel file that contains
    the main data with added RPI columns after the RPI addition process.
    
    Args:
        brand_name: Name of the brand for analysis
        analysis_id: Analysis ID for file location
        
    Returns:
        FileResponse with the enhanced Excel file
    """
    try:
        from fastapi.responses import FileResponse
        
        print(f"📥 Preparing download for: {brand_name}, {analysis_id}")
        
        # Find enhanced file (created by RPI addition process with "_with_rpis" suffix)
        brand_directories = settings.get_brand_directories(brand_name)
        
        # Search only in concatenated directory where files are actually saved
        enhanced_file = None
        concat_dir = brand_directories["concat_dir"]
        
        if concat_dir.exists():
            # Look for any file ending with "_with_rpis.xlsx" in the concat directory
            for file_path in concat_dir.glob("*_with_rpis.xlsx"):
                # Check if filename contains analysis_id or brand_name (flexible matching)
                filename = file_path.stem.lower()
                if (analysis_id.lower() in filename or 
                    brand_name.lower().replace("-", " ").replace("_", " ") in filename.replace("-", " ").replace("_", " ")):
                    enhanced_file = file_path
                    break
        
        if not enhanced_file:
            raise HTTPException(
                status_code=404, 
                detail=f"Enhanced file not found for brand '{brand_name}' and analysis '{analysis_id}'. Please complete the RPI addition process first."
            )
        
        print(f"📁 Found enhanced file: {enhanced_file}")
        
        # Return file for download using the actual saved filename pattern
        actual_filename = enhanced_file.name  # Use the actual file name
        return FileResponse(
            path=str(enhanced_file),
            filename=actual_filename,  # Keep the same name pattern as saved: <original>_with_rpis.xlsx
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error downloading enhanced file: {e}")
        raise HTTPException(status_code=500, detail=f"Error downloading file: {str(e)}")


@router.get("/preview-rpi-columns/{brand_name}/{analysis_id}")
async def preview_rpi_columns(
    brand_name: str,
    analysis_id: str,
            main_sheet_name: str = "Concatenated_Data_Enhanced",
    rpi_sheet_name: str = "RPI"
):
    """
    Preview what RPI columns would be added without actually processing.
    
    This endpoint provides a preview of what RPI columns would be added to the main data
    based on pack size relationships, without actually modifying any files.
    
    Args:
        brand_name: Name of the brand for analysis
        analysis_id: Analysis ID for file location
        main_sheet_name: Name of main data sheet
        rpi_sheet_name: Name of RPI data sheet
        
    Returns:
        Dictionary with preview of RPI columns to be added
    """
    try:
        print(f"👀 Previewing RPI columns for: {brand_name}, {analysis_id}")
        
        # Find concatenated file
        brand_directories = settings.get_brand_directories(brand_name)
        
        concatenated_file = None
        possible_files = [
            brand_directories["concat_dir"] / f"{analysis_id}_concatenated.xlsx",
            brand_directories["concat_dir"] / f"{brand_name}_concatenated.xlsx", 
            brand_directories["data_dir"] / f"{analysis_id}_concatenated.xlsx",
            brand_directories["data_dir"] / f"{brand_name}_concatenated.xlsx"
        ]
        
        for file_path in possible_files:
            if file_path.exists():
                concatenated_file = file_path
                break
        
        # If no exact match found, search for files containing the analysis_id or brand_name
        if not concatenated_file:
            # Search in concatenated directory
            concat_dir = brand_directories["concat_dir"]
            if concat_dir.exists():
                for file_path in concat_dir.glob("*_concatenated.xlsx"):
                    # Check if filename contains analysis_id or brand_name
                    filename = file_path.stem.lower()
                    if (analysis_id.lower() in filename or 
                        brand_name.lower().replace("-", " ").replace("_", " ") in filename.replace("-", " ").replace("_", " ")):
                        concatenated_file = file_path
                        break
        
        if not concatenated_file:
            raise HTTPException(
                status_code=404, 
                detail=f"Concatenated file not found for brand '{brand_name}'"
            )
        
        # Analyze what would be added  
        from app.services.rpi_addition.excel_file_handler import ExcelFileHandler
        main_df, rpi_df = ExcelFileHandler.read_concatenated_file(
            concatenated_file, main_sheet_name, rpi_sheet_name
        )
        
        from app.services.rpi_addition.pack_size_analyzer import PackSizeAnalyzer
        pack_size_analysis = PackSizeAnalyzer.analyze_pack_sizes(main_df, rpi_df, brand_name, analysis_id)
        
        # Generate preview of columns that would be added
        rpi_columns_info = pack_size_analysis.get('rpi_columns_info', [])
        main_pack_sizes = pack_size_analysis.get('main_pack_sizes', [])
        user_pack_size_order = pack_size_analysis.get('user_pack_size_order', None)
        
        preview_columns = []
        
        # Use the SAME corrected logic as actual RPI processing
        from app.services.rpi_addition.data_matcher import DataMatcher
        
        for rpi_info in rpi_columns_info:
            rpi_column_name = rpi_info['column_name']
            
            # Check which main pack sizes this RPI column is relevant for
            for main_size in main_pack_sizes:
                # Use the NEW corrected business logic: 
                # 1) Our side must match main size, 2) Competitor side must be same/adjacent
                is_relevant = DataMatcher.is_rpi_column_relevant_for_main_row(
                    main_size, rpi_column_name, user_pack_size_order
                )
                
                if is_relevant:
                    # Use original RPI column name without any prefix (consistent with actual processing)
                    new_col_name = rpi_column_name
                    preview_columns.append({
                        'new_column_name': new_col_name,
                        'original_rpi_column': rpi_column_name,
                        'pack_size': rpi_info['pack_size'],
                        'pack_size_rank': rpi_info['rank'],
                        'relevant_for_main_size': main_size
                    })
                    break  # Avoid duplicates - one RPI column can only be relevant for one main size
        
        return {
            "success": True,
            "message": "Main pack sizes detected - user ordering needed for RPI preview" if not user_pack_size_order else "RPI columns preview generated",
            "file_path": str(concatenated_file),
            "main_sheet_rows": len(main_df),
            "rpi_sheet_rows": len(rpi_df),
            "main_pack_sizes": main_pack_sizes,  # Only main pack sizes for user ordering
            "available_rpi_columns": len(rpi_columns_info),
            "preview_columns": preview_columns,
            "estimated_columns_to_add": len(preview_columns),
            "needs_user_ordering": user_pack_size_order is None,
            "user_pack_size_order": user_pack_size_order
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in RPI columns preview: {e}")
        raise HTTPException(status_code=500, detail=f"Error previewing RPI columns: {str(e)}")


@router.post("/save-pack-size-order")
async def save_pack_size_order(
    brand_name: str = Form(...),
    analysis_id: str = Form(...),
    pack_size_order: str = Form(...)  # JSON string of ordered pack sizes
):
    """
    Save user's pack size ordering preference.
    
    This endpoint stores the user's drag-and-drop ordering of pack sizes
    which will be used for RPI adjacency calculations.
    
    Args:
        brand_name: Name of the brand for analysis
        analysis_id: Analysis ID for this specific analysis
        pack_size_order: JSON string containing ordered list of pack sizes
        
    Returns:
        Success confirmation
        
    Example:
        POST /api/rpi/save-pack-size-order
        Form data:
        - brand_name: "X-Men"
        - analysis_id: "x-men-analysis"
        - pack_size_order: '["Sachet", "150-250ML", "251-500ML", "501-650ML", ">650ML"]'
    """
    try:
        import json
        
        print(f"💾 Saving pack size order for: {brand_name}, {analysis_id}")
        
        # Parse the pack size order
        try:
            pack_sizes = json.loads(pack_size_order)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid pack_size_order JSON format")
        
        # Get brand directories for storing the ordering
        brand_directories = settings.get_brand_directories(brand_name)
        
        # Create pack size ordering file
        ordering_file = brand_directories["metadata_dir"] / f"{analysis_id}_pack_size_order.json"
        
        # Ensure metadata directory exists
        brand_directories["metadata_dir"].mkdir(parents=True, exist_ok=True)
        
        # Save the ordering
        ordering_data = {
            "brand_name": brand_name,
            "analysis_id": analysis_id,
            "pack_size_order": pack_sizes,
            "timestamp": datetime.now().isoformat(),
            "order_positions": {size: idx for idx, size in enumerate(pack_sizes)}
        }
        
        with open(ordering_file, 'w') as f:
            json.dump(ordering_data, f, indent=2)
        
        print(f"✅ Pack size order saved: {ordering_file}")
        print(f"   📋 Order: {pack_sizes}")
        
        return {
            "success": True,
            "message": f"Pack size order saved successfully for {brand_name}",
            "pack_size_order": pack_sizes,
            "order_file": str(ordering_file)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error saving pack size order: {e}")
        raise HTTPException(status_code=500, detail=f"Error saving pack size order: {str(e)}")
