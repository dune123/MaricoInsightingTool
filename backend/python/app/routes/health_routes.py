"""
========================================
BRANDBLOOM INSIGHTS - HEALTH ROUTES
========================================

Purpose: Health check, system status, and debugging API endpoints for monitoring and troubleshooting

Description:
This module provides health check and system status endpoints for the BrandBloom
Insights application. It includes basic health checks, detailed system status,
and debugging information for monitoring and troubleshooting. The routes serve
as the foundation for system monitoring, load balancer health checks, and
developer debugging capabilities.

Key Functions:
- root(): Welcome endpoint providing API information and status
  - Returns welcome message and basic API details
  - Includes version, timestamp, and documentation links
  - Serves as the main entry point for API discovery
- health_check(): Basic health check endpoint for monitoring
  - Returns simple health status for load balancers
  - Provides quick service availability verification
  - Used by monitoring systems and health checks
- api_status(): Detailed system status endpoint
  - Returns comprehensive system information
  - Includes environment, version, and feature details
  - Provides detailed status for administrators
- debug_routes(): Route debugging endpoint
  - Lists all available API routes and methods
  - Helps developers understand API structure
  - Provides route information for debugging

API Endpoints:
- GET /: Welcome message and API information
  - Returns: BaseResponse with API details and status
  - Purpose: API discovery and basic information
- GET /health: Basic health check
  - Returns: HealthResponse with health status
  - Purpose: Load balancer and monitoring health checks
- GET /api/status: Detailed system status
  - Returns: StatusResponse with comprehensive system info
  - Purpose: Detailed system status for administrators
- GET /debug/routes: Route debugging information
  - Returns: DebugRoutesResponse with route details
  - Purpose: Developer debugging and API exploration

Response Models:
- BaseResponse: Standard response wrapper with success, message, timestamp
- HealthResponse: Simple health status with service identifier
- StatusResponse: Detailed status with environment and feature information
- DebugRoutesResponse: Route information with total count and details
- RouteInfo: Individual route information (path, methods)

Monitoring Benefits:
- Load balancer health monitoring
- System availability verification
- Performance monitoring integration
- Error detection and alerting
- Service discovery and documentation

Debugging Features:
- Complete route listing and exploration
- HTTP method information for each endpoint
- Route count and structure overview
- Easy API navigation for developers
- Troubleshooting assistance

Dependencies:
- FastAPI: For routing, response models, and API functionality
- datetime: For timestamp generation in responses
- os: For environment variable access
- typing: For type hints and generic types
- app.models.data_models: For response model definitions

Used by:
- Load balancers: For health monitoring and service availability
- System administrators: For status checks and system monitoring
- Developers: For debugging and API exploration
- Monitoring systems: For automated health checks
- Frontend applications: For service status verification

Health Check Flow:
1. Load balancer or monitoring system requests /health
2. Service responds with health status
3. Monitoring system evaluates response
4. Service marked as healthy/unhealthy based on response
5. Load balancer routes traffic accordingly

Status Monitoring Flow:
1. Administrator requests /api/status
2. Service returns comprehensive system information
3. Status includes environment, version, and features
4. Information used for system administration
5. Helps identify configuration and deployment status

Last Updated: 2024-12-23
Author: BrandBloom Backend Team
"""

import os
from datetime import datetime
from typing import Dict, Any
from fastapi import APIRouter
from fastapi.routing import APIRoute

from app.models.data_models import BaseResponse, HealthResponse, StatusResponse, DebugRoutesResponse, RouteInfo

router = APIRouter()

@router.get("/", response_model=BaseResponse)
async def root() -> Dict[str, Any]:
    """
    Welcome endpoint providing API information and status
    
    Returns:
        Dict containing welcome message, API info, and timestamp
    """
    return {
        "success": True,
        "message": "Marico's Insighting Tool Backend API",
        "description": "Analytics platform for Marketing Mix Modeling",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "docs": "/docs",
        "status": "active"
    }

@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """
    Health check endpoint for monitoring and load balancers
    
    Returns:
        HealthResponse with current health status
    """
    return HealthResponse()

@router.get("/api/status", response_model=StatusResponse)
async def api_status() -> StatusResponse:
    """
    Detailed API status endpoint with system information
    
    Returns:
        StatusResponse with detailed status and configuration info
    """
    return StatusResponse(
        environment=os.getenv("ENVIRONMENT", "development"),
        timestamp=datetime.now().isoformat()
    )

@router.get("/debug/routes", response_model=DebugRoutesResponse)
async def debug_routes(app) -> DebugRoutesResponse:
    """
    Debug endpoint to list all available routes
    
    Args:
        app: FastAPI application instance
        
    Returns:
        DebugRoutesResponse with route information
    """
    routes = []
    for route in app.routes:
        if isinstance(route, APIRoute):
            routes.append(RouteInfo(
                path=route.path,
                methods=list(route.methods)
            ))
    
    return DebugRoutesResponse(
        success=True,
        message="Route information retrieved successfully",
        total_routes=len(routes),
        routes=routes
    )
