"""
========================================
BRANDBLOOM INSIGHTS - BRAND ANALYSIS SERVICE
========================================

Purpose: Brand-based analysis management service

Description:
This service manages the complete lifecycle of brand analyses, replacing the
hardcoded filename-based system with a proper brand-centric approach.

Key Functionality:
- Create new brand analyses
- List existing analyses with automatic progress calculation
- Load/save analysis state
- Delete analyses with Windows file locking protection and force deletion capabilities
- Manage analysis files and directories
- Automatically detect uploaded files and concatenation state
- Calculate current step based on actual progress
- Progress tracking
- Dynamic state management
- Global file cleanup during analysis overwrite/deletion (CRITICAL FIX)
- Comprehensive brand-based file removal from all upload directories

Dependencies:
- json for state serialization
- pathlib for file operations
- slugify for creating URL-safe IDs
- app.models.analysis_models for data structures

CRITICAL FIX: Added comprehensive cleanup of global upload directories during
analysis overwrite and deletion to prevent old files from interfering with
new analysis creation and concatenation processes.

Last Updated: 2024-12-23 (Fixed rewrite/cleanup issue)
Author: BrandBloom Backend Team
"""

import json
import os
import shutil
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime
import re
import logging

logger = logging.getLogger(__name__)

from app.core.config import settings
from app.models.analysis_models import (
    BrandAnalysis, AnalysisListItem, AnalysisStatus, 
    CreateAnalysisRequest, UpdateAnalysisRequest
)

class BrandAnalysisService:
    """Service for managing brand-based analyses"""
    
    @staticmethod
    def _calculate_current_step(progress: Dict[str, bool], analysis_type: str = "MMM") -> int:
        """Calculate current step based on progress flags"""
        # CRITICAL: Step 2 (data upload) must be complete for analysis to be resumable
        if not progress.get("dataUploaded", False):
            return 2  # Data upload step - MUST be completed for resume
        
        # For NON_MMM analysis, use different step progression
        if analysis_type == "NON_MMM":
            # Non-MMM steps: 2=Upload, 3=Data Summary (includes target variable + expected signs), 4=Chart Analysis, 5=Model Building, 6=Download
            if not progress.get("dataSummaryCompleted", False):
                return 3  # Data summary step (includes target variable selection and expected signs)
            elif not progress.get("chartAnalysisCompleted", False):
                return 4  # Chart analysis step
            elif not progress.get("modelBuildingCompleted", False):
                return 5  # Model building step
            else:
                return 6  # Download analysis step (final for non-MMM)
        
        # For MMM analysis, use original logic
        elif not progress.get("concatenationCompleted", False):
            return 5  # Should be at data concatenation step
        elif progress.get("concatenationCompleted", False):
            # If concatenation is complete, user should continue from concatenation page
            # to review their processed data and make any adjustments
            return 5  # Stay at data concatenation step to review results
        elif not progress.get("filtersApplied", False):
            return 6  # Data summary step
        elif not progress.get("modelBuilt", False):
            return 11  # Model building step
        elif not progress.get("resultsGenerated", False):
            return 12  # Model results step
        else:
            return 13  # Optimizer step (final)
    
    @staticmethod
    def _update_progress_and_step(analysis_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update analysis progress based on available data and calculate current step"""
        progress = analysis_data.get("progress", {})
        analysis_id = analysis_data.get("analysisId")
        brand_name = analysis_data.get("brandName")
        
        # Check for data upload in multiple locations
        files = analysis_data.get("files", {})
        
        # Check uploaded files in brand-specific directory structure
        if analysis_id and brand_name:
            # Use brand-specific directory structure: <brandname>/data/uploads/raw/
            safe_brand_name = settings._sanitize_brand_name(brand_name)
            brand_data_dir = settings.BASE_DIR / safe_brand_name / "data"
            raw_uploads_dir = brand_data_dir / "uploads" / "raw"
            
            if raw_uploads_dir.exists() and any(raw_uploads_dir.iterdir()):
                progress["dataUploaded"] = True
                print(f"✅ Found uploaded files in brand directory: {raw_uploads_dir}")
        
        # Also check files metadata
        if files.get("uploadedFiles") or files.get("processedFiles"):
            progress["dataUploaded"] = True
        
        # Check for concatenation completion in multiple locations
        concatenation_state = analysis_data.get("concatenationState")
        
        # If not in analysis.json, check brand-specific metadata location
        if not concatenation_state and analysis_id and brand_name:
            try:
                # Check for state files in brand-specific directory
                safe_brand_name = settings._sanitize_brand_name(brand_name)
                brand_metadata_dir = settings.BASE_DIR / safe_brand_name / "data" / "metadata"
                
                # Check concatenation states
                concat_states_dir = brand_metadata_dir / "concatenation_states"
                if concat_states_dir.exists():
                    for state_file in concat_states_dir.glob("*_state.json"):
                        try:
                            with open(state_file, 'r', encoding='utf-8') as f:
                                state_data = json.load(f)
                                # Check if this state belongs to our analysis
                                if state_data.get("analysisId") == analysis_id:
                                    concatenation_state = state_data
                                    analysis_data["concatenationState"] = concatenation_state
                                    break
                        except Exception:
                            continue
                
                # Also check non-MMM states for non-MMM analyses
                if analysis_data.get("analysisType") == "NON_MMM":
                    nonmmm_states_dir = brand_metadata_dir / "nonmmm_summaries"
                    if nonmmm_states_dir.exists():
                        nonmmm_state_file = nonmmm_states_dir / f"{analysis_id}.json"
                        if nonmmm_state_file.exists():
                            try:
                                with open(nonmmm_state_file, 'r', encoding='utf-8') as f:
                                    nonmmm_state = json.load(f)
                                    # Use non-MMM state as concatenation state for progress tracking
                                    if nonmmm_state.get("dataUploadCompleted"):
                                        concatenation_state = nonmmm_state
                                        analysis_data["concatenationState"] = concatenation_state
                            except Exception:
                                pass
            except Exception:
                pass
        
        # Update progress based on concatenation state
        if concatenation_state:
            progress["concatenationCompleted"] = True
            
            # Check if target variable is selected
            if concatenation_state.get("targetVariable"):
                progress["targetVariableSelected"] = True
            
            # Check if brand metadata exists (brand categorization)
            if concatenation_state.get("brandMetadata"):
                progress["brandCategorized"] = True
            
            # If concatenation is done, data is definitely uploaded
            progress["dataUploaded"] = True
        
        # For NON_MMM analysis, check for non-MMM specific progress flags
        if analysis_type == "NON_MMM":
            # Check for data summary completion (includes target variable and expected signs)
            if concatenation_state and concatenation_state.get("targetVariable") and concatenation_state.get("expectedSigns"):
                progress["dataSummaryCompleted"] = True
            
            # Check for chart analysis completion
            if concatenation_state and concatenation_state.get("chartData"):
                progress["chartAnalysisCompleted"] = True
            
            # Check for model building completion
            if concatenation_state and concatenation_state.get("modelResults"):
                progress["modelBuildingCompleted"] = True
        
        # Check for filters (if filter state exists)
        if analysis_data.get("filterState"):
            progress["filtersApplied"] = True
        
        # Check for model state in brand-specific directory
        if analysis_id and brand_name and not analysis_data.get("modelState"):
            try:
                safe_brand_name = settings._sanitize_brand_name(brand_name)
                brand_uploads_dir = settings.BASE_DIR / safe_brand_name / "data" / "uploads" / "raw"
                
                # Check for model files in the raw directory
                if brand_uploads_dir.exists():
                    model_files = list(brand_uploads_dir.glob("models/*.json"))
                    if model_files:
                        # Found model files, mark as model built
                        progress["modelBuilt"] = True
                        progress["resultsGenerated"] = True
                        print(f"✅ Found model files in brand directory: {len(model_files)} models")
            except Exception:
                pass
        
        # Check for model (if model state exists)
        if analysis_data.get("modelState"):
            progress["modelBuilt"] = True
            progress["resultsGenerated"] = True
        
        # Calculate current step based on progress
        analysis_type = analysis_data.get("analysisType", "MMM")
        current_step = BrandAnalysisService._calculate_current_step(progress, analysis_type)
        
        # Update the analysis data
        analysis_data["progress"] = progress
        analysis_data["currentStep"] = current_step
        
        return analysis_data
    
    @staticmethod
    def _create_analysis_id(brand_name: str) -> str:
        """Create URL-safe analysis ID from brand name (consistent with _sanitize_brand_name)"""
        # Use the same sanitization logic as _sanitize_brand_name for consistency
        from app.core.config import settings
        return settings._sanitize_brand_name(brand_name)
    
    @staticmethod
    def _get_analysis_dir(analysis_id: str) -> Path:
        """Get LEGACY analysis directory path - DEPRECATED"""
        analyses_dir = settings.METADATA_DIR.parent / "analyses"
        return analyses_dir / analysis_id
    
    @staticmethod
    def _get_brand_analysis_dir(brand_name: str) -> Path:
        """Get brand-specific analysis directory path for analysis.json"""
        brand_dirs = settings.get_brand_directories(brand_name)
        return brand_dirs["analyses_dir"]
    
    @staticmethod
    def _ensure_analysis_structure(analysis_id: str, brand_name: str) -> Dict[str, Path]:
        """Create brand-specific analysis directory structure"""
        # Create brand-specific directories using the new structure
        logger.info(f"Creating brand directories for: {brand_name}")
        
        try:
            brand_directories = settings.create_brand_directories(brand_name)
            logger.info(f"Successfully created {len(brand_directories)} brand directories")
            
            # Verify key directories were created
            key_dirs = ['brand_root', 'data_dir', 'analyses_dir']
            for key in key_dirs:
                if key in brand_directories and brand_directories[key].exists():
                    logger.info(f"✓ {key}: {brand_directories[key]}")
                else:
                    logger.error(f"✗ {key}: {brand_directories.get(key, 'NOT_FOUND')}")
            
            return brand_directories
            
        except Exception as e:
            logger.error(f"Failed to create brand directories: {e}")
            raise
    
    @staticmethod
    def check_brand_exists(brand_name: str) -> Dict[str, Any]:
        """Check if brand analysis already exists (either as uploaded data or pending)"""
        try:
            analysis_id = BrandAnalysisService._create_analysis_id(brand_name)
            
            # First check if pending analysis exists (created but no data uploaded yet)
            pending_analyses_dir = settings.BASE_DIR / "_pending_analyses"
            pending_analysis_file = pending_analyses_dir / f"{analysis_id}.json"
            
            if pending_analysis_file.exists():
                # Analysis is pending (created but no data uploaded)
                return {
                    "success": True,
                    "message": f"Analysis for brand '{brand_name}' is pending data upload",
                    "exists": False,  # Not considered "existing" until data is uploaded
                    "data": {"exists": False, "pending": True}
                }
            
            # Then check if analysis folder exists with uploaded data
            analysis_dir = settings.BASE_DIR / analysis_id
            
            if analysis_dir.exists() and analysis_dir.is_dir():
                # Try to find analysis.json in the folder structure
                analysis_file = None
                
                # Check brand-specific location first
                brand_analysis_file = analysis_dir / "data" / "metadata" / "analyses" / "analysis.json"
                if brand_analysis_file.exists():
                    analysis_file = brand_analysis_file
                else:
                    # Check legacy location as fallback
                    legacy_analysis_file = analysis_dir / "analysis.json"
                    if legacy_analysis_file.exists():
                        analysis_file = legacy_analysis_file
                
                if analysis_file:
                    # Load existing analysis to get current status
                    try:
                        with open(analysis_file, 'r', encoding='utf-8') as f:
                            analysis_data = json.load(f)
                    except Exception as e:
                        logger.warning(f"Failed to read analysis file {analysis_file}: {e}")
                        return {
                            "success": False,
                            "message": f"Failed to read analysis data: {str(e)}",
                            "data": None
                        }
                else:
                    # No analysis.json found, but folder exists - create metadata from folder
                    uploads_dir = analysis_dir / "data" / "uploads"
                    legacy_uploads = analysis_dir / "uploads"
                    
                    if uploads_dir.exists() or legacy_uploads.exists():
                        # This looks like an analysis folder, create basic metadata
                        analysis_data = BrandAnalysisService._create_analysis_metadata_from_folder(
                            analysis_id, analysis_dir
                        )
                    else:
                        # Folder exists but doesn't look like an analysis
                        return {
                            "success": True,
                            "message": f"Brand '{brand_name}' does not exist",
                            "exists": False,
                            "data": {"exists": False}
                        }
                
                if analysis_data:
                    # Update progress and current step
                    analysis_data = BrandAnalysisService._update_progress_and_step(analysis_data)
                    
                    # CRITICAL: Only consider analysis as existing if data has been uploaded
                    # An analysis without data upload is not ready and shouldn't be considered "existing"
                    progress = analysis_data.get("progress", {})
                    if not progress.get("dataUploaded", False):
                        # Analysis exists but no data uploaded - treat as if it doesn't exist
                        return {
                            "success": True,
                            "message": f"No existing analysis found for brand '{brand_name}'",
                            "exists": False,
                            "data": {"exists": False}
                        }
                    
                    return {
                        "success": True,
                        "message": f"Analysis for brand '{brand_name}' already exists",
                        "exists": True,
                        "data": {
                            "exists": True,
                            "data": {
                                "analysisId": analysis_data["analysisId"],
                                "brandName": analysis_data["brandName"],
                                "currentStep": analysis_data["currentStep"],
                                "status": analysis_data["status"],
                                "lastModified": analysis_data["lastModified"],
                                "progress": analysis_data["progress"]
                            }
                        }
                    }
            else:
                return {
                    "success": True,
                    "message": f"No existing analysis found for brand '{brand_name}'",
                    "exists": False,
                    "data": {"exists": False}
                }
                
        except Exception as e:
            return {
                "success": False,
                "message": f"Failed to check brand existence: {str(e)}",
                "exists": False,
                "data": {"exists": False}
            }

    @staticmethod
    def create_analysis(request: CreateAnalysisRequest, force_overwrite: bool = False) -> Dict[str, Any]:
        """Create new brand analysis"""
        try:
            analysis_id = BrandAnalysisService._create_analysis_id(request.brandName)
            
            # Check if analysis already exists in multiple locations:
            # 1. Pending analyses (created but no data uploaded)
            # 2. Brand-specific folders (with uploaded data)
            # 3. Legacy locations (backward compatibility)
            
            pending_analyses_dir = settings.BASE_DIR / "_pending_analyses"
            pending_analysis_file = pending_analyses_dir / f"{analysis_id}.json"
            
            brand_analysis_dir = BrandAnalysisService._get_brand_analysis_dir(request.brandName)
            brand_analysis_file = brand_analysis_dir / "analysis.json"
            
            legacy_analysis_dir = BrandAnalysisService._get_analysis_dir(analysis_id)
            legacy_analysis_file = legacy_analysis_dir / "analysis.json"
            
            analysis_exists = (pending_analysis_file.exists() or 
                             brand_analysis_file.exists() or 
                             legacy_analysis_file.exists())
            
            if analysis_exists and not force_overwrite:
                return {
                    "success": False,
                    "message": f"Analysis for brand '{request.brandName}' already exists",
                    "data": None
                }
            
            # If force_overwrite is True, delete existing analysis first
            if analysis_exists and force_overwrite:
                try:
                    # Delete pending analysis if it exists
                    if pending_analysis_file.exists():
                        pending_analysis_file.unlink()
                        logger.info(f"Deleted pending analysis for overwrite: {pending_analysis_file}")
                    
                    # Delete analysis directory if it exists
                    analysis_dir = settings.BASE_DIR / analysis_id
                    if analysis_dir.exists():
                        shutil.rmtree(analysis_dir)
                        logger.info(f"Deleted existing analysis directory for overwrite: {analysis_dir}")
                    
                except Exception as e:
                    logger.warning(f"Failed to remove existing analysis files: {e}")
            
            # DEFERRED FOLDER CREATION: Don't create brand folders until data upload
            # Only create minimal metadata directory for tracking analysis intent
            
            # Create analysis metadata
            analysis = BrandAnalysis(
                brandName=request.brandName,
                analysisId=analysis_id,
                analysisType=request.analysisType
            )
            
            # Store analysis metadata in temporary pending location
            # This will be moved to brand-specific location after data upload
            pending_analyses_dir = settings.BASE_DIR / "_pending_analyses"
            pending_analyses_dir.mkdir(parents=True, exist_ok=True)
            pending_analysis_file = pending_analyses_dir / f"{analysis_id}.json"
            
            logger.info(f"Saving pending analysis to: {pending_analysis_file}")
            logger.info(f"Analysis will be moved to brand folder after data upload")
            
            # Serialize analysis data
            analysis_data = analysis.model_dump()
            logger.info(f"Analysis data serialized successfully: {len(str(analysis_data))} chars")
            
            # Write analysis file to pending location (will be moved after data upload)
            logger.info(f"Writing pending analysis file to: {pending_analysis_file}")
            with open(pending_analysis_file, 'w', encoding='utf-8') as f:
                json.dump(analysis_data, f, indent=2, ensure_ascii=False, default=str)
            
            # Verify file was created
            if not pending_analysis_file.exists():
                raise Exception(f"Pending analysis file was not created at {pending_analysis_file}")
                
            logger.info(f"Pending analysis file created successfully: {pending_analysis_file}")
            logger.info(f"Brand folders will be created when data is first uploaded")
            
            action_message = "overwritten and created" if force_overwrite else "created"
            return {
                "success": True,
                "message": f"Analysis {action_message} successfully for brand '{request.brandName}'",
                "data": analysis_data
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": f"Failed to create analysis: {str(e)}",
                "data": None
            }
    
    @staticmethod
    def list_analyses() -> Dict[str, Any]:
        """List all existing analyses with uploaded data (excluding pending analyses)"""
        try:
            analyses = []
            
            # NOTE: We deliberately DO NOT include pending analyses in listings
            # Pending analyses (created but no data uploaded) should not appear
            # until the user uploads data and the analysis becomes "real"
            
            # Simple approach: Check all directories in BASE_DIR for analysis folders
            for potential_analysis_dir in settings.BASE_DIR.iterdir():
                if potential_analysis_dir.is_dir() and not potential_analysis_dir.name.startswith('.'):
                    # Try to find analysis.json in various possible locations
                    analysis_file = None
                    analysis_data = None
                    
                    # Check brand-specific location first
                    brand_analysis_file = potential_analysis_dir / "data" / "metadata" / "analyses" / "analysis.json"
                    if brand_analysis_file.exists():
                        analysis_file = brand_analysis_file
                    else:
                        # Check legacy location as fallback
                        legacy_analysis_file = potential_analysis_dir / "analysis.json"
                        if legacy_analysis_file.exists():
                            analysis_file = legacy_analysis_file
                    
                    # If no analysis.json found, create a basic one from folder structure
                    if not analysis_file:
                        # Check if folder has data indicating it's an analysis (has uploads, etc.)
                        uploads_dir = potential_analysis_dir / "data" / "uploads"
                        legacy_uploads = potential_analysis_dir / "uploads"
                        
                        # CRITICAL: Only create analysis metadata if there are actual uploaded files
                        # This ensures only analyses with data upload are recognized
                        has_uploaded_files = False
                        if uploads_dir.exists():
                            # Check for files in raw uploads directory
                            raw_uploads = uploads_dir / "raw"
                            if raw_uploads.exists() and any(raw_uploads.iterdir()):
                                has_uploaded_files = True
                        elif legacy_uploads.exists() and any(legacy_uploads.iterdir()):
                            has_uploaded_files = True
                        
                        if has_uploaded_files:
                            # This looks like an analysis folder with actual data, create basic metadata
                            analysis_data = BrandAnalysisService._create_analysis_metadata_from_folder(
                                potential_analysis_dir.name, potential_analysis_dir
                            )
                    
                    if analysis_file or analysis_data:
                        try:
                            if analysis_file:
                                with open(analysis_file, 'r', encoding='utf-8') as f:
                                    analysis_data = json.load(f)
                            # else: analysis_data is already set from folder inspection
                            
                            # Update progress and current step based on actual data
                            analysis_data = BrandAnalysisService._update_progress_and_step(analysis_data)
                            
                            # CRITICAL: Only include analyses that have completed data upload (step 3)
                            # An analysis without data upload isn't ready and shouldn't be shown
                            progress = analysis_data.get("progress", {})
                            if not progress.get("dataUploaded", False):
                                # Skip this analysis - it's not ready for listing
                                continue
                            
                            # Save updated analysis back to file (if we have a file location)
                            if analysis_file:
                                try:
                                    with open(analysis_file, 'w', encoding='utf-8') as f:
                                        json.dump(analysis_data, f, indent=2, ensure_ascii=False)
                                except Exception as save_error:
                                    logger.warning(f"Failed to save updated analysis progress for {potential_analysis_dir.name}: {save_error}")
                                
                            # Create list item
                            list_item = AnalysisListItem(
                                analysisId=analysis_data["analysisId"],
                                brandName=analysis_data["brandName"],
                                lastModified=datetime.fromisoformat(analysis_data["lastModified"]),
                                currentStep=analysis_data["currentStep"],
                                status=AnalysisStatus(analysis_data["status"]),
                                analysisType=analysis_data["analysisType"]
                            )
                            analyses.append(list_item.model_dump())
                            
                        except Exception as e:
                            logger.warning(f"Error loading brand analysis {potential_analysis_dir.name}: {e}")
                            continue
            
            # PART 2: Search legacy directory structure (for backward compatibility)
            # REMOVED: No legacy analysis directory search
            
            # Sort by last modified (newest first)
            analyses.sort(key=lambda x: x["lastModified"], reverse=True)
            
            return {
                "success": True,
                "message": f"Found {len(analyses)} analyses",
                "data": analyses
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": f"Failed to list analyses: {str(e)}",
                "data": []
            }
    
    @staticmethod
    def get_analysis(analysis_id: str) -> Dict[str, Any]:
        """Get specific analysis by ID with automatic progress calculation"""
        try:
            # First try to find the analysis file in brand-specific locations
            analysis_file = None
            analysis_data = None
            
            # Try to find analysis by scanning brand directories
            for brand_dir in settings.BASE_DIR.iterdir():
                if brand_dir.is_dir() and not brand_dir.name.startswith('.'):
                    potential_analysis_file = brand_dir / "data" / "metadata" / "analyses" / "analysis.json"
                    if potential_analysis_file.exists():
                        with open(potential_analysis_file, 'r', encoding='utf-8') as f:
                            temp_data = json.load(f)
                            if temp_data.get("analysisId") == analysis_id:
                                analysis_file = potential_analysis_file
                                analysis_data = temp_data
                                break
            
            # Fallback to legacy location
            if not analysis_file:
                legacy_analysis_dir = BrandAnalysisService._get_analysis_dir(analysis_id)
                legacy_analysis_file = legacy_analysis_dir / "analysis.json"
                
                if legacy_analysis_file.exists():
                    analysis_file = legacy_analysis_file
                    with open(analysis_file, 'r', encoding='utf-8') as f:
                        analysis_data = json.load(f)
            
            if not analysis_file or not analysis_data:
                return {
                    "success": False,
                    "message": f"Analysis '{analysis_id}' not found",
                    "data": None
                }
            
            # Update progress and current step based on actual data
            analysis_data = BrandAnalysisService._update_progress_and_step(analysis_data)
            
            # Save updated analysis back to file
            try:
                with open(analysis_file, 'w', encoding='utf-8') as f:
                    json.dump(analysis_data, f, indent=2, ensure_ascii=False)
            except Exception as save_error:
                logger.warning(f"Failed to save updated analysis progress: {save_error}")
                # Continue anyway, we have the updated data in memory
            
            return {
                "success": True,
                "message": "Analysis retrieved successfully",
                "data": analysis_data
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": f"Failed to get analysis: {str(e)}",
                "data": None
            }
    
    @staticmethod
    def update_analysis(analysis_id: str, updates: UpdateAnalysisRequest) -> Dict[str, Any]:
        """Update analysis metadata and state"""
        try:
            # First try to find the analysis file in brand-specific locations (same as get_analysis)
            analysis_file = None
            analysis_data = None
            
            # Try to find analysis by scanning brand directories
            for brand_dir in settings.BASE_DIR.iterdir():
                if brand_dir.is_dir() and not brand_dir.name.startswith('.'):
                    potential_analysis_file = brand_dir / "data" / "metadata" / "analyses" / "analysis.json"
                    if potential_analysis_file.exists():
                        with open(potential_analysis_file, 'r', encoding='utf-8') as f:
                            temp_data = json.load(f)
                            if temp_data.get("analysisId") == analysis_id:
                                analysis_file = potential_analysis_file
                                analysis_data = temp_data
                                break
            
            # Fallback to legacy location
            if not analysis_file:
                legacy_analysis_dir = BrandAnalysisService._get_analysis_dir(analysis_id)
                legacy_analysis_file = legacy_analysis_dir / "analysis.json"
                
                if legacy_analysis_file.exists():
                    analysis_file = legacy_analysis_file
                    with open(analysis_file, 'r', encoding='utf-8') as f:
                        analysis_data = json.load(f)
            
            if not analysis_file or not analysis_data:
                return {
                    "success": False,
                    "message": f"Analysis '{analysis_id}' not found",
                    "data": None
                }
            
            # Load existing analysis (already loaded above)
            # analysis_data is already available from the search above
            
            # Update fields
            if updates.currentStep is not None:
                analysis_data["currentStep"] = updates.currentStep
            
            if updates.status is not None:
                analysis_data["status"] = updates.status.value
            
            if updates.concatenationState is not None:
                analysis_data["concatenationState"] = updates.concatenationState
                
            if updates.filterState is not None:
                analysis_data["filterState"] = updates.filterState
                
            if updates.modelState is not None:
                analysis_data["modelState"] = updates.modelState
            
            # Update timestamp (local time)
            analysis_data["lastModified"] = datetime.now().isoformat()
            
            # Save updated analysis to the correct file path (already found above)
            with open(analysis_file, 'w', encoding='utf-8') as f:
                json.dump(analysis_data, f, indent=2, ensure_ascii=False)
            
            return {
                "success": True,
                "message": "Analysis updated successfully",
                "data": analysis_data
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": f"Failed to update analysis: {str(e)}",
                "data": None
            }
    
    @staticmethod
    def _create_analysis_metadata_from_folder(analysis_id: str, folder_path: Path) -> Dict[str, Any]:
        """Create basic analysis metadata from folder structure (for folders without analysis.json)"""
        try:
            # Derive brand name from analysis_id (reverse of _create_analysis_id)
            brand_name = analysis_id.replace('-', ' ').title()
            
            # Check for uploaded files to determine progress
            uploads_dir = folder_path / "data" / "uploads"
            legacy_uploads = folder_path / "uploads"
            
            uploaded_files = []
            processed_files = []
            
            # Check for files in either location
            for uploads_location in [uploads_dir, legacy_uploads]:
                if uploads_location.exists():
                    for subdir in ["raw", "intermediate", "concatenated"]:
                        subdir_path = uploads_location / subdir
                        if subdir_path.exists():
                            for file_path in subdir_path.glob("*.xlsx"):
                                if subdir == "concatenated":
                                    processed_files.append(file_path.name)
                                else:
                                    uploaded_files.append(file_path.name)
            
            # Create basic metadata
            now = datetime.now().isoformat()
            
            # Determine current step based on files found
            data_uploaded = len(uploaded_files) > 0
            concatenation_completed = len(processed_files) > 0
            
            current_step = 3  # Brand selection completed (since folder exists)
            if data_uploaded:
                current_step = 5  # Data concatenation step
            if concatenation_completed:
                current_step = 6  # Data summary step
            
            return {
                "analysisId": analysis_id,
                "brandName": brand_name,
                "createdAt": now,
                "lastModified": now,
                "currentStep": current_step,
                "status": "in_progress",
                "analysisType": "MMM",
                "files": {
                    "originalFileName": uploaded_files[0] if uploaded_files else None,
                    "concatenatedFileName": processed_files[0] if processed_files else None,
                    "uploadedFiles": uploaded_files,
                    "processedFiles": processed_files
                },
                "progress": {
                    "dataUploaded": data_uploaded,
                    "concatenationCompleted": concatenation_completed,
                    "targetVariableSelected": False,
                    "filtersApplied": False,
                    "brandCategorized": False,
                    "modelBuilt": False,
                    "resultsGenerated": False
                }
            }
        except Exception as e:
            logger.error(f"Failed to create metadata from folder {folder_path}: {e}")
            return {}
    
    @staticmethod
    def delete_analysis(analysis_id: str) -> Dict[str, Any]:
        """
        Delete analysis and perform comprehensive cleanup of all related data
        
        Cleans up:
        1. Pending analysis JSON files
        2. Brand directory structure  
        3. Node.js backend concatenation states
        4. Global metadata files
        5. Any leftover RPI-enhanced files
        """
        try:
            deleted_something = False
            cleanup_summary = []
            
            # Check for pending analysis first
            pending_analyses_dir = settings.BASE_DIR / "_pending_analyses"
            pending_analysis_file = pending_analyses_dir / f"{analysis_id}.json"
            
            if pending_analysis_file.exists():
                try:
                    pending_analysis_file.unlink()
                    logger.info(f"✅ Deleted pending analysis: {pending_analysis_file}")
                    cleanup_summary.append(f"Pending analysis file: {pending_analysis_file.name}")
                    deleted_something = True
                except Exception as e:
                    logger.warning(f"Failed to delete pending analysis file: {e}")
            
            # Check for actual analysis directory
            # First try to get brand name from Node.js metadata to find correct folder
            brand_name = None
            try:
                # Try to read brand name from Node.js metadata
                nodejs_metadata_path = settings.BASE_DIR.parent / "nodejs" / "metadata" / "analyses" / f"{analysis_id}.json"
                if nodejs_metadata_path.exists():
                    import json
                    with open(nodejs_metadata_path, 'r', encoding='utf-8') as f:
                        nodejs_metadata = json.load(f)
                        brand_name = nodejs_metadata.get('brandName')
                        logger.info(f"Found brand name from Node.js metadata: {brand_name}")
            except Exception as e:
                logger.warning(f"Could not read Node.js metadata: {e}")
            
            # Use brand name to find folder if available, otherwise fall back to analysis_id
            if brand_name:
                # Use sanitized brand name to find the folder
                sanitized_brand_name = settings._sanitize_brand_name(brand_name)
                analysis_dir = settings.BASE_DIR / sanitized_brand_name
                logger.info(f"Looking for folder using brand name: {sanitized_brand_name}")
            else:
                # Fall back to using analysis_id directly
                analysis_dir = settings.BASE_DIR / analysis_id
                logger.info(f"Looking for folder using analysis_id: {analysis_id}")
            
            if analysis_dir.exists() and analysis_dir.is_dir():
                # Try regular deletion first
                try:
                    shutil.rmtree(analysis_dir)
                    logger.info(f"✅ Deleted analysis directory: {analysis_dir}")
                    cleanup_summary.append(f"Brand directory: {analysis_dir.name}/")
                    deleted_something = True
                except OSError as os_error:
                    # Handle Windows file locking issues
                    if "being used by another process" in str(os_error) or "WinError 32" in str(os_error):
                        logger.warning(f"File locked, attempting force deletion: {analysis_dir}")
                        success = BrandAnalysisService._force_delete_directory(analysis_dir)
                        if success:
                            logger.info(f"✅ Force deletion successful: {analysis_dir}")
                            cleanup_summary.append(f"Brand directory (forced): {analysis_dir.name}/")
                            deleted_something = True
                        else:
                            raise OSError(f"Force deletion failed. Please restart the Python backend and try again.")
                    else:
                        raise  # Re-raise if it's a different type of OSError
            
            # 🆕 COMPREHENSIVE CLEANUP: Remove Node.js backend states
            cleanup_results = BrandAnalysisService._cleanup_nodejs_backend_data(analysis_id)
            if cleanup_results["files_cleaned"] > 0:
                cleanup_summary.extend(cleanup_results["cleaned_files"])
                deleted_something = True
                logger.info(f"✅ Cleaned up {cleanup_results['files_cleaned']} Node.js backend files")
            
            # 🆕 COMPREHENSIVE CLEANUP: Remove global metadata files
            global_cleanup_results = BrandAnalysisService._cleanup_global_metadata(analysis_id)
            if global_cleanup_results["files_cleaned"] > 0:
                cleanup_summary.extend(global_cleanup_results["cleaned_files"])
                deleted_something = True
                logger.info(f"✅ Cleaned up {global_cleanup_results['files_cleaned']} global metadata files")
            
            # 🆕 COMPREHENSIVE CLEANUP: Remove cached data summaries from all brands
            data_summary_cleanup_results = BrandAnalysisService._cleanup_data_summaries(analysis_id)
            if data_summary_cleanup_results["files_cleaned"] > 0:
                cleanup_summary.extend(data_summary_cleanup_results["cleaned_files"])
                deleted_something = True
                logger.info(f"✅ Cleaned up {data_summary_cleanup_results['files_cleaned']} cached data summary files")
            
            if deleted_something:
                logger.info(f"🎯 Analysis '{analysis_id}' deletion complete. Cleaned up: {', '.join(cleanup_summary)}")
                return {
                    "success": True,
                    "message": f"Analysis '{analysis_id}' deleted successfully",
                    "data": {
                        "analysis_id": analysis_id,
                        "cleanup_summary": cleanup_summary,
                        "total_items_cleaned": len(cleanup_summary)
                    }
                }
            else:
                return {
                    "success": False,
                    "message": f"Analysis '{analysis_id}' not found (checked both pending and actual locations)",
                    "data": None
                }
            
        except Exception as e:
            logger.error(f"Error deleting analysis '{analysis_id}': {str(e)}")
            return {
                "success": False,
                "message": f"Failed to delete analysis: {str(e)}",
                "data": None
            }
    
    @staticmethod
    def _force_delete_directory(directory_path: Path) -> bool:
        """
        Force delete directory on Windows when files are locked by processes
        
        Args:
            directory_path: Path to directory to delete
            
        Returns:
            bool: True if successful, False otherwise
        """
        import time
        import gc
        
        try:
            # Force garbage collection to release any Python file handles
            gc.collect()
            time.sleep(0.1)  # Brief pause to allow file handles to close
            
            # Try normal deletion after garbage collection
            if directory_path.exists():
                shutil.rmtree(directory_path)
                return True
            return True  # Already deleted
            
        except OSError:
            try:
                # Use file-by-file deletion for all systems (safer than process killing)
                import platform
                
                if platform.system() == "Windows":
                    logger.warning("Windows file locking detected - using file-by-file deletion")
                else:
                    logger.info("Using file-by-file deletion for safe cleanup")
                
                return BrandAnalysisService._force_delete_file_by_file(directory_path)
                    
            except Exception as final_error:
                logger.error(f"All force deletion attempts failed: {final_error}")
                return False
    
    @staticmethod
    def _force_delete_file_by_file(directory_path: Path) -> bool:
        """
        Attempt to delete files one by one when directory deletion fails
        
        Args:
            directory_path: Path to directory to delete
            
        Returns:
            bool: True if most files were deleted, False if critical errors occurred
        """
        import time
        
        deleted_count = 0
        failed_count = 0
        
        try:
            for root, dirs, files in directory_path.rglob('*'):
                # Delete files first
                for file in files:
                    file_path = root / file
                    try:
                        file_path.unlink(missing_ok=True)
                        deleted_count += 1
                        time.sleep(0.01)  # Small delay between deletions
                    except OSError:
                        failed_count += 1
                        logger.warning(f"Could not delete file: {file_path}")
                
            # Then delete directories (bottom-up)
            for root, dirs, files in reversed(list(directory_path.rglob('*'))):
                if root.is_dir():
                    try:
                        root.rmdir()  # Only works if directory is empty
                        deleted_count += 1
                    except OSError:
                        failed_count += 1
                        logger.warning(f"Could not delete directory: {root}")
            
            # Finally try to delete the main directory
            try:
                directory_path.rmdir()
                deleted_count += 1
            except OSError:
                failed_count += 1
                logger.warning(f"Could not delete main directory: {directory_path}")
            
            # Consider success if we deleted most files
            success_rate = deleted_count / (deleted_count + failed_count) if (deleted_count + failed_count) > 0 else 0
            logger.info(f"Force deletion stats: {deleted_count} deleted, {failed_count} failed, {success_rate:.2%} success rate")
            
            return success_rate > 0.8  # Consider successful if >80% deleted
            
        except Exception as e:
            logger.error(f"File-by-file deletion failed: {e}")
            return False
    
    @staticmethod
    def _cleanup_global_uploads_for_brand(brand_name_lower: str) -> None:
        """
        COMPREHENSIVE CLEANUP: Remove ALL brand data from ENTIRE codebase
        
        This method ensures COMPLETE cleanup of ALL brand-related files and directories
        across the ENTIRE codebase when overwriting a brand analysis.
        
        Cleanup Locations:
        1. Python Backend: All data directories and brand-specific folders
        2. Node.js Backend: All upload and metadata directories  
        3. Frontend Cache: Any cached files (if applicable)
        4. Legacy Locations: Old metadata and state files
        
        Args:
            brand_name_lower: Brand name in lowercase for case-insensitive matching
        """
        try:
            # CRITICAL FIX: Force garbage collection to close any open file handles
            import gc
            gc.collect()
            
            cleaned_files = []
            
            # REMOVED: No more legacy directory cleanup
            
            # PART 2: Clean up brand-specific directory structure
            # Get brand directories (for all possible brand name variations)
            possible_brand_names = [
                brand_name_lower,
                settings._sanitize_brand_name(brand_name_lower),
                brand_name_lower.replace(' ', '-'),
                brand_name_lower.replace('-', ' ')
            ]
            
            for potential_brand_name in set(possible_brand_names):  # Remove duplicates
                try:
                    brand_dirs = settings.get_brand_directories(potential_brand_name)
                    brand_root = brand_dirs["brand_root"]
                    
                    if brand_root.exists():
                        logger.info(f"Removing brand-specific directory: {brand_root}")
                        shutil.rmtree(brand_root)
                        cleaned_files.append(f"Brand directory: {brand_root}")
                        logger.info(f"Successfully removed brand directory: {brand_root}")
                except Exception as brand_cleanup_error:
                    logger.warning(f"Failed to cleanup brand directory for '{potential_brand_name}': {brand_cleanup_error}")
            
            # PART 3: Clean up old metadata state files in global metadata directory
            old_metadata_dir = Path(settings.BASE_DIR) / "metadata" / "concatenation_states"
            if old_metadata_dir.exists():
                for state_file in old_metadata_dir.glob("*_state.json"):
                    try:
                        with open(state_file, 'r', encoding='utf-8') as f:
                            state_data = json.load(f)
                        original_filename = state_data.get("originalFileName", "").lower()
                        if brand_name_lower in original_filename:
                            state_file.unlink()
                            cleaned_files.append(str(state_file))
                            logger.info(f"Cleaned up state file: {state_file}")
                    except Exception:
                        continue
            
            # REMOVED: No more legacy analysis directory cleanup
            
            # PART 5: COMPREHENSIVE CODEBASE CLEANUP - Node.js Backend
            try:
                nodejs_backend_base = settings.BASE_DIR.parent / "nodejs"
                if nodejs_backend_base.exists():
                    logger.info(f"🧹 COMPREHENSIVE CLEANUP: Cleaning Node.js backend for brand: {brand_name_lower}")
                    
                    # Node.js upload directories
                    nodejs_dirs_to_clean = [
                        nodejs_backend_base / "uploads",
                        nodejs_backend_base / "processed", 
                        nodejs_backend_base / "metadata",
                        nodejs_backend_base / "exports"
                    ]
                    
                    for nodejs_dir in nodejs_dirs_to_clean:
                        if nodejs_dir.exists():
                            for file_path in nodejs_dir.rglob("*"):
                                if file_path.is_file() and brand_name_lower in file_path.name.lower():
                                    try:
                                        file_path.unlink()
                                        cleaned_files.append(f"Node.js file: {file_path}")
                                        logger.info(f"Cleaned up Node.js file: {file_path}")
                                    except Exception as nodejs_error:
                                        logger.warning(f"Failed to delete Node.js file {file_path}: {nodejs_error}")
                else:
                    logger.info(f"Node.js backend not found at: {nodejs_backend_base}")
            except Exception as nodejs_cleanup_error:
                logger.warning(f"Error during Node.js cleanup: {nodejs_cleanup_error}")
            
            # PART 6: COMPREHENSIVE CODEBASE CLEANUP - Frontend Cache (if applicable)
            try:
                frontend_base = settings.BASE_DIR.parent.parent / "frontend"
                if frontend_base.exists():
                    logger.info(f"🧹 COMPREHENSIVE CLEANUP: Checking frontend cache for brand: {brand_name_lower}")
                    
                    # Common frontend cache directories
                    frontend_cache_dirs = [
                        frontend_base / "node_modules" / ".cache",
                        frontend_base / "dist" / "assets",
                        frontend_base / "build" / "static",
                        frontend_base / ".next" / "cache",
                        frontend_base / "public" / "data"
                    ]
                    
                    for cache_dir in frontend_cache_dirs:
                        if cache_dir.exists():
                            for file_path in cache_dir.rglob("*"):
                                if file_path.is_file() and brand_name_lower in file_path.name.lower():
                                    try:
                                        file_path.unlink()
                                        cleaned_files.append(f"Frontend cache: {file_path}")
                                        logger.info(f"Cleaned up frontend cache: {file_path}")
                                    except Exception as frontend_error:
                                        logger.warning(f"Failed to delete frontend cache {file_path}: {frontend_error}")
                else:
                    logger.info(f"Frontend directory not found at: {frontend_base}")
            except Exception as frontend_cleanup_error:
                logger.warning(f"Error during frontend cleanup: {frontend_cleanup_error}")
            
            # PART 7: COMPREHENSIVE CODEBASE CLEANUP - Any other project directories
            try:
                project_root = settings.BASE_DIR.parent.parent  # Go to project root
                logger.info(f"🧹 COMPREHENSIVE CLEANUP: Scanning entire project for brand: {brand_name_lower}")
                
                # Search for any files containing the brand name in the entire project
                # But exclude node_modules, .git, __pycache__ etc.
                exclude_dirs = {
                    "node_modules", ".git", "__pycache__", ".next", "dist", "build", 
                    ".venv", "venv", ".env", "env", ".pytest_cache", "coverage"
                }
                
                def should_skip_dir(dir_path):
                    return any(exclude_name in str(dir_path) for exclude_name in exclude_dirs)
                
                # Search all directories except excluded ones
                for root_dir in project_root.iterdir():
                    if root_dir.is_dir() and not should_skip_dir(root_dir):
                        try:
                            for file_path in root_dir.rglob("*"):
                                if (file_path.is_file() and 
                                    not should_skip_dir(file_path) and 
                                    brand_name_lower in file_path.name.lower()):
                                    try:
                                        # Extra safety: only delete files in known data directories
                                        path_str = str(file_path).lower()
                                        if any(data_term in path_str for data_term in 
                                              ["upload", "data", "export", "metadata", "processed", "concat"]):
                                            file_path.unlink()
                                            cleaned_files.append(f"Project file: {file_path}")
                                            logger.info(f"Cleaned up project file: {file_path}")
                                    except Exception as project_error:
                                        logger.warning(f"Failed to delete project file {file_path}: {project_error}")
                        except Exception as scan_error:
                            logger.warning(f"Error scanning directory {root_dir}: {scan_error}")
                            
            except Exception as project_cleanup_error:
                logger.warning(f"Error during project-wide cleanup: {project_cleanup_error}")
            
            # SUMMARY REPORTING
            if cleaned_files:
                logger.info(f"🎯 COMPREHENSIVE CLEANUP COMPLETE: {len(cleaned_files)} items removed for brand: {brand_name_lower}")
                logger.info("📋 Cleanup Summary:")
                for cleaned_item in cleaned_files:
                    logger.info(f"  ✅ {cleaned_item}")
                
                # Group by cleanup type for better reporting
                python_files = [f for f in cleaned_files if "python" in f.lower() or "Backend/python" in f]
                nodejs_files = [f for f in cleaned_files if "node" in f.lower()]
                frontend_files = [f for f in cleaned_files if "frontend" in f.lower()]
                project_files = [f for f in cleaned_files if "project" in f.lower()]
                
                logger.info(f"📊 Cleanup Breakdown:")
                logger.info(f"  🐍 Python Backend: {len(python_files)} items")
                logger.info(f"  🟢 Node.js Backend: {len(nodejs_files)} items") 
                logger.info(f"  ⚛️  Frontend Cache: {len(frontend_files)} items")
                logger.info(f"  📁 Other Project Files: {len(project_files)} items")
                
            else:
                logger.info(f"🔍 COMPREHENSIVE CLEANUP: No files found to clean for brand: {brand_name_lower}")
                logger.info("✅ This could mean:")
                logger.info("  - Brand was completely clean already")
                logger.info("  - Brand name doesn't match any files")
                logger.info("  - All cleanup was successful in previous operations")
                
        except Exception as e:
            logger.error(f"❌ ERROR during comprehensive codebase cleanup for brand {brand_name_lower}: {e}")
            logger.error(f"🔧 This may require manual cleanup for brand: {brand_name_lower}")
    
    @staticmethod
    def _cleanup_nodejs_backend_data(analysis_id: str) -> Dict[str, Any]:
        """
        Clean up Node.js backend data for an analysis
        
        Removes:
        - Analysis metadata files from Node.js backend
        - Concatenation states
        - Non-MMM states and preferences
        """
        from pathlib import Path
        
        cleanup_results = {
            "files_cleaned": 0,
            "cleaned_files": []
        }
        
        try:
            # Path to Node.js backend (relative to Python backend)
            nodejs_backend_path = settings.BASE_DIR.parent / "nodejs"
            
            if not nodejs_backend_path.exists():
                logger.debug("Node.js backend directory not found, skipping cleanup")
                return cleanup_results
            
            # 1. Clean up analysis metadata
            analyses_dir = nodejs_backend_path / "metadata" / "analyses"
            if analyses_dir.exists():
                analysis_file = analyses_dir / f"{analysis_id}.json"
                if analysis_file.exists():
                    try:
                        analysis_file.unlink()
                        cleanup_results["files_cleaned"] += 1
                        cleanup_results["cleaned_files"].append(f"Node.js analysis metadata: {analysis_file.name}")
                        logger.debug(f"Deleted Node.js analysis file: {analysis_file}")
                    except Exception as e:
                        logger.warning(f"Failed to delete Node.js analysis file {analysis_file}: {e}")
            
            # 2. Clean up concatenation states
            concat_states_dir = nodejs_backend_path / "metadata" / "concatenation_states"
            if concat_states_dir.exists():
                # Look for files containing the analysis_id
                for state_file in concat_states_dir.glob("*.json"):
                    if analysis_id.lower() in state_file.stem.lower():
                        try:
                            state_file.unlink()
                            cleanup_results["files_cleaned"] += 1
                            cleanup_results["cleaned_files"].append(f"Concatenation state: {state_file.name}")
                            logger.debug(f"Deleted concatenation state: {state_file}")
                        except Exception as e:
                            logger.warning(f"Failed to delete concatenation state {state_file}: {e}")
            
            # 3. Clean up non-MMM states
            nonmmm_states_dir = nodejs_backend_path / "metadata" / "nonmmm_states"
            if nonmmm_states_dir.exists():
                for state_file in nonmmm_states_dir.glob("*.json"):
                    if analysis_id.lower() in state_file.stem.lower():
                        try:
                            state_file.unlink()
                            cleanup_results["files_cleaned"] += 1
                            cleanup_results["cleaned_files"].append(f"Non-MMM state: {state_file.name}")
                            logger.debug(f"Deleted non-MMM state: {state_file}")
                        except Exception as e:
                            logger.warning(f"Failed to delete non-MMM state {state_file}: {e}")
            
            # 4. Clean up non-MMM preferences
            nonmmm_prefs_dir = nodejs_backend_path / "metadata" / "nonmmm_preferences"
            if nonmmm_prefs_dir.exists():
                for pref_file in nonmmm_prefs_dir.glob("*.json"):
                    if analysis_id.lower() in pref_file.stem.lower():
                        try:
                            pref_file.unlink()
                            cleanup_results["files_cleaned"] += 1
                            cleanup_results["cleaned_files"].append(f"Non-MMM preferences: {pref_file.name}")
                            logger.debug(f"Deleted non-MMM preferences: {pref_file}")
                        except Exception as e:
                            logger.warning(f"Failed to delete non-MMM preferences {pref_file}: {e}")
            
        except Exception as e:
            logger.error(f"Error during Node.js backend cleanup for {analysis_id}: {e}")
        
        return cleanup_results
    
    @staticmethod
    def _cleanup_global_metadata(analysis_id: str) -> Dict[str, Any]:
        """
        Clean up global metadata files that might reference this analysis
        
        Removes:
        - Legacy metadata files in global directories
        - State files in data/metadata directories
        - Any orphaned RPI-related files
        """
        cleanup_results = {
            "files_cleaned": 0,
            "cleaned_files": []
        }
        
        try:
            # Clean up data/metadata directories (legacy global metadata)
            legacy_metadata_paths = [
                settings.BASE_DIR / "data" / "metadata",
                settings.BASE_DIR / "metadata"
            ]
            
            for metadata_path in legacy_metadata_paths:
                if metadata_path.exists():
                    # Clean analysis metadata
                    analyses_dir = metadata_path / "analyses"
                    if analyses_dir.exists():
                        for analysis_file in analyses_dir.glob("*.json"):
                            if analysis_id.lower() in analysis_file.stem.lower():
                                try:
                                    analysis_file.unlink()
                                    cleanup_results["files_cleaned"] += 1
                                    cleanup_results["cleaned_files"].append(f"Legacy analysis metadata: {analysis_file.name}")
                                    logger.debug(f"Deleted legacy analysis metadata: {analysis_file}")
                                except Exception as e:
                                    logger.warning(f"Failed to delete legacy analysis metadata {analysis_file}: {e}")
                    
                    # Clean concatenation states
                    concat_states_dir = metadata_path / "concatenation_states"
                    if concat_states_dir.exists():
                        for state_file in concat_states_dir.glob("*.json"):
                            if analysis_id.lower() in state_file.stem.lower():
                                try:
                                    state_file.unlink()
                                    cleanup_results["files_cleaned"] += 1
                                    cleanup_results["cleaned_files"].append(f"Legacy concatenation state: {state_file.name}")
                                    logger.debug(f"Deleted legacy concatenation state: {state_file}")
                                except Exception as e:
                                    logger.warning(f"Failed to delete legacy concatenation state {state_file}: {e}")
            
        except Exception as e:
            logger.error(f"Error during global metadata cleanup for {analysis_id}: {e}")
        
        return cleanup_results
    
    @staticmethod
    def _cleanup_data_summaries(analysis_id: str) -> Dict[str, Any]:
        """
        Clean up cached data summaries for the analysis across all brands
        
        Removes:
        - Non-MMM data summary files stored by the analysis ID
        - Files in {brand}/data/metadata/nonmmm_summaries/{analysis_id}.json
        """
        cleanup_results = {
            "files_cleaned": 0,
            "cleaned_files": []
        }
        
        try:
            # Search all brand directories for cached data summaries
            base_dir = settings.BASE_DIR
            
            # Find all potential brand directories
            for potential_brand_dir in base_dir.iterdir():
                if potential_brand_dir.is_dir() and potential_brand_dir.name != "_pending_analyses":
                    # Check if this is a brand directory with data structure
                    brand_data_dir = potential_brand_dir / "data"
                    if brand_data_dir.exists():
                        # Look for nonmmm_summaries directory
                        summaries_dir = brand_data_dir / "metadata" / "nonmmm_summaries"
                        if summaries_dir.exists():
                            # Look for the specific analysis summary file
                            summary_file = summaries_dir / f"{analysis_id}.json"
                            if summary_file.exists():
                                try:
                                    summary_file.unlink()
                                    cleanup_results["files_cleaned"] += 1
                                    cleanup_results["cleaned_files"].append(f"Data summary: {potential_brand_dir.name}/nonmmm_summaries/{summary_file.name}")
                                    logger.debug(f"Deleted data summary: {summary_file}")
                                except Exception as e:
                                    logger.warning(f"Failed to delete data summary {summary_file}: {e}")
            
        except Exception as e:
            logger.error(f"Error during data summary cleanup for {analysis_id}: {e}")
        
        return cleanup_results
