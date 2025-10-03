"""
========================================
PROGRESS TRACKER - ANALYSIS MODULE
========================================

Purpose: Analysis progress tracking and step calculation

Description:
Handles progress tracking, step calculation, and workflow management
for brand analyses with automatic state detection and validation.

Key Functionality:
- Progress step calculation
- Workflow state validation
- Step completion tracking
- Automatic progress updates

Last Updated: 2024-12-23
Author: BrandBloom Backend Team
"""

from typing import Dict, Any
from pathlib import Path

from app.core.config import settings


class ProgressTracker:
    """Handles analysis progress tracking"""
    
    @staticmethod
    def calculate_current_step(progress: Dict[str, bool]) -> int:
        """
        Calculate current step based on progress
        
        Args:
            progress: Dictionary of step completion status
            
        Returns:
            Current step number (1-13)
        """
        # Define step order
        step_order = [
            "user_type",           # Step 1
            "analysis_type",       # Step 2  
            "analysis_mode",       # Step 3
            "data_upload",         # Step 4
            "data_concatenation",  # Step 5
            "data_summary",        # Step 6
            "brand_selection",     # Step 7
            "filter_selection",    # Step 8
            "eda",                 # Step 9
            "expected_signs",      # Step 10
            "model_building",      # Step 11
            "model_results",       # Step 12
            "optimizer"            # Step 13
        ]
        
        # Find the first incomplete step
        for i, step_key in enumerate(step_order):
            if not progress.get(step_key, False):
                return i + 1  # Steps are 1-indexed
        
        # All steps complete
        return 13
    
    @staticmethod
    def update_progress_and_step(analysis_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update progress and current step based on actual files and state
        
        Args:
            analysis_data: Analysis data dictionary
            
        Returns:
            Updated analysis data with current progress
        """
        analysis_id = analysis_data.get("analysis_id")
        if not analysis_id:
            return analysis_data
        
        # Get current progress
        progress = analysis_data.get("progress", {})
        
        # Auto-detect file-based progress
        progress = ProgressTracker._detect_file_progress(analysis_id, progress)
        
        # Calculate current step
        current_step = ProgressTracker.calculate_current_step(progress)
        
        # Update analysis data
        analysis_data["progress"] = progress
        analysis_data["current_step"] = current_step
        
        return analysis_data
    
    @staticmethod
    def mark_step_complete(analysis_id: str, step_name: str) -> bool:
        """
        Mark a specific step as complete
        
        Args:
            analysis_id: Unique analysis identifier
            step_name: Name of the step to mark complete
            
        Returns:
            Success status
        """
        try:
            from .analysis_manager import AnalysisManager
            
            # Get current analysis
            result = AnalysisManager.get_analysis(analysis_id)
            if not result["success"]:
                return False
            
            analysis_data = result["analysis"]
            
            # Update progress
            if "progress" not in analysis_data:
                analysis_data["progress"] = {}
            
            analysis_data["progress"][step_name] = True
            
            # Recalculate current step
            analysis_data["current_step"] = ProgressTracker.calculate_current_step(
                analysis_data["progress"]
            )
            
            # Save updated analysis
            from app.models.analysis_models import UpdateAnalysisRequest
            update_request = UpdateAnalysisRequest(
                progress=analysis_data["progress"],
                current_step=analysis_data["current_step"]
            )
            
            return AnalysisManager.update_analysis(analysis_id, update_request)["success"]
            
        except Exception as e:
            print(f"❌ Error marking step complete: {e}")
            return False
    
    @staticmethod
    def get_completion_percentage(progress: Dict[str, bool]) -> float:
        """
        Calculate completion percentage
        
        Args:
            progress: Dictionary of step completion status
            
        Returns:
            Completion percentage (0-100)
        """
        total_steps = 13
        completed_steps = sum(1 for completed in progress.values() if completed)
        return round((completed_steps / total_steps) * 100, 1)
    
    @staticmethod
    def get_next_step_name(current_step: int) -> str:
        """
        Get the name of the next step
        
        Args:
            current_step: Current step number
            
        Returns:
            Name of the next step
        """
        step_names = {
            1: "User Type Selection",
            2: "Analysis Type Selection", 
            3: "Analysis Mode Selection",
            4: "Data Upload",
            5: "Data Concatenation",
            6: "Data Summary",
            7: "Brand Selection",
            8: "Filter Selection",
            9: "Exploratory Data Analysis",
            10: "Expected Signs",
            11: "Model Building",
            12: "Model Results",
            13: "Optimizer"
        }
        
        return step_names.get(current_step, "Complete")
    
    @staticmethod
    def _detect_file_progress(analysis_id: str, current_progress: Dict[str, bool]) -> Dict[str, bool]:
        """
        Auto-detect progress based on files and state
        
        Args:
            analysis_id: Unique analysis identifier
            current_progress: Current progress dictionary
            
        Returns:
            Updated progress dictionary
        """
        try:
            from .analysis_manager import AnalysisManager
            
            analysis_dir = AnalysisManager._get_analysis_dir(analysis_id)
            
            # Check for uploaded files
            raw_dir = analysis_dir / "uploads" / "raw"
            if raw_dir.exists() and any(raw_dir.iterdir()):
                current_progress["data_upload"] = True
            
            # Check for concatenated files
            concat_dir = analysis_dir / "uploads" / "concatenated"
            if concat_dir.exists() and any(concat_dir.iterdir()):
                current_progress["data_concatenation"] = True
                current_progress["data_summary"] = True  # Concatenation implies summary
            
            # Check for state files
            states_dir = analysis_dir / "states"
            if states_dir.exists():
                # Check for concatenation state
                concat_states = list(states_dir.glob("*_state.json"))
                if concat_states:
                    current_progress["data_concatenation"] = True
                    current_progress["data_summary"] = True
            
            return current_progress
            
        except Exception as e:
            print(f"❌ Error detecting file progress: {e}")
            return current_progress
