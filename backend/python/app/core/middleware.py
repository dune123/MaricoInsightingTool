"""
========================================
BRANDBLOOM INSIGHTS - MIDDLEWARE CONFIGURATION
========================================

Purpose: Centralized middleware configuration and CORS setup for FastAPI application

Description:
This module handles all middleware setup for the BrandBloom Insights application.
It provides a clean interface for configuring CORS, authentication, logging,
and other middleware components in a modular and maintainable way. The module
ensures proper request/response processing and security configuration for
frontend integration and API security.

Key Functions:
- configure_middleware(app): Main function that sets up all middleware components
  - Configures CORS middleware for frontend integration
  - Sets up security headers and access control
  - Ensures proper request/response processing
  - Provides clean middleware configuration interface

Middleware Components:
- CORS Middleware: Cross-Origin Resource Sharing configuration
  - allow_origins: List of allowed frontend origins
  - allow_credentials: Support for authentication cookies
  - allow_methods: Allowed HTTP methods (GET, POST, PUT, DELETE)
  - allow_headers: Allowed request headers

CORS Configuration Benefits:
- Enables frontend-backend communication
- Supports multiple development environments
- Allows authentication and session management
- Provides secure cross-origin access
- Configurable for different deployment scenarios

Security Features:
- Origin validation for frontend requests
- Method restriction for API endpoints
- Header validation for request security
- Credential support for authentication

Dependencies:
- FastAPI: For middleware support and application configuration
- CORSMiddleware: For cross-origin request handling
- app.core.config: For CORS and security settings

Used by:
- Application factory: For middleware configuration during app creation
- Main application: For security and CORS setup
- Frontend integration: For cross-origin API access
- Development environment: For local development setup

Middleware Flow:
1. Request arrives at FastAPI application
2. CORS middleware validates origin and headers
3. Request is processed by route handlers
4. Response is processed by middleware stack
5. CORS headers are added to response
6. Response is sent to client

Configuration Sources:
- ALLOWED_ORIGINS: Frontend URLs from settings
- ALLOW_CREDENTIALS: Authentication support flag
- ALLOW_METHODS: HTTP methods from settings
- ALLOW_HEADERS: Request headers from settings

Last Updated: 2024-12-23
Author: BrandBloom Backend Team
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

def configure_middleware(app: FastAPI) -> None:
    """
    Configure all middleware for the FastAPI application
    
    Args:
        app: FastAPI application instance
    """
    # Configure CORS middleware for frontend integration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=settings.ALLOW_CREDENTIALS,
        allow_methods=settings.ALLOW_METHODS,
        allow_headers=settings.ALLOW_HEADERS,
    )
