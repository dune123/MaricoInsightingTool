"""
========================================
BRANDBLOOM INSIGHTS - EXCEPTION HANDLERS
========================================

Purpose: Centralized exception handling and error response management for FastAPI application

Description:
This module provides comprehensive exception handling for the BrandBloom Insights
application. It defines custom exception handlers for common HTTP errors and
application-specific exceptions with consistent error response formatting. The
module ensures that all errors are handled gracefully and provide meaningful
feedback to API consumers with proper HTTP status codes and structured responses.

Key Functions:
- configure_exception_handlers(app): Main function that sets up all exception handlers
  - Registers custom 404 Not Found handler
  - Registers custom 500 Internal Server Error handler
  - Ensures consistent error response formatting
  - Provides timestamp tracking for error logging
  - Creates extensible framework for additional exception types

Exception Handlers:
- not_found_handler(request, exc): Custom 404 Not Found handler
  - Handles requests to non-existent endpoints
  - Returns structured JSON response with error details
  - Includes timestamp for error tracking and debugging
  - Provides clear error message for API consumers
- internal_error_handler(request, exc): Custom 500 Internal Server Error handler
  - Handles unexpected server errors and exceptions
  - Returns structured JSON response with error details
  - Includes timestamp for error tracking and debugging
  - Provides generic error message for security

Error Response Structure:
- error: Error type identifier
- message: Human-readable error description
- timestamp: ISO format timestamp for error tracking
- status_code: Appropriate HTTP status code

Exception Handling Benefits:
- Consistent error response format across all endpoints
- Proper HTTP status code usage
- Timestamp tracking for debugging and monitoring
- Professional error handling for API consumers
- Easy extension for additional error types
- Security-conscious error messages

Dependencies:
- FastAPI: For exception handler registration and request handling
- datetime: For timestamp generation in error responses
- JSONResponse: For structured error response formatting

Used by:
- Application factory: For exception handler configuration during app creation
- Main application: For error handling setup
- All route handlers: For consistent error responses
- Development environment: For error debugging and monitoring

Error Flow:
1. Exception occurs in application code
2. FastAPI catches the exception
3. Custom exception handler processes the error
4. Structured error response is generated
5. Response includes error details and timestamp
6. Client receives consistent error format

Last Updated: 2024-12-23
Author: BrandBloom Backend Team
"""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from datetime import datetime

def configure_exception_handlers(app: FastAPI) -> None:
    """
    Configure all exception handlers for the FastAPI application
    
    Args:
        app: FastAPI application instance
    """
    
    @app.exception_handler(404)
    async def not_found_handler(request: Request, exc) -> JSONResponse:
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
    async def internal_error_handler(request: Request, exc) -> JSONResponse:
        """Custom 500 handler"""
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal server error",
                "message": "An unexpected error occurred",
                "timestamp": datetime.now().isoformat()
            }
        )
