"""
========================================
BRANDBLOOM INSIGHTS - MODULAR FASTAPI APPLICATION
========================================

Purpose: Lightweight FastAPI application entry point with modular architecture

Description:
This is the main FastAPI application file for BrandBloom Insights, completely refactored
to use a modular architecture. The file now focuses solely on application configuration,
middleware setup, route registration, and server initialization. All business logic,
data processing, and API endpoints have been extracted into focused modules.

Key Functionality:
- FastAPI application initialization and configuration
- CORS middleware setup for frontend integration
- Modular route registration from organized route modules
- Exception handling and error responses
- Application lifecycle event management
- Clean separation of concerns with minimal code

Modular Architecture:
- app/core/config.py: Centralized configuration management
- app/models/: Data models and type definitions
- app/services/: Business logic and service layer
- app/utils/: Utility functions and helpers
- app/routes/: API endpoint route modules

Benefits:
- Single responsibility principle: Each module has one clear purpose
- Maintainability: Easy to locate and modify specific functionality
- Testability: Individual modules can be tested in isolation
- Scalability: New features can be added as separate modules
- Clean code: Main file is now under 100 lines as requested

Dependencies:
- FastAPI for web framework
- uvicorn for ASGI server
- All business logic imported from modular components

Used by:
- Uvicorn server for application hosting
- Frontend React application for API communication
- Development and production deployment environments

Last Updated: 2024-12-23
Author: BrandBloom Backend Team
"""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime

# Import configuration and core components
from app.core.config import settings

# Import route modules
from app.routes.health_routes import router as health_router
from app.routes.file_routes import router as file_router
from app.routes.excel_routes import router as excel_router
from app.routes.data_routes import router as data_router
from app.routes.metadata_routes import router as metadata_router

# Initialize FastAPI application with configuration
app = FastAPI(
    title=settings.API_TITLE,
    description=settings.API_DESCRIPTION,
    version=settings.API_VERSION,
    docs_url=settings.DOCS_URL,
    redoc_url=settings.REDOC_URL
)

# Configure CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=settings.ALLOW_CREDENTIALS,
    allow_methods=settings.ALLOW_METHODS,
    allow_headers=settings.ALLOW_HEADERS,
)

# Register route modules
app.include_router(health_router, tags=["Health"])
app.include_router(file_router, tags=["Files"])
app.include_router(excel_router, tags=["Excel"])
app.include_router(data_router, tags=["Data"])
app.include_router(metadata_router, tags=["Metadata"])

# Global exception handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    """Custom 404 handler"""
    return JSONResponse(
        status_code=404,
        content={
            "error": "Endpoint not found",
            "message": "The requested endpoint was not found",
            "timestamp": datetime.now().isoformat()
        }
    )

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    """Custom 500 handler"""
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": "An unexpected error occurred",
            "timestamp": datetime.now().isoformat()
        }
    )

# Application lifecycle events
@app.on_event("startup")
async def startup_event():
    """Initialize application resources on startup"""
    print("🚀 BrandBloom Insights API starting up...")
    print("📊 Analytics platform ready for data science workflows")
    print(f"📁 Upload directories initialized: {settings.UPLOAD_DIR}")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup resources on shutdown"""
    print("🛑 BrandBloom Insights API shutting down...")

# Development server entry point
if __name__ == "__main__":
    uvicorn.run(
        "main_new:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.RELOAD,
        reload_dirs=["./"],
        log_level="info"
    )
