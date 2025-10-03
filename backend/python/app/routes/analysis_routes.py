"""
========================================
BRANDBLOOM INSIGHTS - ANALYSIS ROUTES
========================================

Purpose: API routes for brand-based analysis management and workflow orchestration

Description:
This module provides REST API endpoints for the new brand-based analysis system.
It replaces hardcoded filename-based state management with proper brand organization
and supports a complete 13-step analytics workflow from data upload to model completion.
The routes enable brand isolation, workflow state management, and comprehensive
analysis lifecycle management.

Key Functions:
- check_brand_exists(brand_name): Brand existence verification endpoint
  - Checks if a brand analysis already exists
  - Prevents duplicate brand creation
  - Returns brand existence status and analysis details
  - Supports brand name validation and conflict detection
- create_analysis(request): New analysis creation endpoint
  - Creates new brand analysis workspace
  - Supports MMM, Fresh Analysis, and NON_MMM types
  - Implements force overwrite capability for existing brands
  - Returns complete analysis metadata and initial state
- list_analyses(): Analysis enumeration endpoint
  - Lists all existing brand analyses
  - Sorts analyses by last modified timestamp
  - Provides analysis summaries for management
  - Supports analysis overview and discovery
- get_analysis(analysis_id): Analysis retrieval endpoint
  - Retrieves complete analysis by ID
  - Returns full analysis metadata and state
  - Supports workflow resumption and state inspection
  - Handles URL-safe analysis identifiers
- update_analysis(analysis_id, updates): Analysis modification endpoint
  - Updates analysis metadata and state
  - Supports partial updates and field modifications
  - Maintains analysis integrity and consistency
  - Returns updated analysis information
- delete_analysis(analysis_id): Analysis cleanup endpoint
  - Deletes analysis and all associated data
  - Removes brand workspace and files
  - Cleans up storage and maintains system efficiency
  - Returns deletion confirmation and results

Analysis Workflow Steps (1-13):
1. Brand Analysis Creation
2. Data File Upload
3. Multi-Sheet Concatenation
4. Target Variable Selection
5. Data Filtering and Cleaning
6. Brand Categorization
7. Variable Expected Signs
8. Model Building
9. Model Validation
10. Results Generation
11. Optimization Analysis
12. Report Generation
13. Analysis Completion

API Endpoints:
- GET /api/analyses/check-brand/{brand_name}: Check brand existence
  - Accepts: brand_name (path)
  - Returns: Dict with brand existence status and details
  - Purpose: Brand conflict detection and validation
- POST /api/analyses: Create new analysis
  - Accepts: CreateAnalysisRequest with brand name and type
  - Returns: AnalysisResponse with creation results
  - Purpose: New brand analysis workspace creation
- GET /api/analyses: List all analyses
  - Accepts: No parameters
  - Returns: AnalysisListResponse with analysis summaries
  - Purpose: Analysis overview and management
- GET /api/analyses/{analysis_id}: Get specific analysis
  - Accepts: analysis_id (path, URL-safe identifier)
  - Returns: AnalysisResponse with complete analysis data
  - Purpose: Analysis retrieval and workflow resumption
- PUT /api/analyses/{analysis_id}: Update analysis
  - Accepts: analysis_id (path), UpdateAnalysisRequest
  - Returns: AnalysisResponse with updated analysis data
  - Purpose: Analysis modification and state updates
- DELETE /api/analyses/{analysis_id}: Delete analysis
  - Accepts: analysis_id (path)
  - Returns: Dict with deletion confirmation
  - Purpose: Analysis cleanup and resource management

Brand Management Features:
- Brand isolation and data separation
- Unique brand identifier generation
- Brand name conflict detection and resolution
- Force overwrite capability for existing brands
- Brand-specific directory structure creation
- Complete brand workspace management

Workflow State Management:
- 13-step workflow progression tracking
- Current step identification and navigation
- Progress completion status tracking
- Workflow state persistence and resumption
- Session continuity across page navigation
- Multi-step workflow orchestration

Analysis Types Supported:
- MMM (Marketing Mix Modeling): Advanced marketing analytics
- Fresh Analysis: New analysis workflows and methodologies
- NON_MMM: Custom statistical analysis with advanced modeling and charting capabilities
- Extensible framework for additional analysis types
- Type-specific workflow customization
- Analysis type validation and enforcement

Data Organization Benefits:
- Brand-specific data isolation
- Scalable multi-brand architecture
- Cleaner data organization and management
- Easier backup and restore per brand
- Better security and access control
- Improved data governance

Error Handling:
- Comprehensive HTTP status code usage
- Detailed error messages for debugging
- Brand conflict detection and resolution
- Analysis not found handling
- Validation error reporting
- Graceful error recovery and reporting

Dependencies:
- FastAPI: For routing, request handling, and HTTP responses
- BrandAnalysisService: For analysis business logic and workflow management
- app.models.analysis_models: For request/response models
- HTTP status codes: For proper error handling and responses

Used by:
- Frontend analysis workflow: For brand analysis creation and management
- Workflow orchestration: For step-by-step analysis progression
- Brand management: For brand isolation and organization
- Session management: For workflow state persistence
- Data organization: For brand-specific data structure
- Analysis lifecycle: For complete workflow management

Workflow Benefits:
- Clear step-by-step progression tracking
- Persistent state across sessions
- Brand isolation and data separation
- Progress visualization for users
- Error recovery and resumption
- Scalable multi-brand support

Processing Flow:
1. Request validation and parameter processing
2. Brand existence checking and conflict resolution
3. Analysis operation execution (create/retrieve/update/delete)
4. Workflow state management and progression
5. Result generation and validation
6. Response formatting and error handling

Analysis Lifecycle Features:
- Complete workflow from creation to completion
- State persistence across sessions and navigation
- Progress tracking and step completion
- Error recovery and workflow resumption
- Multi-user workflow support
- Scalable brand management architecture

Last Updated: 2024-12-23
Author: BrandBloom Backend Team
"""

from fastapi import APIRouter, HTTPException, Depends, status
from typing import Dict, Any

from app.services.brand_analysis_service import BrandAnalysisService
from app.models.analysis_models import (
    CreateAnalysisRequest, UpdateAnalysisRequest,
    AnalysisResponse, AnalysisListResponse
)

router = APIRouter(prefix="/api/analyses", tags=["analyses"])

@router.get("/check-brand/{brand_name}")
async def check_brand_exists(brand_name: str) -> Dict[str, Any]:
    """
    Check if a brand analysis already exists
    
    Args:
        brand_name: Brand name to check
        
    Returns:
        Brand existence status with analysis details if exists
        
    Raises:
        HTTPException: If check fails
    """
    try:
        result = BrandAnalysisService.check_brand_exists(brand_name)
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result["message"]
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@router.post("", response_model=AnalysisResponse)
async def create_analysis(request: CreateAnalysisRequest) -> Dict[str, Any]:
    """
    Create a new brand analysis
    
    Args:
        request: Analysis creation request with brand name and type
        
    Returns:
        Analysis creation response with metadata
        
    Raises:
        HTTPException: If analysis creation fails
    """
    try:
        result = BrandAnalysisService.create_analysis(request, force_overwrite=request.forceOverwrite)
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["message"]
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@router.get("", response_model=AnalysisListResponse)
async def list_analyses() -> Dict[str, Any]:
    """
    List all existing brand analyses
    
    Returns:
        List of analysis summaries sorted by last modified
        
    Raises:
        HTTPException: If listing fails
    """
    try:
        result = BrandAnalysisService.list_analyses()
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result["message"]
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@router.get("/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis(analysis_id: str) -> Dict[str, Any]:
    """
    Get specific analysis by ID
    
    Args:
        analysis_id: URL-safe analysis identifier
        
    Returns:
        Complete analysis metadata and state
        
    Raises:
        HTTPException: If analysis not found or retrieval fails
    """
    try:
        result = BrandAnalysisService.get_analysis(analysis_id)
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=result["message"]
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@router.put("/{analysis_id}", response_model=AnalysisResponse)
async def update_analysis(
    analysis_id: str, 
    updates: UpdateAnalysisRequest
) -> Dict[str, Any]:
    """
    Update analysis metadata and state
    
    Args:
        analysis_id: URL-safe analysis identifier
        updates: Analysis update request with optional fields
        
    Returns:
        Updated analysis metadata
        
    Raises:
        HTTPException: If analysis not found or update fails
    """
    try:
        result = BrandAnalysisService.update_analysis(analysis_id, updates)
        
        if not result["success"]:
            if "not found" in result["message"]:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=result["message"]
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=result["message"]
                )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@router.delete("/{analysis_id}")
async def delete_analysis(analysis_id: str) -> Dict[str, Any]:
    """
    Delete analysis and all associated data with comprehensive cleanup
    
    Performs complete cleanup including:
    - Brand directory structure
    - Node.js backend states
    - Global metadata files
    - Provides localStorage cleanup instructions for frontend
    
    Args:
        analysis_id: URL-safe analysis identifier
        
    Returns:
        Deletion confirmation with cleanup summary and localStorage cleanup instructions
        
    Raises:
        HTTPException: If analysis not found or deletion fails
    """
    try:
        result = BrandAnalysisService.delete_analysis(analysis_id)
        
        if not result["success"]:
            if "not found" in result["message"]:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=result["message"]
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=result["message"]
                )
        
        # 🆕 ADD LOCALSTORAGE CLEANUP INSTRUCTIONS
        # Since we can't directly clean localStorage from backend,
        # provide instructions for frontend to clean up RPI completion states
        if result.get("data"):
            result["data"]["localStorage_cleanup_required"] = True
            result["data"]["localStorage_keys_to_clear"] = [
                f"rpi_completion_{analysis_id}",
                f"analysis_state_{analysis_id}",
                f"concatenation_state_{analysis_id}",
                f"nonmmm_state_{analysis_id}"
            ]
            result["data"]["localStorage_cleanup_instructions"] = [
                "Clear RPI completion state for this analysis",
                "Clear any saved analysis workflow state",
                "Clear concatenation progress state",
                "Clear non-MMM analysis state"
            ]
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )
