"""
PowerPoint Generation API Routes

This module provides API endpoints for generating PowerPoint presentations
from Non-MMM analysis data.
"""

from fastapi import APIRouter, HTTPException, Query, Path as FastAPIPath
from fastapi.responses import FileResponse
from typing import Dict, Any
import json
from pathlib import Path

from app.services.powerpoint_service import PowerPointService
from app.core.config import settings

router = APIRouter(prefix="/api/powerpoint", tags=["PowerPoint Generation"])


@router.post("/generate-nonmmm")
async def generate_nonmmm_powerpoint(
    analysis_id: str,
    brand: str,
    analysis_data: Dict[str, Any]
):
    """
    Generate PowerPoint presentation for Non-MMM analysis
    
    Args:
        analysis_id: Unique analysis identifier
        brand: Brand name for the analysis
        analysis_data: Complete analysis data including charts, models, etc.
        
    Returns:
        FileResponse with the generated PowerPoint file
    """
    try:
        # Validate required parameters
        if not analysis_id or not brand:
            raise HTTPException(
                status_code=400,
                detail="analysis_id and brand are required parameters"
            )
        
        # Generate PowerPoint presentation
        output_path = PowerPointService.generate_analysis_presentation(
            analysis_id=analysis_id,
            brand_name=brand,
            analysis_data=analysis_data
        )
        
        # Return the file for download
        return FileResponse(
            path=str(output_path),
            filename=output_path.name,
            media_type='application/vnd.openxmlformats-officedocument.presentationml.presentation'
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate PowerPoint presentation: {str(e)}"
        )


@router.get("/download/{filename}")
async def download_powerpoint_file(
    filename: str = FastAPIPath(..., description="PowerPoint filename to download"),
    brand: str = Query(..., description="Brand name for file lookup")
):
    """
    Download a previously generated PowerPoint file
    
    Args:
        filename: Name of the PowerPoint file to download
        brand: Brand name for brand-specific file lookup
        
    Returns:
        FileResponse with the requested PowerPoint file
    """
    try:
        # Get brand directories
        brand_dirs = settings.get_brand_directories(brand)
        export_dir = brand_dirs["export_dir"]
        
        # Look for the file in exports directory
        file_path = export_dir / filename
        
        if not file_path.exists():
            raise HTTPException(
                status_code=404,
                detail=f"PowerPoint file '{filename}' not found for brand '{brand}'"
            )
        
        return FileResponse(
            path=str(file_path),
            filename=filename,
            media_type='application/vnd.openxmlformats-officedocument.presentationml.presentation'
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to download PowerPoint file: {str(e)}"
        )


@router.get("/list/{brand}")
async def list_powerpoint_files(
    brand: str = FastAPIPath(..., description="Brand name for file listing")
):
    """
    List all PowerPoint files for a specific brand
    
    Args:
        brand: Brand name for file listing
        
    Returns:
        List of PowerPoint files with metadata
    """
    try:
        # Get brand directories
        brand_dirs = settings.get_brand_directories(brand)
        export_dir = brand_dirs["export_dir"]
        
        if not export_dir.exists():
            return {"files": []}
        
        # Find all PowerPoint files
        pptx_files = []
        for file_path in export_dir.glob("*.pptx"):
            stat = file_path.stat()
            pptx_files.append({
                "filename": file_path.name,
                "size": stat.st_size,
                "created": stat.st_ctime,
                "modified": stat.st_mtime
            })
        
        # Sort by creation time (newest first)
        pptx_files.sort(key=lambda x: x["created"], reverse=True)
        
        return {"files": pptx_files}
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list PowerPoint files: {str(e)}"
        )
