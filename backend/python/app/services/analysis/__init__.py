"""
========================================
ANALYSIS SERVICES MODULE - BACKEND
========================================

Purpose: Modular analysis management services

Description:
This module provides a collection of specialized analysis management services,
each focused on a specific aspect of brand analysis operations. This modular 
approach improves maintainability, testability, and code organization.

Modules:
- analysis_manager: Core analysis lifecycle management
- progress_tracker: Progress tracking and step calculation
- analysis_lister: Analysis listing and discovery

Usage:
    from app.services.analysis import AnalysisManager, ProgressTracker, AnalysisLister
    
    # Use modular services
    result = AnalysisManager.create_analysis(request)
    progress = ProgressTracker.calculate_current_step(progress_dict)
    analyses = AnalysisLister.list_analyses(sort_by="created_at")

Last Updated: 2024-12-23
Author: BrandBloom Backend Team
"""

from .analysis_manager import AnalysisManager
from .progress_tracker import ProgressTracker
from .analysis_lister import AnalysisLister

__all__ = [
    'AnalysisManager',
    'ProgressTracker',
    'AnalysisLister'
]
