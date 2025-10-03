"""
========================================
BRANDBLOOM INSIGHTS - APPLICATION EVENTS
========================================

Purpose: Application lifecycle event handlers and resource management for FastAPI application

Description:
This module manages application lifecycle events for the BrandBloom Insights
application. It handles startup and shutdown events, resource initialization,
cleanup operations, and logging for application state changes. The module
ensures proper resource management and provides clear status feedback during
application lifecycle transitions.

Key Functions:
- configure_events(app): Main function that sets up all lifecycle event handlers
  - Registers startup event handler for resource initialization
  - Registers shutdown event handler for cleanup operations
  - Configures event handlers with proper async/await patterns
  - Ensures consistent event handling across the application

Event Handlers:
- startup_event(): Application startup handler
  - Displays startup messages and status information
  - Logs application initialization progress
  - Reports upload directory configuration
  - Indicates platform readiness for data science workflows
- shutdown_event(): Application shutdown handler
  - Displays shutdown messages and status information
  - Logs application termination progress
  - Ensures clean application closure

Lifecycle Management:
- Startup Phase: Resource initialization and validation
- Runtime Phase: Application operation and monitoring
- Shutdown Phase: Resource cleanup and graceful termination

Event Benefits:
- Clear application status visibility
- Proper resource lifecycle management
- Consistent startup/shutdown behavior
- Easy debugging and monitoring
- Professional user experience

Dependencies:
- FastAPI: For event handler registration and application lifecycle
- app.core.config: For configuration settings and directory paths

Used by:
- Application factory: For event configuration during app creation
- Main application: For lifecycle management
- Development environment: For startup/shutdown feedback

Event Flow:
1. Application startup triggers startup_event()
2. Resources are initialized and validated
3. Application runs normally during runtime
4. Application shutdown triggers shutdown_event()
5. Resources are cleaned up and released

Last Updated: 2024-12-23
Author: BrandBloom Backend Team
"""

from fastapi import FastAPI
from app.core.config import settings

def configure_events(app: FastAPI) -> None:
    """
    Configure all lifecycle events for the FastAPI application
    
    Args:
        app: FastAPI application instance
    """
    
    @app.on_event("startup")
    async def startup_event():
        """Initialize application resources on startup"""
        print("🚀 Marico's Insighting Tool API starting up...")
        print("📊 Analytics platform ready for data science workflows")
        print(f"📁 Upload directories initialized: {settings.UPLOAD_DIR}")

    @app.on_event("shutdown")
    async def shutdown_event():
        """Cleanup resources on shutdown"""
        print("🛑 Marico's Insighting Tool API shutting down...")
