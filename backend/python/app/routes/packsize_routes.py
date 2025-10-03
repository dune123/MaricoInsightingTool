"""
========================================
BRANDBLOOM INSIGHTS - PACK SIZE ANALYSIS ROUTES
========================================

Purpose: API endpoints for pack size ranking, analysis, comparison, and RPI intelligence functionality

Description:
This module provides comprehensive pack size analysis endpoints for the BrandBloom
Insights application. It handles pack size extraction, ranking, comparison,
categorization, and RPI analysis with intelligent pack size intelligence.
The routes support advanced pack size analytics for marketing mix modeling
and revenue per item (RPI) analysis workflows.

Key Functions:
- analyze_pack_sizes(request): Comprehensive pack size analysis endpoint
  - Analyzes multiple column names for pack size information
  - Extracts and categorizes pack sizes automatically
  - Provides ranking, distribution, and insights
  - Returns detailed analysis with statistical information
- extract_pack_size(column_name): Single column pack size extraction
  - Extracts pack size from individual column names
  - Categorizes pack size and provides ranking information
  - Identifies smallest/largest pack size characteristics
  - Returns detailed pack size analysis and metadata
- compare_pack_sizes(request): Pack size comparison endpoint
  - Compares two pack sizes for relative sizing
  - Provides ranking comparison and relationship analysis
  - Determines RPI comparison priority and recommendations
  - Returns comprehensive comparison insights
- get_pack_size_rank(pack_size): Pack size ranking endpoint
  - Returns numeric rank for specific pack size
  - Provides category classification and description
  - Identifies size characteristics (smallest/largest)
  - Returns ranking metadata and insights
- sort_pack_sizes(pack_sizes, reverse): Pack size sorting endpoint
  - Sorts list of pack sizes by ranking order
  - Supports ascending and descending sort orders
  - Provides detailed ranking for each size
  - Returns sorted list with ranking metadata
- get_pack_size_categories(): Category information endpoint
  - Returns all available pack size categories
  - Provides ranking logic and definitions
  - Includes examples and usage information
  - Returns comprehensive category documentation

Pack Size Categories and Ranking:
1. SACHET (Rank 1): Sachets and pouches - smallest size
2. SMALL (Rank 2): Small bottles (150-250ML range)
3. MEDIUM (Rank 3): Medium bottles (251-500ML range)
4. LARGE (Rank 4): Large bottles (501-650ML range)
5. EXTRA_LARGE (Rank 5): Extra large bottles (>650ML)

API Endpoints:
- POST /api/packsize/analyze: Analyze pack sizes from column names
  - Accepts: PackSizeAnalysisRequest with column names
  - Returns: PackSizeRankingResponse with comprehensive analysis
  - Purpose: Multi-column pack size analysis and ranking
- GET /api/packsize/extract/{column_name}: Extract pack size from single column
  - Accepts: column_name (path, URL encoded)
  - Returns: Dict with extracted pack size and analysis
  - Purpose: Single column pack size extraction and categorization
- POST /api/packsize/compare: Compare two pack sizes
  - Accepts: PackSizeComparisonRequest with two sizes
  - Returns: Dict with comparison results and insights
  - Purpose: Pack size comparison and RPI priority analysis
- GET /api/packsize/rank/{pack_size}: Get pack size ranking
  - Accepts: pack_size (path)
  - Returns: Dict with ranking information and metadata
  - Purpose: Pack size ranking and categorization
- GET /api/packsize/sort: Sort pack sizes by ranking
  - Accepts: pack_sizes (query parameter list), reverse (query parameter)
  - Returns: Dict with sorted pack sizes and ranking details
  - Purpose: Pack size list sorting and organization
- GET /api/packsize/categories: Get pack size categories
  - Accepts: No parameters
  - Returns: Dict with category definitions and examples
  - Purpose: Pack size category documentation and reference

Pack Size Intelligence Features:
- Automatic pack size extraction from column names
- Intelligent categorization and ranking system
- RPI comparison priority determination
- Pack size relationship analysis
- Statistical distribution and insights
- Category-based classification system

RPI Analysis Integration:
- Pack size comparison priority scoring
- Intelligent RPI analysis recommendations
- Size difference impact assessment
- Comparison strategy optimization
- Revenue analysis prioritization

Data Processing Capabilities:
- Multi-column batch analysis
- Intelligent pack size recognition
- Ranking and categorization automation
- Statistical distribution analysis
- Comparison and relationship mapping
- Sort and organization utilities

Error Handling:
- Comprehensive HTTP status code usage
- Detailed error messages for debugging
- Input validation and sanitization
- Graceful error recovery and reporting
- Exception handling and logging

Dependencies:
- FastAPI: For routing, request handling, and HTTP responses
- ExcelService: For pack size analysis and ranking
- PackSizeRanker: For pack size ranking and categorization
- PackSizeRPIAnalyzer: For RPI analysis and priority determination
- packsize_utils: For utility functions and helpers
- pydantic: For request/response model validation

Used by:
- Marketing mix modeling: For pack size analysis and insights
- RPI analysis workflows: For revenue per item optimization
- Data processing pipelines: For column analysis and categorization
- Business intelligence: For pack size performance analysis
- Analytics dashboards: For pack size visualization and reporting
- Revenue optimization: For pack size strategy development

Pack Size Analysis Benefits:
- Automated pack size recognition and categorization
- Intelligent ranking and comparison capabilities
- RPI analysis optimization and prioritization
- Statistical insights and distribution analysis
- Scalable multi-column analysis support
- Comprehensive pack size intelligence

Processing Flow:
1. Request validation and parameter processing
2. Pack size extraction and recognition
3. Categorization and ranking analysis
4. Comparison and relationship mapping
5. RPI priority determination
6. Result generation and response formatting

Business Intelligence Features:
- Pack size performance analysis
- Revenue optimization insights
- Market positioning analysis
- Competitive pack size intelligence
- RPI strategy development
- Pack size portfolio optimization

Helper Functions:
- _get_priority_description(priority): RPI priority description generation
- _get_rank_description(rank): Pack size rank description generation

Last Updated: 2024-12-23
Author: BrandBloom Insights Team
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from app.services.excel_service import ExcelService
from app.utils.packsize_utils import (
    PackSizeRanker, 
    PackSizeRPIAnalyzer, 
    extract_pack_size_from_column,
    rank_pack_sizes,
    is_smaller_pack_size
)

router = APIRouter(prefix="/api/packsize", tags=["Pack Size Analysis"])


class PackSizeAnalysisRequest(BaseModel):
    """Request model for pack size analysis"""
    column_names: List[str]
    include_insights: bool = True


class PackSizeComparisonRequest(BaseModel):
    """Request model for pack size comparison"""
    size1: str
    size2: str


class PackSizeRankingResponse(BaseModel):
    """Response model for pack size ranking analysis"""
    total_columns: int
    columns_with_pack_size: int
    pack_size_details: List[Dict[str, Any]]
    unique_pack_sizes: List[str]
    size_distribution: Dict[str, int]
    ranking_order: str
    error: Optional[str] = None


@router.post("/analyze", response_model=PackSizeRankingResponse)
async def analyze_pack_sizes(request: PackSizeAnalysisRequest):
    """
    Analyze pack sizes from a list of column names and return ranking information.
    
    This endpoint extracts pack sizes from column names, categorizes them,
    and provides comprehensive ranking and distribution analysis.
    
    Args:
        request: PackSizeAnalysisRequest containing column names to analyze
        
    Returns:
        PackSizeRankingResponse with detailed pack size analysis
        
    Example:
        POST /api/packsize/analyze
        {
            "column_names": [
                "Price per ml X-Men Sachet",
                "Price per ml X-Men 150-250ML", 
                "Price per ml Clear Men >650ML"
            ],
            "include_insights": true
        }
    """
    try:
        if not request.column_names:
            raise HTTPException(status_code=400, detail="Column names list cannot be empty")
        
        # Use the Excel service method for comprehensive analysis
        analysis_result = ExcelService.get_pack_size_rankings(request.column_names)
        
        return PackSizeRankingResponse(**analysis_result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing pack sizes: {str(e)}")


@router.get("/extract/{column_name}")
async def extract_pack_size(column_name: str):
    """
    Extract pack size from a single column name.
    
    Args:
        column_name: Column name to extract pack size from
        
    Returns:
        Dictionary with extracted pack size and analysis
        
    Example:
        GET /api/packsize/extract/Price%20per%20ml%20X-Men%20Sachet
    """
    try:
        pack_size = extract_pack_size_from_column(column_name)
        
        if pack_size:
            pack_info = PackSizeRanker.get_pack_size_info(column_name)
            return {
                "column_name": column_name,
                "extracted_pack_size": pack_size,
                "category": pack_info['category'].name,
                "rank": pack_info['rank'],
                "is_smallest": pack_info['is_smallest'],
                "is_largest": pack_info['is_largest'],
                "success": True
            }
        else:
            return {
                "column_name": column_name,
                "extracted_pack_size": None,
                "category": "UNKNOWN",
                "rank": 99,
                "is_smallest": False,
                "is_largest": False,
                "success": False,
                "message": "No pack size found in column name"
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error extracting pack size: {str(e)}")


@router.post("/compare")
async def compare_pack_sizes(request: PackSizeComparisonRequest):
    """
    Compare two pack sizes and return comparison result.
    
    Args:
        request: PackSizeComparisonRequest with two pack sizes to compare
        
    Returns:
        Dictionary with comparison results and insights
        
    Example:
        POST /api/packsize/compare
        {
            "size1": "Sachet",
            "size2": "150-250ML"
        }
    """
    try:
        comparison_result = PackSizeRanker.compare_pack_sizes(request.size1, request.size2)
        
        # Get detailed info for both sizes
        size1_rank = PackSizeRanker.get_pack_size_rank(request.size1)
        size2_rank = PackSizeRanker.get_pack_size_rank(request.size2)
        
        # Generate human-readable comparison
        if comparison_result < 0:
            relationship = f"{request.size1} is smaller than {request.size2}"
        elif comparison_result > 0:
            relationship = f"{request.size1} is larger than {request.size2}"
        else:
            relationship = f"{request.size1} is the same size as {request.size2}"
        
        # Get RPI comparison priority
        rpi_priority = PackSizeRPIAnalyzer.get_rpi_comparison_priority(request.size1, request.size2)
        
        return {
            "size1": request.size1,
            "size2": request.size2,
            "size1_rank": size1_rank,
            "size2_rank": size2_rank,
            "comparison_result": comparison_result,
            "relationship": relationship,
            "rpi_comparison_priority": rpi_priority,
            "priority_description": _get_priority_description(rpi_priority),
            "should_compare_in_rpi": PackSizeRPIAnalyzer.should_compare_pack_sizes(request.size1, request.size2)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error comparing pack sizes: {str(e)}")


@router.get("/rank/{pack_size}")
async def get_pack_size_rank(pack_size: str):
    """
    Get the numeric rank of a specific pack size.
    
    Args:
        pack_size: Pack size string to rank
        
    Returns:
        Dictionary with ranking information
        
    Example:
        GET /api/packsize/rank/Sachet
    """
    try:
        rank = PackSizeRanker.get_pack_size_rank(pack_size)
        category = PackSizeRanker.categorize_pack_size(pack_size)
        
        return {
            "pack_size": pack_size,
            "rank": rank,
            "category": category.name,
            "is_smallest": rank == 1,
            "is_largest": rank == 5,
            "description": _get_rank_description(rank)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error ranking pack size: {str(e)}")


@router.get("/sort")
async def sort_pack_sizes(
    pack_sizes: List[str] = Query(..., description="List of pack sizes to sort"),
    reverse: bool = Query(False, description="Sort in descending order (largest first)")
):
    """
    Sort a list of pack sizes by their ranking.
    
    Args:
        pack_sizes: List of pack size strings to sort
        reverse: If True, sort from largest to smallest
        
    Returns:
        Dictionary with sorted pack sizes and ranking details
        
    Example:
        GET /api/packsize/sort?pack_sizes=Sachet&pack_sizes=500ML&pack_sizes=150ML&reverse=false
    """
    try:
        if not pack_sizes:
            raise HTTPException(status_code=400, detail="Pack sizes list cannot be empty")
        
        sorted_sizes = PackSizeRanker.sort_pack_sizes(pack_sizes, reverse=reverse)
        
        # Get detailed ranking for each size
        size_details = []
        for size in sorted_sizes:
            rank = PackSizeRanker.get_pack_size_rank(size)
            category = PackSizeRanker.categorize_pack_size(size)
            size_details.append({
                "pack_size": size,
                "rank": rank,
                "category": category.name
            })
        
        return {
            "original_sizes": pack_sizes,
            "sorted_sizes": sorted_sizes,
            "reverse_order": reverse,
            "size_details": size_details,
            "sorting_order": "Largest to Smallest" if reverse else "Smallest to Largest"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error sorting pack sizes: {str(e)}")


@router.get("/categories")
async def get_pack_size_categories():
    """
    Get all available pack size categories and their definitions.
    
    Returns:
        Dictionary with pack size category information
    """
    try:
        return {
            "categories": {
                "SACHET": {
                    "rank": 1,
                    "description": "Sachets and pouches - smallest size",
                    "examples": ["Sachet", "Pouch"]
                },
                "SMALL": {
                    "rank": 2, 
                    "description": "Small bottles (150-250ML range)",
                    "examples": ["150ML", "200ML", "250ML", "150-250ML"]
                },
                "MEDIUM": {
                    "rank": 3,
                    "description": "Medium bottles (251-500ML range)", 
                    "examples": ["300ML", "400ML", "500ML", "251-500ML"]
                },
                "LARGE": {
                    "rank": 4,
                    "description": "Large bottles (501-650ML range)",
                    "examples": ["600ML", "650ML", "501-650ML"]
                },
                "EXTRA_LARGE": {
                    "rank": 5,
                    "description": "Extra large bottles (>650ML)",
                    "examples": ["700ML", "1000ML", "1L", ">650ML"]
                }
            },
            "ranking_logic": "Numeric ranking where 1 = smallest, 5 = largest",
            "usage": "Used for intelligent RPI analysis and pack size comparisons"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting categories: {str(e)}")


def _get_priority_description(priority: int) -> str:
    """Get human-readable description for RPI comparison priority."""
    if priority >= 10:
        return "Highest priority - Adjacent pack sizes"
    elif priority >= 8:
        return "High priority - Close pack sizes"
    elif priority >= 6:
        return "Medium priority - Moderate size difference"
    else:
        return "Lower priority - Significant size difference"


def _get_rank_description(rank: int) -> str:
    """Get human-readable description for pack size rank."""
    descriptions = {
        1: "Smallest pack size (Sachet/Pouch)",
        2: "Small pack size (150-250ML)",
        3: "Medium pack size (251-500ML)",
        4: "Large pack size (501-650ML)",
        5: "Largest pack size (>650ML)",
        99: "Unknown or unrecognized pack size"
    }
    return descriptions.get(rank, f"Rank {rank} pack size")

