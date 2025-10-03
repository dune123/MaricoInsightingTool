"""
========================================
ANALYSIS LISTER - ANALYSIS MODULE
========================================

Purpose: Analysis listing and discovery functionality

Description:
Handles listing and discovery of brand analyses with automatic
progress detection, sorting, and filtering capabilities.

Key Functionality:
- List all available analyses
- Sort analyses by creation date, progress, or brand
- Filter analyses by status or completion
- Automatic progress and state detection

Last Updated: 2024-12-23
Author: BrandBloom Backend Team
"""

import json
from pathlib import Path
from typing import Dict, Any, List
from datetime import datetime

from app.core.config import settings
from app.models.analysis_models import AnalysisListItem, AnalysisStatus


class AnalysisLister:
    """Handles analysis listing operations"""
    
    @staticmethod
    def list_analyses(sort_by: str = "created_at", filter_status: str = None) -> Dict[str, Any]:
        """
        List all available analyses
        
        Args:
            sort_by: Sort criteria ("created_at", "updated_at", "brand_name", "progress")
            filter_status: Filter by status ("active", "completed", "archived")
            
        Returns:
            Dict with analysis list
        """
        try:
            analyses_dir = settings.METADATA_DIR / "analyses"
            
            if not analyses_dir.exists():
                return {
                    "success": True,
                    "analyses": [],
                    "total_count": 0
                }
            
            analyses = []
            
            # Scan all analysis directories
            for analysis_dir in analyses_dir.iterdir():
                if analysis_dir.is_dir():
                    analysis_data = AnalysisLister._load_analysis_info(analysis_dir)
                    if analysis_data:
                        analyses.append(analysis_data)
            
            # Apply status filter
            if filter_status:
                analyses = [a for a in analyses if a.get("status") == filter_status]
            
            # Sort analyses
            analyses = AnalysisLister._sort_analyses(analyses, sort_by)
            
            return {
                "success": True,
                "analyses": analyses,
                "total_count": len(analyses),
                "sorted_by": sort_by,
                "filtered_by": filter_status
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to list analyses: {str(e)}",
                "analyses": [],
                "total_count": 0
            }
    
    @staticmethod
    def get_analysis_summary(analysis_id: str) -> Dict[str, Any]:
        """
        Get summary information for a specific analysis
        
        Args:
            analysis_id: Unique analysis identifier
            
        Returns:
            Dict with analysis summary
        """
        try:
            from .analysis_manager import AnalysisManager
            
            analysis_dir = AnalysisManager._get_analysis_dir(analysis_id)
            
            if not analysis_dir.exists():
                return {
                    "success": False,
                    "error": f"Analysis not found: {analysis_id}"
                }
            
            # Load basic analysis data
            analysis_data = AnalysisLister._load_analysis_info(analysis_dir)
            if not analysis_data:
                return {
                    "success": False,
                    "error": f"Could not load analysis data: {analysis_id}"
                }
            
            # Add file statistics
            file_stats = AnalysisLister._get_file_statistics(analysis_dir)
            analysis_data.update(file_stats)
            
            return {
                "success": True,
                "analysis": analysis_data
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to get analysis summary: {str(e)}"
            }
    
    @staticmethod
    def _load_analysis_info(analysis_dir: Path) -> Dict[str, Any]:
        """
        Load analysis information from directory
        
        Args:
            analysis_dir: Path to analysis directory
            
        Returns:
            Analysis data dictionary or None
        """
        try:
            analysis_file = analysis_dir / "analysis.json"
            
            if not analysis_file.exists():
                return None
            
            # Load analysis data
            with open(analysis_file, 'r') as f:
                analysis_data = json.load(f)
            
            # Update progress and current step
            from .progress_tracker import ProgressTracker
            analysis_data = ProgressTracker.update_progress_and_step(analysis_data)
            
            # Add completion percentage
            progress = analysis_data.get("progress", {})
            analysis_data["completion_percentage"] = ProgressTracker.get_completion_percentage(progress)
            
            # Add next step name
            current_step = analysis_data.get("current_step", 1)
            analysis_data["next_step_name"] = ProgressTracker.get_next_step_name(current_step)
            
            return analysis_data
            
        except Exception as e:
            print(f"❌ Error loading analysis from {analysis_dir}: {e}")
            return None
    
    @staticmethod
    def _sort_analyses(analyses: List[Dict[str, Any]], sort_by: str) -> List[Dict[str, Any]]:
        """
        Sort analyses by specified criteria
        
        Args:
            analyses: List of analysis dictionaries
            sort_by: Sort criteria
            
        Returns:
            Sorted list of analyses
        """
        try:
            if sort_by == "created_at":
                return sorted(analyses, key=lambda x: x.get("created_at", ""), reverse=True)
            elif sort_by == "updated_at":
                return sorted(analyses, key=lambda x: x.get("updated_at", ""), reverse=True)
            elif sort_by == "brand_name":
                return sorted(analyses, key=lambda x: x.get("brand_name", "").lower())
            elif sort_by == "progress":
                return sorted(analyses, key=lambda x: x.get("completion_percentage", 0), reverse=True)
            else:
                # Default to created_at
                return sorted(analyses, key=lambda x: x.get("created_at", ""), reverse=True)
                
        except Exception as e:
            print(f"❌ Error sorting analyses: {e}")
            return analyses
    
    @staticmethod
    def _get_file_statistics(analysis_dir: Path) -> Dict[str, Any]:
        """
        Get file statistics for analysis
        
        Args:
            analysis_dir: Path to analysis directory
            
        Returns:
            Dictionary with file statistics
        """
        stats = {
            "files_uploaded": 0,
            "files_processed": 0,
            "files_concatenated": 0,
            "total_file_size": 0
        }
        
        try:
            # Count raw uploads
            raw_dir = analysis_dir / "uploads" / "raw"
            if raw_dir.exists():
                raw_files = list(raw_dir.glob("*.xlsx")) + list(raw_dir.glob("*.csv"))
                stats["files_uploaded"] = len(raw_files)
                stats["total_file_size"] = sum(f.stat().st_size for f in raw_files if f.exists())
            
            # Count processed files
            intermediate_dir = analysis_dir / "uploads" / "intermediate"
            if intermediate_dir.exists():
                processed_files = list(intermediate_dir.glob("*.xlsx")) + list(intermediate_dir.glob("*.csv"))
                stats["files_processed"] = len(processed_files)
            
            # Count concatenated files
            concat_dir = analysis_dir / "uploads" / "concatenated"
            if concat_dir.exists():
                concat_files = list(concat_dir.glob("*_concatenated.xlsx"))
                stats["files_concatenated"] = len(concat_files)
            
            # Convert file size to MB
            stats["total_file_size_mb"] = round(stats["total_file_size"] / (1024 * 1024), 2)
            
        except Exception as e:
            print(f"❌ Error calculating file statistics: {e}")
        
        return stats
