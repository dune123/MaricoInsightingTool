"""
========================================
ANALYSIS MANAGER - ANALYSIS MODULE
========================================

Purpose: Core analysis lifecycle management

Description:
Handles the core lifecycle operations for brand analyses including
creation, retrieval, updating, and deletion with proper state management.
Uses consistent ID generation with BrandAnalysisService.

Key Functionality:
- Analysis creation and initialization
- Analysis retrieval and state loading
- Analysis updates and modifications
- Analysis deletion and cleanup

Recent Fix (2025-01-27):
- Updated _create_analysis_id to use consistent logic with BrandAnalysisService
- Removed timestamp-based ID generation to prevent folder name conflicts
- Ensures brand folders use predictable names like "x-men" instead of "x-men-timestamp"

Last Updated: 2025-01-27
Author: BrandBloom Backend Team
"""

import json
import shutil
import re
from pathlib import Path
from typing import Dict, Any, Optional
from datetime import datetime

# Import slugify with fallback
try:
    from slugify import slugify
except ImportError:
    def slugify(text: str, max_length: int = 50, word_boundary: bool = True) -> str:
        """
        Simple slugify implementation as fallback when python-slugify is not available
        """
        # Convert to lowercase and replace spaces with hyphens
        slug = text.lower().strip()
        # Remove or replace special characters
        slug = re.sub(r'[^\w\s-]', '', slug)
        # Replace spaces and multiple hyphens with single hyphen
        slug = re.sub(r'[-\s]+', '-', slug)
        # Remove leading/trailing hyphens
        slug = slug.strip('-')
        # Truncate to max length
        if len(slug) > max_length:
            if word_boundary:
                # Try to break at word boundary
                words = slug.split('-')
                result = []
                current_length = 0
                for word in words:
                    if current_length + len(word) + 1 <= max_length:
                        result.append(word)
                        current_length += len(word) + 1
                    else:
                        break
                slug = '-'.join(result) if result else slug[:max_length]
            else:
                slug = slug[:max_length]
        return slug

from app.core.config import settings
from app.models.analysis_models import (
    BrandAnalysis, CreateAnalysisRequest, UpdateAnalysisRequest
)


class AnalysisManager:
    """Manages analysis lifecycle operations"""
    
    @staticmethod
    def create_analysis(request: CreateAnalysisRequest) -> Dict[str, Any]:
        """
        Create a new brand analysis
        
        Args:
            request: Analysis creation request data
            
        Returns:
            Dict with creation results
        """
        try:
            # Generate analysis ID
            analysis_id = AnalysisManager._create_analysis_id(request.brand_name)
            
            # Create directory structure
            directories = AnalysisManager._ensure_analysis_structure(analysis_id)
            
            # Create analysis data
            analysis_data = {
                "analysis_id": analysis_id,
                "brand_name": request.brand_name,
                "analysis_type": request.analysis_type,
                "user_type": request.user_type,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
                "current_step": 1,
                "progress": {
                    "user_type": True,
                    "analysis_type": True,
                    "analysis_mode": False,
                    "data_upload": False,
                    "data_concatenation": False,
                    "data_summary": False,
                    "brand_selection": False,
                    "filter_selection": False,
                    "eda": False,
                    "expected_signs": False,
                    "model_building": False,
                    "model_results": False,
                    "optimizer": False
                },
                "status": "active"
            }
            
            # Save analysis metadata
            analysis_file = directories["main"] / "analysis.json"
            with open(analysis_file, 'w') as f:
                json.dump(analysis_data, f, indent=2)
            
            return {
                "success": True,
                "analysis_id": analysis_id,
                "analysis": analysis_data,
                "directories_created": len(directories)
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to create analysis: {str(e)}"
            }
    
    @staticmethod
    def get_analysis(analysis_id: str) -> Dict[str, Any]:
        """
        Retrieve analysis by ID
        
        Args:
            analysis_id: Unique analysis identifier
            
        Returns:
            Dict with analysis data
        """
        try:
            analysis_dir = AnalysisManager._get_analysis_dir(analysis_id)
            analysis_file = analysis_dir / "analysis.json"
            
            if not analysis_file.exists():
                return {
                    "success": False,
                    "error": f"Analysis not found: {analysis_id}"
                }
            
            # Load analysis data
            with open(analysis_file, 'r') as f:
                analysis_data = json.load(f)
            
            # Update progress and current step
            from .progress_tracker import ProgressTracker
            analysis_data = ProgressTracker.update_progress_and_step(analysis_data)
            
            return {
                "success": True,
                "analysis": analysis_data
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to retrieve analysis: {str(e)}"
            }
    
    @staticmethod
    def update_analysis(analysis_id: str, updates: UpdateAnalysisRequest) -> Dict[str, Any]:
        """
        Update existing analysis
        
        Args:
            analysis_id: Unique analysis identifier
            updates: Update request data
            
        Returns:
            Dict with update results
        """
        try:
            # Get existing analysis
            result = AnalysisManager.get_analysis(analysis_id)
            if not result["success"]:
                return result
            
            analysis_data = result["analysis"]
            
            # Apply updates
            if updates.brand_name is not None:
                analysis_data["brand_name"] = updates.brand_name
            
            if updates.analysis_type is not None:
                analysis_data["analysis_type"] = updates.analysis_type
            
            if updates.progress is not None:
                analysis_data["progress"].update(updates.progress)
            
            if updates.current_step is not None:
                analysis_data["current_step"] = updates.current_step
            
            if updates.status is not None:
                analysis_data["status"] = updates.status
            
            # Update timestamp
            analysis_data["updated_at"] = datetime.now().isoformat()
            
            # Save updated analysis
            analysis_dir = AnalysisManager._get_analysis_dir(analysis_id)
            analysis_file = analysis_dir / "analysis.json"
            
            with open(analysis_file, 'w') as f:
                json.dump(analysis_data, f, indent=2)
            
            return {
                "success": True,
                "analysis": analysis_data
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to update analysis: {str(e)}"
            }
    
    @staticmethod
    def delete_analysis(analysis_id: str) -> Dict[str, Any]:
        """
        Delete analysis and cleanup files
        
        Args:
            analysis_id: Unique analysis identifier
            
        Returns:
            Dict with deletion results
        """
        try:
            analysis_dir = AnalysisManager._get_analysis_dir(analysis_id)
            
            if not analysis_dir.exists():
                return {
                    "success": False,
                    "error": f"Analysis not found: {analysis_id}"
                }
            
            # Remove analysis directory and all contents
            shutil.rmtree(analysis_dir)
            
            return {
                "success": True,
                "message": f"Analysis {analysis_id} deleted successfully"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to delete analysis: {str(e)}"
            }
    
    @staticmethod
    def _create_analysis_id(brand_name: str) -> str:
        """Create URL-safe analysis ID from brand name (consistent with BrandAnalysisService)"""
        # Use the same sanitization logic as BrandAnalysisService for consistency
        from app.core.config import settings
        return settings._sanitize_brand_name(brand_name)
    
    @staticmethod
    def _get_analysis_dir(analysis_id: str) -> Path:
        """Get analysis directory path"""
        return settings.METADATA_DIR / "analyses" / analysis_id
    
    @staticmethod
    def _ensure_analysis_structure(analysis_id: str) -> Dict[str, Path]:
        """Create analysis directory structure"""
        base_dir = AnalysisManager._get_analysis_dir(analysis_id)
        
        directories = {
            "main": base_dir,
            "states": base_dir / "states",
            "uploads": base_dir / "uploads" / "raw",
            "intermediate": base_dir / "uploads" / "intermediate", 
            "concatenated": base_dir / "uploads" / "concatenated"
        }
        
        # Create all directories
        for dir_path in directories.values():
            dir_path.mkdir(parents=True, exist_ok=True)
        
        return directories
