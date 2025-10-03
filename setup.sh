#!/bin/bash

# ========================================
# BrandBloom Insights - Setup Script
# ========================================
# 
# Purpose: Automated setup for the integrated dashboard platform
# 
# Usage: ./setup.sh
# 
# Description:
# This script sets up the complete BrandBloom Insights platform
# including the main application and PROJECT B dashboard platform.
# 
# Last Updated: 2025-01-31
# Author: BrandBloom Development Team
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
check_nodejs() {
    print_status "Checking Node.js installation..."
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js is installed: $NODE_VERSION"
    else
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
}

# Check if npm is installed
check_npm() {
    print_status "Checking npm installation..."
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_success "npm is installed: $NPM_VERSION"
    else
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
}

# Setup main application
setup_main_app() {
    print_status "Setting up main application..."
    cd frontend
    
    if [ ! -d "node_modules" ]; then
        print_status "Installing main app dependencies..."
        npm install
    else
        print_success "Main app dependencies already installed"
    fi
    
    cd ..
    print_success "Main application setup complete"
}

# Setup PROJECT B dashboard
setup_dashboard() {
    print_status "Setting up PROJECT B dashboard platform..."
    cd "PROJECT B/maricoinsight-Dashboarding"
    
    if [ ! -d "node_modules" ]; then
        print_status "Installing dashboard dependencies..."
        npm install
    else
        print_success "Dashboard dependencies already installed"
    fi
    
    cd ../..
    print_success "Dashboard platform setup complete"
}

# Create startup scripts
create_startup_scripts() {
    print_status "Creating startup scripts..."
    
    # Main app startup script
    cat > start-main.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting BrandBloom Insights Main Application..."
echo "📍 Port: 8081"
echo "🌐 URL: http://localhost:8081"
echo ""
cd frontend && npm run dev
EOF
    
    # Dashboard startup script
    cat > start-dashboard.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting PROJECT B Dashboard Platform..."
echo "📍 Port: 8082"
echo "🌐 URL: http://localhost:8082"
echo ""
cd "PROJECT B/maricoinsight-Dashboarding" && npm run dev
EOF
    
    # Make scripts executable
    chmod +x start-main.sh
    chmod +x start-dashboard.sh
    chmod +x test-integration.js
    
    print_success "Startup scripts created"
}

# Main setup function
main() {
    echo "🚀 BrandBloom Insights - Integrated Dashboard Platform Setup"
    echo "=========================================================="
    echo ""
    
    # Check prerequisites
    check_nodejs
    check_npm
    
    # Setup applications
    setup_main_app
    setup_dashboard
    
    # Create startup scripts
    create_startup_scripts
    
    echo ""
    echo "🎉 Setup Complete!"
    echo ""
    echo "📝 Next Steps:"
    echo "1. Start main application: ./start-main.sh"
    echo "2. Start dashboard platform: ./start-dashboard.sh"
    echo "3. Test integration: node test-integration.js"
    echo "4. Visit http://localhost:8081 to begin"
    echo ""
    echo "📚 Documentation:"
    echo "- Integration Guide: PROJECT B/INTEGRATION_README.md"
    echo "- Frontend Docs: frontend/FRONTEND_CODEBASE_DOCUMENTATION.mdc"
    echo "- Setup Guide: README_INTEGRATED.md"
    echo ""
    print_success "BrandBloom Insights platform is ready! 🚀"
}

# Run main function
main "$@"
