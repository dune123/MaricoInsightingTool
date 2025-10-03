#!/bin/bash

# ========================================
# PROJECT B - DASHBOARD STARTUP SCRIPT
# ========================================
# 
# Purpose: Start the PROJECT B dashboard application on port 8082
# 
# Usage: ./start-dashboard.sh
# 
# Description:
# This script starts the PROJECT B dashboard application with proper
# configuration for integration with the main BrandBloom Insights app.
# 
# Last Updated: 2025-01-31
# Author: BrandBloom Frontend Team
#

echo "🚀 Starting PROJECT B - Dashboard Application..."
echo "📍 Port: 8082"
echo "🌐 URL: http://localhost:8082"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Start the development server
echo "🔥 Starting development server..."
npm run dev

