"""
========================================
BRANDBLOOM INSIGHTS - METADATA ROUTES
========================================

Purpose: Metadata state persistence, management, and workflow continuity API endpoints

Description:
This module provides metadata management endpoints for the BrandBloom Insights
application. It handles concatenation state persistence, retrieval, and management
to ensure workflow continuity across user sessions and page navigation. The routes
support complete state management including save, retrieve, update, delete, and
export operations for maintaining user workflow progress.

Key Functions:
- save_concatenation_state(request): State persistence endpoint
  - Saves complete concatenation state including user selections
  - Stores metadata, filter states, and processing results
  - Ensures workflow continuity across sessions
  - Returns save operation results and confirmation
- get_concatenation_state(original_filename): State retrieval endpoint
  - Loads previously saved concatenation state
  - Supports seamless navigation and workflow resumption
  - Handles URL-encoded filenames
  - Returns complete state data for workflow restoration
- delete_concatenation_state(original_filename): State cleanup endpoint
  - Removes concatenation state when workflow completes
  - Cleans up storage and maintains system efficiency
  - Supports URL-encoded filename handling
  - Returns deletion confirmation and results
- list_all_states(): State enumeration endpoint
  - Lists all available concatenation states
  - Provides overview of stored workflow states
  - Supports state management and monitoring
  - Returns comprehensive state listing
- update_concatenation_state(original_filename, updates): State modification endpoint
  - Updates specific fields in existing state
  - Supports partial state updates and modifications
  - Maintains state integrity and consistency
  - Returns update results and confirmation
- cleanup_old_states(days_old): State maintenance endpoint
  - Removes states older than specified days
  - Maintains system storage efficiency
  - Prevents accumulation of obsolete states
  - Returns cleanup statistics and results
- export_state_data(original_filename, export_format): State export endpoint
  - Exports state data in specified format (JSON)
  - Supports state backup and sharing
  - Handles URL-encoded filename processing
  - Returns downloadable state file
- metadata_health_check(): Service health monitoring endpoint
  - Monitors metadata service health and status
  - Checks directory accessibility and permissions
  - Reports state count and system status
  - Provides service health diagnostics

State Management Features:
- Complete workflow state persistence
- Session continuity and navigation support
- State validation and integrity checking
- Automatic cleanup and maintenance
- Export and backup capabilities
- Health monitoring and diagnostics
- URL-safe filename handling

API Endpoints:
- POST /api/metadata/state/save: Save concatenation state
  - Accepts: Dict with complete state data
  - Returns: StateResponse with save confirmation
  - Purpose: Workflow state persistence and storage
- GET /api/metadata/state/{filename}: Retrieve concatenation state
  - Accepts: original_filename (path, URL encoded)
  - Returns: StateResponse with complete state data
  - Purpose: Workflow state restoration and resumption
- DELETE /api/metadata/state/{filename}: Delete concatenation state
  - Accepts: original_filename (path, URL encoded)
  - Returns: Dict with deletion results
  - Purpose: State cleanup and storage management
- GET /api/metadata/states: List all states
  - Accepts: No parameters
  - Returns: Dict with state listing and metadata
  - Purpose: State overview and management
- PUT /api/metadata/state/{filename}: Update state
  - Accepts: original_filename (path, URL encoded), updates (Dict)
  - Returns: Dict with update results
  - Purpose: Partial state modification and updates
- POST /api/metadata/cleanup: Cleanup old states
  - Accepts: days_old (query parameter, default: 30)
  - Returns: Dict with cleanup results
  - Purpose: Automatic state maintenance and cleanup
- GET /api/metadata/state/{filename}/export: Export state data
  - Accepts: original_filename (path, URL encoded), export_format (query parameter)
  - Returns: FileResponse with exported state file
  - Purpose: State backup and sharing
- GET /api/metadata/health: Metadata service health check
  - Accepts: No parameters
  - Returns: Dict with service health status
  - Purpose: Service monitoring and diagnostics

State Data Structure:
- Original and concatenated file information
- Selected sheets and processing parameters
- Filter states and user selections
- Brand metadata and categorization
- Processing timestamps and status
- Column categories and expected signs
- Preview data and analysis results

Workflow Continuity Benefits:
- Seamless navigation across sessions
- Persistent user selections and preferences
- Workflow resumption from any point
- State backup and recovery capabilities
- Multi-user workflow support
- Session management and persistence

State Management Features:
- Automatic state validation and integrity
- Efficient storage and retrieval
- State versioning and updates
- Cleanup and maintenance automation
- Export and backup capabilities
- Health monitoring and diagnostics

Error Handling:
- Comprehensive HTTP status code usage
- Detailed error messages for debugging
- File not found handling and validation
- State validation and integrity checking
- Graceful error recovery and reporting
- Input validation and sanitization

Dependencies:
- FastAPI: For routing, request handling, and HTTP responses
- MetadataService: For state management and business logic
- app.models.data_models: For response models
- urllib.parse: For URL decoding of filenames
- app.core.config: For directory configuration and settings

Used by:
- Concatenation workflows: For state persistence and resumption
- State persistence requirements: For workflow continuity
- Session management: For user session persistence
- Data continuity features: For seamless navigation
- Workflow management: For process state tracking
- System administration: For state monitoring and cleanup

State Management Benefits:
- Complete workflow continuity across sessions
- Persistent user selections and preferences
- Efficient state storage and retrieval
- Automatic cleanup and maintenance
- State backup and recovery capabilities
- Multi-user workflow support

Processing Flow:
1. State validation and parameter processing
2. URL decoding and filename processing
3. State operation execution (save/retrieve/update/delete)
4. Result generation and validation
5. Response formatting and error handling
6. State persistence and confirmation

Workflow Continuity Features:
- Session persistence across page navigation
- State restoration and workflow resumption
- User preference and selection persistence
- Multi-step workflow state tracking
- State backup and recovery mechanisms
- Cross-session workflow support

Last Updated: 2024-12-23
Author: BrandBloom Backend Team
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from typing import Dict, Any
import urllib.parse

from app.services.metadata_service import MetadataService
from app.models.data_models import StateResponse

router = APIRouter()

@router.post("/api/metadata/state/save", response_model=StateResponse)
async def save_concatenation_state(request: Dict[str, Any]) -> StateResponse:
    """
    Save concatenation state for processed files
    
    Purpose: Store complete concatenation state including user selections and metadata
    
    Args:
        request: Dict containing concatenation state data
        
    Returns:
        StateResponse with save operation results
        
    Raises:
        HTTPException: If save operation fails
    """
    try:
        result = MetadataService.save_concatenation_state(request)
        
        # Extract stateFileName and stateFilePath from the result data
        # FIXED (2025-01-27): Explicitly extract and pass state filename fields to StateResponse
        stateFileName = result.get("data", {}).get("stateFileName")
        stateFilePath = result.get("data", {}).get("stateFilePath")
        
        # Create StateResponse with all fields including stateFileName and stateFilePath
        return StateResponse(
            success=result["success"],
            message=result["message"],
            data=result.get("data"),
            stateFileName=stateFileName,
            stateFilePath=stateFilePath
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save state: {str(e)}")

@router.get("/api/metadata/state/{original_filename}", response_model=StateResponse)
async def get_concatenation_state(original_filename: str) -> StateResponse:
    """
    Retrieve concatenation state for a file
    
    Purpose: Load previously saved concatenation state for seamless navigation
    
    Args:
        original_filename: Name of original file (URL encoded)
        
    Returns:
        StateResponse with state data
        
    Raises:
        HTTPException: If state not found or retrieval fails
    """
    try:
        # Decode URL-encoded filename
        decoded_filename = urllib.parse.unquote(original_filename)
        
        result = MetadataService.get_concatenation_state(decoded_filename)
        return StateResponse(**result)
        
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve state: {str(e)}")

@router.delete("/api/metadata/state/{original_filename}")
async def delete_concatenation_state(original_filename: str) -> Dict[str, Any]:
    """
    Delete concatenation state for a file
    
    Purpose: Clean up state when workflow is completed
    
    Args:
        original_filename: Name of original file (URL encoded)
        
    Returns:
        Dict with deletion results
        
    Raises:
        HTTPException: If state not found or deletion fails
    """
    try:
        # Decode URL-encoded filename
        decoded_filename = urllib.parse.unquote(original_filename)
        
        result = MetadataService.delete_concatenation_state(decoded_filename)
        return result
        
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete state: {str(e)}")

@router.get("/api/metadata/states")
async def list_all_states() -> Dict[str, Any]:
    """
    List all available concatenation states
    
    Returns:
        Dict with list of all states and metadata
        
    Raises:
        HTTPException: If listing fails
    """
    try:
        result = MetadataService.list_all_states()
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list states: {str(e)}")

@router.put("/api/metadata/state/{original_filename}")
async def update_concatenation_state(original_filename: str, updates: Dict[str, Any]) -> Dict[str, Any]:
    """
    Update specific fields in concatenation state
    
    Args:
        original_filename: Name of original file (URL encoded)
        updates: Dictionary with fields to update
        
    Returns:
        Dict with update results
        
    Raises:
        HTTPException: If update fails
    """
    try:
        # Decode URL-encoded filename
        decoded_filename = urllib.parse.unquote(original_filename)
        
        result = MetadataService.update_concatenation_state(decoded_filename, updates)
        return result
        
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update state: {str(e)}")

@router.post("/api/metadata/cleanup")
async def cleanup_old_states(days_old: int = 30) -> Dict[str, Any]:
    """
    Clean up state files older than specified days
    
    Args:
        days_old: Number of days after which states are considered old (default: 30)
        
    Returns:
        Dict with cleanup results
        
    Raises:
        HTTPException: If cleanup fails
    """
    try:
        if days_old < 1:
            raise HTTPException(status_code=400, detail="days_old must be greater than 0")
        
        result = MetadataService.cleanup_old_states(days_old)
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to cleanup states: {str(e)}")

@router.get("/api/metadata/state/{original_filename}/export")
async def export_state_data(original_filename: str, export_format: str = "json") -> FileResponse:
    """
    Export state data to specified format
    
    Args:
        original_filename: Name of original file (URL encoded)
        export_format: Export format ('json')
        
    Returns:
        FileResponse with exported state file
        
    Raises:
        HTTPException: If export fails
    """
    try:
        # Decode URL-encoded filename
        decoded_filename = urllib.parse.unquote(original_filename)
        
        # Validate export format
        valid_formats = ["json"]
        if export_format.lower() not in valid_formats:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid export format. Must be one of: {valid_formats}"
            )
        
        export_path = MetadataService.export_state_data(decoded_filename, export_format)
        
        return FileResponse(
            path=str(export_path),
            filename=export_path.name,
            media_type="application/json"
        )
        
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

@router.get("/api/metadata/health")
async def metadata_health_check() -> Dict[str, Any]:
    """
    Health check for metadata service
    
    Returns:
        Dict with metadata service health status
    """
    try:
        from app.core.config import settings
        
        # Check if metadata directory exists and is writable
        metadata_dir_exists = settings.METADATA_DIR.exists()
        metadata_dir_writable = True
        
        if metadata_dir_exists:
            try:
                # Test write access
                test_file = settings.METADATA_DIR / ".health_check"
                test_file.write_text("test")
                test_file.unlink()
            except Exception:
                metadata_dir_writable = False
        
        # Get state count
        state_count = 0
        if metadata_dir_exists:
            state_files = list(settings.METADATA_DIR.glob("*_state.json"))
            state_count = len(state_files)
        
        health_status = {
            "service": "metadata_service",
            "status": "healthy" if metadata_dir_exists and metadata_dir_writable else "unhealthy",
            "metadata_directory_exists": metadata_dir_exists,
            "metadata_directory_writable": metadata_dir_writable,
            "total_states": state_count,
            "metadata_directory": str(settings.METADATA_DIR)
        }
        
        return {
            "success": True,
            "message": "Metadata service health check completed",
            "data": health_status
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")
