#!/usr/bin/env python3
"""
========================================
BRANDBLOOM INSIGHTS - ROUTE CHECKING UTILITY
========================================

Purpose: Utility script for checking and debugging registered API routes

Description:
This module provides a utility script for checking which routes are actually
registered in the BrandBloom Insights FastAPI application. It's particularly
useful for debugging route registration issues, verifying endpoint availability,
and ensuring proper API structure. The script focuses on RPI routes but also
provides a sample of other registered routes for comparison.

Key Functions:
- check_routes(): Main route checking and debugging function
  - Creates FastAPI application instance using factory pattern
  - Filters and displays all RPI-related routes
  - Shows route paths and HTTP methods
  - Provides sample of other API routes for comparison
  - Reports total count of RPI routes found

Route Checking Features:
- RPI route identification and listing
- HTTP method verification for each route
- Route path validation and display
- Sample route comparison and verification
- Total route count reporting
- Debugging and troubleshooting support

Usage:
- Run directly: python check_routes.py
- Import and use: from check_routes import check_routes
- Debug route registration issues
- Verify API endpoint availability
- Validate route structure and organization

Debugging Benefits:
- Route registration verification
- API structure validation
- Endpoint availability checking
- Route organization confirmation
- Troubleshooting assistance
- Development workflow support

Dependencies:
- app.core.factory: For application creation and route registration
- FastAPI: For route inspection and application structure

Used by:
- Developers: For route debugging and verification
- System administrators: For API structure validation
- QA teams: For endpoint testing and verification
- Documentation: For API structure confirmation

Route Categories Checked:
- RPI routes: Revenue Per Item addition endpoints
- Sample API routes: General API endpoint verification
- Route methods: HTTP method availability
- Route paths: Endpoint path structure

Last Updated: 2024-12-23
Author: BrandBloom Backend Team
"""

from app.core.factory import create_application

def check_routes():
    """
    Check and display all registered routes in the FastAPI application.
    
    This function creates the application instance and analyzes all registered
    routes, with special focus on RPI routes and a sample of other API routes.
    
    Features:
    - RPI route identification and listing
    - HTTP method verification for each route
    - Route path validation and display
    - Sample route comparison and verification
    - Total route count reporting
    """
    app = create_application()
    
    print("All RPI routes in the application:")
    rpi_routes = [route for route in app.routes if hasattr(route, 'path') and 'rpi' in route.path]
    
    for route in rpi_routes:
        methods = getattr(route, 'methods', 'no methods')
        print(f"  {route.path} -> {methods}")
    
    print(f"\nTotal RPI routes: {len(rpi_routes)}")
    
    # Also check a known working route for comparison
    print("\nSample of other routes:")
    other_routes = [route for route in app.routes if hasattr(route, 'path') and route.path.startswith('/api')][:5]
    for route in other_routes:
        methods = getattr(route, 'methods', 'no methods')
        print(f"  {route.path} -> {methods}")

if __name__ == "__main__":
    check_routes()

