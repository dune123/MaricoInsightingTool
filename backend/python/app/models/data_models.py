"""
========================================
BRANDBLOOM INSIGHTS - DATA MODELS
========================================

Purpose: Centralized data models, schemas, and type definitions for API operations and data processing

Description:
This module defines all data models, schemas, and type definitions used throughout
the BrandBloom Insights application. It provides consistent data structures for
API requests, responses, and internal data processing operations. The models ensure
type safety, data validation, and consistent API contract across all endpoints.

Key Functions:
- Base Models: Foundation response and error models for all endpoints
- File Operation Models: File upload, sheet info, and file processing structures
- Concatenation Models: Multi-sheet Excel concatenation request/response structures
- Column Modification Models: Data quality improvement and column manipulation
- Filtering Models: Data filtering, search, and analysis request/response structures
- Metadata Models: Brand categorization, expected signs, and analysis state persistence
- Health Check Models: System status and health monitoring structures
- RPI Addition Models: Revenue Per Item addition and pack size analysis structures

Model Categories:

1. BASE MODELS:
- BaseResponse: Standard success response with timestamp
- ErrorResponse: Error response with error details and optional information

2. FILE OPERATION MODELS:
- FileUploadResponse: File upload operation results
- SheetInfo: Excel sheet metadata (name, columns, rows, selection status)
- SheetsResponse: Multiple sheet information response

3. CONCATENATION MODELS:
- ConcatenationRequest: Multi-sheet concatenation parameters
- ColumnCategories: Business column categorization (Revenue, Distribution, Pricing, etc.)
- ConcatenationDetails: Process details and metadata
- PriceSheetInfo: Price sheet creation results
- RPISheetInfo: RPI sheet creation results
- ConcatenationResponse: Complete concatenation operation results

4. COLUMN MODIFICATION MODELS:
- ColumnModificationRequest: Column modification parameters
- DataQualityMetrics: Data quality improvement statistics
- ModificationDetails: Modification operation results
- ColumnModificationResponse: Column modification operation response

5. FILTERING MODELS:
- FilterRequest: Data filtering parameters and criteria
- FilterData: Filtered data results with metadata
- FilterResponse: Complete filtering operation response

6. METADATA MODELS:
- BrandCategories: Brand classification (our brand, competitors, halo brands)
- VariableExpectedSign: Expected sign information for variables
- ExpectedSignsMap: Mapping of variables to expected signs
- BrandMetadata: Brand analysis metadata and state
- ConcatenationState: Persistent concatenation state and metadata
- StateResponse: State retrieval and management response

7. HEALTH CHECK MODELS:
- HealthResponse: Basic health status
- StatusResponse: Detailed system status and feature information

8. RPI ADDITION MODELS:
- RPIAdditionRequest: RPI addition operation parameters
- RPIColumnInfo: RPI column processing information
- RPIAdditionResponse: RPI addition operation results

Data Validation Features:
- Pydantic BaseModel inheritance for automatic validation
- Type hints for all fields ensuring type safety
- Field validation with constraints and defaults
- Automatic serialization/deserialization
- ISO format timestamps for all temporal data

Dependencies:
- pydantic: For data validation, serialization, and BaseModel functionality
- typing: For type hints, generics, and optional types
- datetime: For timestamp handling and ISO format conversion

Used by:
- Route modules: For request/response validation and API contract
- Service modules: For data processing and business logic
- Utility modules: For type consistency and data manipulation
- Main application: For API documentation and OpenAPI schema generation
- Frontend integration: For consistent data structure communication

API Contract Benefits:
- Consistent request/response formats across all endpoints
- Automatic data validation and error handling
- Type-safe data processing throughout the application
- Clear API documentation and schema generation
- Easy frontend integration with predictable data structures

Last Updated: 2024-12-23
Author: BrandBloom Backend Team
"""

from typing import Dict, List, Optional, Any, Union
from pydantic import BaseModel, Field
from datetime import datetime

# ========================================
# BASE MODELS
# ========================================

class BaseResponse(BaseModel):
    """Base response model for all API endpoints"""
    success: bool
    message: str
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())

class ErrorResponse(BaseResponse):
    """Error response model"""
    success: bool = False
    error: str
    details: Optional[str] = None

# ========================================
# FILE OPERATION MODELS
# ========================================

class FileUploadResponse(BaseResponse):
    """Response model for file upload operations"""
    data: Optional[Dict[str, Any]] = None

class SheetInfo(BaseModel):
    """Model for Excel sheet information"""
    sheetName: str
    columns: List[str]
    totalRows: int
    totalColumns: int
    isSelected: bool = True

class SheetsResponse(BaseResponse):
    """Response model for sheet information"""
    data: Optional[Dict[str, Any]] = None

# ========================================
# CONCATENATION MODELS
# ========================================

class ConcatenationRequest(BaseModel):
    """Request model for sheet concatenation"""
    originalFileName: str
    selectedSheets: List[str]
    customFileName: str = "concatenated"
    ourBrand: Optional[str] = None

class ColumnCategories(BaseModel):
    """Model for business column categorization"""
    Revenue: List[str] = []
    Distribution: List[str] = []
    Pricing: List[str] = []
    Promotion: List[str] = []
    Media: List[str] = []
    Others: List[str] = []

class ConcatenationDetails(BaseModel):
    """Model for concatenation process details"""
    method: str = "step_by_step_alignment"
    preservedFirstSheetStructure: bool = True
    handledMissingColumns: bool = True
    addedNewColumns: bool = True
    removedEmptyColumns: int = 0
    emptyColumnsRemoved: List[str] = []

class PriceSheetInfo(BaseModel):
    """Model for Price sheet creation information"""
    created: bool
    rowCount: int = 0
    columns: List[str] = []
    uniqueRegions: int = 0
    uniqueMonths: int = 0
    priceColumns: List[str] = []
    message: str = ""

class RPISheetInfo(BaseModel):
    """Model for RPI sheet creation information"""
    created: bool
    rowCount: int = 0
    columns: List[str] = []
    uniqueRegions: int = 0
    uniqueMonths: int = 0
    rpiColumns: List[str] = []
    ourBrand: str = ""
    competitorBrands: List[str] = []
    message: str = ""

class ConcatenationResponse(BaseResponse):
    """Response model for concatenation operations"""
    concatenatedFileName: str
    selectedSheets: List[str]
    totalRows: int
    totalSheets: int
    totalColumns: int
    savedPath: str
    columns: List[str]
    columnCategories: ColumnCategories
    previewData: List[Dict[str, Any]]
    concatenationDetails: ConcatenationDetails
    priceSheet: PriceSheetInfo
    rpiSheet: RPISheetInfo

# ========================================
# COLUMN MODIFICATION MODELS
# ========================================

class ColumnModificationRequest(BaseModel):
    """Request model for column modification"""
    selectedSheets: List[str]

class DataQualityMetrics(BaseModel):
    """Model for data quality improvement metrics"""
    sheetsWithRemovedColumns: int = 0
    totalColumnsRemoved: int = 0
    removedColumnsBySheet: Dict[str, List[str]] = {}

class ModificationDetails(BaseModel):
    """Model for modification operation details"""
    columnsAdded: List[str] = ["PackSize", "Region", "Channel"]
    modifiedSheets: List[str]
    skippedSheets: List[str]

class ColumnModificationResponse(BaseResponse):
    """Response model for column modification operations"""
    data: Optional[Dict[str, Any]] = None

# ========================================
# FILTERING MODELS
# ========================================

class FilterRequest(BaseModel):
    """Request model for data filtering"""
    filename: str
    filters: Dict[str, List[Any]] = {}
    columns: Optional[List[str]] = None
    limit: int = 1000

class FilterData(BaseModel):
    """Model for filtered data response"""
    rows: List[Dict[str, Any]]
    totalRows: int
    originalRows: int
    columns: List[str]
    appliedFilters: Dict[str, List[Any]]
    filterOptions: Dict[str, List[Any]]
    filename: str

class FilterResponse(BaseResponse):
    """Response model for filtering operations"""
    data: FilterData

# ========================================
# METADATA MODELS
# ========================================

class BrandCategories(BaseModel):
    """Model for brand categorization"""
    ourBrand: str
    competitors: List[str]
    haloBrands: List[str] = []

class VariableExpectedSign(BaseModel):
    """Model for expected sign information for a variable"""
    variable: str
    category: str
    expectedSign: str  # '+' or '-'
    color: str  # 'green', 'red', or 'blue'
    reason: str

class ExpectedSignsMap(BaseModel):
    """Model for expected signs mapping"""
    signs: Dict[str, VariableExpectedSign] = {}

class BrandMetadata(BaseModel):
    """Model for brand metadata"""
    targetVariable: str
    ourBrand: str
    allBrands: List[str]
    categories: BrandCategories
    extractedAt: str

class ConcatenationState(BaseModel):
    """Model for concatenation state persistence"""
    originalFileName: str
    concatenatedFileName: str
    selectedSheets: List[str] = []
    targetVariable: Optional[str] = None
    selectedFilters: List[str] = []
    brandMetadata: Optional[BrandMetadata] = None
    previewData: Optional[List[Dict[str, Any]]] = None
    columnCategories: Optional[ColumnCategories] = None
    expectedSigns: Optional[ExpectedSignsMap] = None
    totalRows: int = 0
    processedAt: Optional[str] = None
    savedAt: str = Field(default_factory=lambda: datetime.now().isoformat())
    status: str = "completed"

class StateResponse(BaseResponse):
    """Response model for state operations"""
    data: Optional[ConcatenationState] = None
    stateFileName: Optional[str] = None  # Filename of the saved state file - FIXED (2025-01-27): Added to support frontend state filename extraction
    stateFilePath: Optional[str] = None  # Full path of the saved state file - FIXED (2025-01-27): Added to support frontend state filename extraction

# ========================================
# HEALTH CHECK MODELS
# ========================================

class HealthResponse(BaseModel):
    """Response model for health check"""
    status: str = "healthy"
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
    service: str = "brandbloom-insights-api"

class StatusResponse(BaseResponse):
    """Response model for detailed status"""
    api_name: str = "BrandBloom Insights"
    version: str = "1.0.0"
    status: str = "running"
    python_version: str = "3.x"
    framework: str = "FastAPI"
    server: str = "Uvicorn"
    environment: str = "development"
    features: List[str] = [
        "Analytics Wizard Workflow",
        "Data Upload & Processing",
        "Marketing Mix Modeling", 
        "Statistical Analysis",
        "Optimization Engine",
        "Multi-Sheet Excel Concatenation"
    ]

# ========================================
# RPI ADDITION MODELS
# ========================================

class RPIAdditionRequest(BaseModel):
    """Request model for RPI addition operations"""
    file_path: str
    main_sheet_name: str = "Concatenated_Data_Enhanced"
    rpi_sheet_name: str = "RPI_Data"

class RPIColumnInfo(BaseModel):
    """Model for RPI column information"""
    original_rpi_column: str
    new_column_name: str
    pack_size: str
    pack_size_rank: int
    matches_found: int
    total_rows: int

class RPIAdditionResponse(BaseResponse):
    """Response model for RPI addition operations"""
    main_rows_processed: int
    rpi_columns_added: int
    rpi_columns_info: List[RPIColumnInfo] = []
    enhanced_file_path: str = ""
    pack_size_analysis: Dict[str, Any] = {}

# ========================================
# ROUTE DEBUG MODELS
# ========================================

class RouteInfo(BaseModel):
    """Model for route information"""
    path: str
    methods: List[str]

class DebugRoutesResponse(BaseResponse):
    """Response model for debug routes endpoint"""
    total_routes: int
    routes: List[RouteInfo]
