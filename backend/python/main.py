"""
========================================
BRANDBLOOM INSIGHTS - MAIN APPLICATION
========================================

Purpose: Main application entry point for BrandBloom Insights backend service

Description:
This is the main entry point for the BrandBloom Insights backend application.
It uses the application factory pattern for maximum modularity and clean architecture.
The file is designed to be minimal while providing all necessary functionality to
start the FastAPI application with proper configuration.

Key Functions:
- create_application(): Instantiates the FastAPI application using factory pattern
- uvicorn.run(): Starts the development server with hot reload capabilities

Configuration:
- HOST: Server host address (from settings)
- PORT: Server port number (from settings)
- RELOAD: Hot reload enabled for development
- reload_dirs: Directories to watch for changes
- log_level: Logging level for the server

Dependencies:
- uvicorn: ASGI server for running FastAPI applications
- app.core.factory: Application factory for creating the FastAPI app
- app.core.config: Configuration settings management

Server Features:
- Hot reload for development
- Configurable host and port
- Info level logging
- Automatic restart on code changes

Last Updated: 2024-12-23
Author: BrandBloom Backend Team
"""

import uvicorn
from app.core.factory import create_application
from app.core.config import settings

# Create application using factory pattern
app = create_application()

# Development server entry point
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.RELOAD,
        reload_dirs=["./"],
        log_level="info"
    )
