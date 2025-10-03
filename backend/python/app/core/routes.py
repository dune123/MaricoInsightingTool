"""
========================================
BRANDBLOOM INSIGHTS - ROUTE REGISTRATION
========================================

Purpose: Centralized route registration and organization for FastAPI application

Description:
This module handles the registration of all route modules for the BrandBloom
Insights application. It provides a clean interface for including routers
from different modules with proper tags and organization. The module acts as
a central hub that brings together all API endpoints from various functional
areas into a single, well-organized API structure.

Key Functions:
- configure_routes(app): Main function that registers all route modules
  - Imports all route modules from app.routes package
  - Registers each router with appropriate API tags for documentation
  - Organizes endpoints by functional area for better API organization
  - Ensures consistent route registration across the application

Route Modules Registered:
- Health Routes: System health checks and status endpoints
- File Routes: File upload, download, and management operations
- Excel Routes: Excel file processing and manipulation
- Data Routes: Data filtering, analysis, and export operations
- Metadata Routes: Analysis metadata and state management
- Analysis Routes: Core analysis and processing endpoints
- Pack Size Routes: Pack size analysis and processing
- RPI Addition Routes: RPI (Revenue Per Item) addition operations
- Non-MMM Routes: Non-MMM analysis workflow and data processing

API Organization Benefits:
- Clear separation of concerns by functional area
- Consistent tagging for API documentation
- Easy navigation in interactive API docs
- Modular route management
- Scalable architecture for adding new features

Dependencies:
- FastAPI: For router registration and application configuration
- All route modules: From app.routes package for endpoint definitions

Used by:
- Application factory: For router configuration during app creation
- Main application: For setting up the complete API structure
- Development environment: For organizing API documentation

Route Structure:
- /health/* - System health and status endpoints
- /files/* - File management and upload operations
- /excel/* - Excel processing and manipulation
- /data/* - Data operations and analysis
- /metadata/* - Metadata management and state tracking
- /analysis/* - Core analysis operations
- /packsize/* - Pack size analysis features
- /rpi-addition/* - RPI addition functionality
- /nonmmm/* - Non-MMM analysis workflow and data processing

Last Updated: 2024-12-23
Author: BrandBloom Backend Team
"""

from fastapi import FastAPI

# Import route modules
from app.routes.health_routes import router as health_router
from app.routes.file_routes import router as file_router
from app.routes.excel_routes import router as excel_router
from app.routes.data_routes import router as data_router
from app.routes.metadata_routes import router as metadata_router
from app.routes.analysis_routes import router as analysis_router
from app.routes.packsize_routes import router as packsize_router
from app.routes.rpi_addition_routes import router as rpi_addition_router
from app.routes.nonmmm_routes import router as nonmmm_router
from app.routes.powerpoint_routes import router as powerpoint_router

def configure_routes(app: FastAPI) -> None:
    """
    Register all route modules with the FastAPI application
    
    Args:
        app: FastAPI application instance
    """
    # Register route modules with appropriate tags
    app.include_router(health_router, tags=["Health"])
    app.include_router(file_router, tags=["Files"])
    app.include_router(excel_router, tags=["Excel"])
    app.include_router(data_router, tags=["Data"])
    app.include_router(metadata_router, tags=["Metadata"])
    app.include_router(analysis_router, tags=["Analysis"])
    app.include_router(packsize_router, tags=["Pack Size Analysis"])
    app.include_router(rpi_addition_router, tags=["RPI Addition"])
    app.include_router(nonmmm_router, tags=["Non-MMM Analysis"])
    app.include_router(powerpoint_router, tags=["PowerPoint Generation"])
