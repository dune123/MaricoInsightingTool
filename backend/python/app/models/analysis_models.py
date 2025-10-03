"""
========================================
BRANDBLOOM INSIGHTS - ANALYSIS MODELS
========================================

Purpose: Data models for brand-based analysis system and workflow management

Description:
This module defines Pydantic models for the new brand-based analysis system.
Each brand gets its own analysis workspace with complete state management.
The models support a 13-step analytics workflow from data upload to model
completion, with progress tracking and state persistence throughout the process.

Key Functions:
- AnalysisStatus: Enumeration for tracking analysis workflow states
- AnalysisProgress: Progress tracking for each workflow step completion
- AnalysisFiles: File management and organization for analysis data
- BrandAnalysis: Main analysis metadata and complete state container
- AnalysisListItem: Simplified analysis information for listing operations
- CreateAnalysisRequest: Request model for creating new brand analysis
- UpdateAnalysisRequest: Request model for updating analysis state
- AnalysisResponse: Standard response wrapper for analysis operations
- AnalysisListResponse: Response model for listing multiple analyses

Model Categories:

1. ANALYSIS STATUS ENUMERATION:
- AnalysisStatus: Defines possible analysis states
  - CREATED: Initial analysis creation
  - IN_PROGRESS: Active analysis workflow
  - COMPLETED: Finished analysis
  - PAUSED: Temporarily halted analysis
  - ERROR: Analysis with errors

2. PROGRESS TRACKING:
- AnalysisProgress: Tracks completion of each workflow step
  - dataUploaded: Data files uploaded status
  - concatenationCompleted: Multi-sheet concatenation status
  - targetVariableSelected: Target variable selection status
  - filtersApplied: Data filtering status
  - brandCategorized: Brand classification status
  - modelBuilt: Model construction status
  - resultsGenerated: Results generation status

3. FILE MANAGEMENT:
- AnalysisFiles: Manages all files associated with analysis
  - originalFileName: Source file names
  - concatenatedFileName: Processed concatenated file
  - uploadedFiles: List of uploaded data files
  - processedFiles: List of processed/derived files

4. MAIN ANALYSIS CONTAINER:
- BrandAnalysis: Complete analysis metadata and state
  - brandName: User-entered brand identifier
  - analysisId: URL-safe unique identifier
  - createdAt: Analysis creation timestamp
  - lastModified: Last update timestamp
  - currentStep: Current workflow step (1-13)
  - status: Current analysis status
  - analysisType: MMM or Fresh Analysis type
  - files: File management container
  - progress: Progress tracking container
  - concatenationState: Concatenation process state
  - filterState: Data filtering state
  - modelState: Model building state

5. REQUEST/RESPONSE MODELS:
- CreateAnalysisRequest: New analysis creation parameters
- UpdateAnalysisRequest: Analysis update parameters
- AnalysisResponse: Standard analysis operation response
- AnalysisListResponse: Multiple analysis listing response

Workflow Steps (1-13):
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

Data Validation Features:
- Pydantic BaseModel inheritance for automatic validation
- Field constraints (min_length, max_length, ge, le)
- Pattern validation for analysis types
- Default value factories for timestamps and collections
- Optional fields for flexible state management
- Enum validation for status values

Dependencies:
- pydantic: For data validation, serialization, and BaseModel functionality
- datetime: For timestamp handling and default value factories
- typing: For type hints, generics, and optional types
- enum: For status enumeration and validation

Used by:
- Analysis routes: For request/response validation
- Analysis services: For business logic and state management
- Metadata services: For analysis persistence and retrieval
- Frontend integration: For workflow state management
- Progress tracking: For workflow step completion monitoring

Workflow Benefits:
- Clear step-by-step progression tracking
- Persistent state across sessions
- Brand isolation and data separation
- Progress visualization for users
- Error recovery and resumption
- Scalable multi-brand support

Last Updated: 2024-12-23
Author: BrandBloom Backend Team
"""

from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
from datetime import datetime
from enum import Enum

class AnalysisStatus(str, Enum):
    """Analysis status enumeration"""
    CREATED = "created"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    PAUSED = "paused"
    ERROR = "error"

class AnalysisProgress(BaseModel):
    """Track analysis completion progress"""
    dataUploaded: bool = False
    concatenationCompleted: bool = False
    targetVariableSelected: bool = False
    filtersApplied: bool = False
    brandCategorized: bool = False
    modelBuilt: bool = False
    resultsGenerated: bool = False

class AnalysisFiles(BaseModel):
    """File management for analysis"""
    originalFileName: Optional[str] = None
    concatenatedFileName: Optional[str] = None
    uploadedFiles: List[str] = Field(default_factory=list)
    processedFiles: List[str] = Field(default_factory=list)

class BrandAnalysis(BaseModel):
    """Main brand analysis metadata"""
    brandName: str = Field(..., description="User-entered brand name")
    analysisId: str = Field(..., description="URL-safe brand identifier")
    createdAt: datetime = Field(default_factory=datetime.now)
    lastModified: datetime = Field(default_factory=datetime.now)
    currentStep: int = Field(default=1, ge=1, le=13)
    status: AnalysisStatus = AnalysisStatus.CREATED
    analysisType: str = Field(default="MMM", description="MMM, Fresh Analysis, or NON_MMM")
    
    # File management
    files: AnalysisFiles = Field(default_factory=AnalysisFiles)
    
    # Progress tracking
    progress: AnalysisProgress = Field(default_factory=AnalysisProgress)
    
    # State data
    concatenationState: Optional[Dict[str, Any]] = None
    filterState: Optional[Dict[str, Any]] = None
    modelState: Optional[Dict[str, Any]] = None

class AnalysisListItem(BaseModel):
    """Simplified analysis info for listing"""
    analysisId: str
    brandName: str
    lastModified: datetime
    currentStep: int
    status: AnalysisStatus
    analysisType: str

class CreateAnalysisRequest(BaseModel):
    """Request to create new analysis"""
    brandName: str = Field(..., min_length=1, max_length=100)
    analysisType: str = Field(default="MMM", pattern="^(MMM|Fresh Analysis|NON_MMM)$")
    forceOverwrite: bool = Field(default=False, description="Force overwrite existing analysis")

class UpdateAnalysisRequest(BaseModel):
    """Request to update analysis"""
    currentStep: Optional[int] = Field(None, ge=1, le=13)
    status: Optional[AnalysisStatus] = None
    concatenationState: Optional[Dict[str, Any]] = None
    filterState: Optional[Dict[str, Any]] = None
    modelState: Optional[Dict[str, Any]] = None
    
class AnalysisResponse(BaseModel):
    """Standard analysis response"""
    success: bool
    message: str
    data: Optional[BrandAnalysis] = None

class AnalysisListResponse(BaseModel):
    """Response for listing analyses"""
    success: bool
    message: str
    data: List[AnalysisListItem] = Field(default_factory=list)
