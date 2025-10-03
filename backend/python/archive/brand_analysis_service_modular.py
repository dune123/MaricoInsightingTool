"""
========================================
BRAND ANALYSIS SERVICE MODULAR - BACKEND
========================================

Purpose: Modular brand analysis service orchestrator

Description:
This is a refactored, modular version of the BrandAnalysisService that uses 
specialized sub-modules for different analysis operations. It maintains the 
same API interface while providing better maintainability and separation of concerns.

Key Features:
- Under 150 lines (vs 432 in original)
- Single responsibility: orchestration only
- Specialized modules for different operations
- Clean separation of concerns
- Maintains backward compatibility

Modules Used:
- AnalysisManager: Core analysis lifecycle operations
- ProgressTracker: Progress tracking and step calculation
- AnalysisLister: Analysis listing and discovery

Last Updated: 2024-12-23
Author: BrandBloom Backend Team
"""

from typing import Dict, Any
from app.services.analysis import AnalysisManager, ProgressTracker, AnalysisLister
from app.models.analysis_models import CreateAnalysisRequest, UpdateAnalysisRequest


class BrandAnalysisServiceModular:
    """Modular brand analysis service with specialized operations"""
    
    @staticmethod
    def create_analysis(request: CreateAnalysisRequest) -> Dict[str, Any]:
        """
        Create a new brand analysis using modular approach
        
        Args:
            request: Analysis creation request data
            
        Returns:
            Dict with creation results
        """
        return AnalysisManager.create_analysis(request)
    
    @staticmethod
    def list_analyses(sort_by: str = "created_at", filter_status: str = None) -> Dict[str, Any]:
        """
        List all available analyses using modular approach
        
        Args:
            sort_by: Sort criteria ("created_at", "updated_at", "brand_name", "progress")
            filter_status: Filter by status ("active", "completed", "archived")
            
        Returns:
            Dict with analysis list
        """
        return AnalysisLister.list_analyses(sort_by, filter_status)
    
    @staticmethod
    def get_analysis(analysis_id: str) -> Dict[str, Any]:
        """
        Retrieve analysis by ID using modular approach
        
        Args:
            analysis_id: Unique analysis identifier
            
        Returns:
            Dict with analysis data
        """
        return AnalysisManager.get_analysis(analysis_id)
    
    @staticmethod
    def update_analysis(analysis_id: str, updates: UpdateAnalysisRequest) -> Dict[str, Any]:
        """
        Update existing analysis using modular approach
        
        Args:
            analysis_id: Unique analysis identifier
            updates: Update request data
            
        Returns:
            Dict with update results
        """
        return AnalysisManager.update_analysis(analysis_id, updates)
    
    @staticmethod
    def delete_analysis(analysis_id: str) -> Dict[str, Any]:
        """
        Delete analysis using modular approach
        
        Args:
            analysis_id: Unique analysis identifier
            
        Returns:
            Dict with deletion results
        """
        return AnalysisManager.delete_analysis(analysis_id)
    
    @staticmethod
    def get_analysis_summary(analysis_id: str) -> Dict[str, Any]:
        """
        Get detailed analysis summary using modular approach
        
        Args:
            analysis_id: Unique analysis identifier
            
        Returns:
            Dict with analysis summary
        """
        return AnalysisLister.get_analysis_summary(analysis_id)
    
    @staticmethod
    def mark_step_complete(analysis_id: str, step_name: str) -> Dict[str, Any]:
        """
        Mark a specific step as complete using modular approach
        
        Args:
            analysis_id: Unique analysis identifier
            step_name: Name of the step to mark complete
            
        Returns:
            Dict with completion results
        """
        success = ProgressTracker.mark_step_complete(analysis_id, step_name)
        
        if success:
            return {
                "success": True,
                "message": f"Step '{step_name}' marked as complete",
                "step_name": step_name
            }
        else:
            return {
                "success": False,
                "error": f"Failed to mark step '{step_name}' as complete"
            }
    
    @staticmethod
    def calculate_progress(analysis_id: str) -> Dict[str, Any]:
        """
        Calculate current progress for analysis using modular approach
        
        Args:
            analysis_id: Unique analysis identifier
            
        Returns:
            Dict with progress information
        """
        try:
            # Get analysis data
            result = AnalysisManager.get_analysis(analysis_id)
            
            if not result["success"]:
                return result
            
            analysis_data = result["analysis"]
            progress = analysis_data.get("progress", {})
            
            # Calculate metrics
            current_step = ProgressTracker.calculate_current_step(progress)
            completion_percentage = ProgressTracker.get_completion_percentage(progress)
            next_step_name = ProgressTracker.get_next_step_name(current_step)
            
            return {
                "success": True,
                "progress": {
                    "current_step": current_step,
                    "completion_percentage": completion_percentage,
                    "next_step_name": next_step_name,
                    "step_details": progress
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to calculate progress: {str(e)}"
            }
