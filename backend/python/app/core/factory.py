"""
========================================
BRANDBLOOM INSIGHTS - APPLICATION FACTORY
========================================

Purpose: Application factory pattern for FastAPI application creation and configuration

Description:
This module implements the application factory pattern for creating and configuring
the BrandBloom Insights FastAPI application. It provides a clean interface for
application creation with all necessary components configured automatically.
The factory pattern ensures clean separation of concerns and makes the application
easily testable and maintainable.

Key Functions:
- create_application(): Main factory function that creates and configures the FastAPI app
  - Initializes FastAPI with title, description, version, and documentation URLs
  - Configures middleware for request/response processing
  - Sets up exception handlers for error management
  - Configures event handlers for startup/shutdown
  - Registers all application routes
  - Returns fully configured FastAPI application instance

Configuration Applied:
- API metadata (title, description, version)
- Documentation endpoints (docs_url, redoc_url)
- Middleware stack configuration
- Exception handling setup
- Event lifecycle management
- Route registration

Dependencies:
- FastAPI: Web framework for building APIs
- app.core.config: Application configuration settings
- app.core.middleware: Middleware configuration functions
- app.core.exceptions: Exception handler configuration
- app.core.events: Event handler configuration
- app.core.routes: Route registration functions

Used by:
- main.py: For application instantiation
- Testing framework: For test application creation
- Development environment: For local server setup

Architecture Benefits:
- Clean separation of application setup
- Modular component integration
- Easy testing and mocking
- Consistent application configuration
- Maintainable code structure

Last Updated: 2024-12-23
Author: BrandBloom Backend Team
"""

from fastapi import FastAPI
from app.core.config import settings
from app.core.middleware import configure_middleware
from app.core.exceptions import configure_exception_handlers
from app.core.events import configure_events
from app.core.routes import configure_routes

def create_application() -> FastAPI:
    """
    Create and configure FastAPI application using factory pattern
    
    Returns:
        FastAPI: Fully configured application instance
    """
    # Initialize FastAPI application with configuration
    app = FastAPI(
        title=settings.API_TITLE,
        description=settings.API_DESCRIPTION,
        version=settings.API_VERSION,
        docs_url=settings.DOCS_URL,
        redoc_url=settings.REDOC_URL
    )
    
    # Configure all application components
    configure_middleware(app)
    configure_exception_handlers(app)
    configure_events(app)
    configure_routes(app)
    
    return app
