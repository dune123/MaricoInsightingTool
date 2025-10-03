# Python FastAPI Server Setup

## Overview

This document provides instructions for setting up and running the Python FastAPI backend server for BrandBloom Insights at the project root level.

## Prerequisites

- Python 3.8 or higher
- pip (Python package installer)
- Windows PowerShell or Command Prompt

## Setup Instructions

### 1. Virtual Environment Creation

A virtual environment named `venv` has been created at the project root:

```bash
python -m venv venv
```

### 2. Dependencies

The following dependencies are defined in `requirements.txt`:
- **FastAPI**: Modern web framework for building APIs
- **Uvicorn**: ASGI server for running FastAPI applications
- **Pydantic**: Data validation and settings management
- **Python-multipart**: For handling file uploads
- **Python-jose**: For JWT token handling
- **Passlib & Bcrypt**: For password hashing
- **Python-dotenv**: For environment variable management

### 3. Activation & Installation

#### Option A: Using Batch Scripts (Recommended for Windows)

**Activate virtual environment:**
```bash
activate_venv.bat          # For Command Prompt
# OR
activate_venv.ps1          # For PowerShell
```

**Run the complete server:**
```bash
run_server.bat             # For Command Prompt
# OR  
run_server.ps1             # For PowerShell
```

#### Option B: Manual Commands

**Activate virtual environment:**
```bash
# Windows Command Prompt
venv\\Scripts\\activate.bat

# Windows PowerShell
.\\venv\\Scripts\\Activate.ps1
```

**Install dependencies:**
```bash
pip install -r requirements.txt
```

**Run the server:**
```bash
python main.py
# OR
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## FastAPI Application Structure

### Main Application (`main.py`)

The FastAPI application includes:

#### Core Features
- **CORS Configuration**: Allows frontend integration
- **Health Checks**: Monitoring endpoints
- **Error Handling**: Custom 404/500 handlers
- **Auto-documentation**: Swagger UI and ReDoc

#### Available Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Welcome message and API information |
| `/health` | GET | Health check for monitoring |
| `/api/status` | GET | Detailed API status and system info |
| `/docs` | GET | Interactive API documentation (Swagger UI) |
| `/redoc` | GET | Alternative API documentation (ReDoc) |

#### Example Response (`/`)
```json
{
    "message": "Welcome to BrandBloom Insights API",
    "description": "Analytics platform for Marketing Mix Modeling",
    "version": "1.0.0",
    "timestamp": "2024-12-20T...",
    "docs": "/docs",
    "status": "active"
}
```

## Running the Server

### Development Mode (with auto-reload)
```bash
python main.py
```
or
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Production Mode
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

## Server Access

Once running, the server will be available at:

- **Main API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc Documentation**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## Testing the Server

### PowerShell Test
```powershell
Invoke-WebRequest -Uri "http://localhost:8000/" -UseBasicParsing
```

### Browser Test
Visit http://localhost:8000 in your web browser to see the welcome message.

### API Documentation
Visit http://localhost:8000/docs for interactive API testing interface.

## Integration with Frontend

The FastAPI server is configured with CORS to allow requests from:
- http://localhost:5173 (Vite dev server)
- http://localhost:3000 (Alternative dev server)
- http://127.0.0.1:5173 (Local IP variant)

## File Structure

```
project-root/
├── venv/                          # Virtual environment
├── main.py                        # FastAPI application
├── requirements.txt               # Python dependencies
├── activate_venv.bat             # Windows activation script
├── activate_venv.ps1             # PowerShell activation script
├── run_server.bat                # Windows server runner
├── run_server.ps1                # PowerShell server runner
└── PYTHON_SETUP.md               # This documentation
```

## Environment Configuration

Create a `.env` file for environment-specific settings:
```env
ENVIRONMENT=development
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=true
```

## Troubleshooting

### Virtual Environment Issues
If activation fails, ensure Python is properly installed and accessible from the command line.

### Port Conflicts
If port 8000 is in use, modify the port in `main.py` or use:
```bash
uvicorn main:app --port 8001
```

### CORS Issues
If frontend can't connect, verify the CORS origins in `main.py` match your frontend dev server URL.

### Dependencies
If packages are missing, reinstall with:
```bash
pip install -r requirements.txt --upgrade
```

## Next Steps

1. **Extend API**: Add endpoints for analytics workflow integration
2. **Database Integration**: Connect to data storage solutions
3. **Authentication**: Implement user authentication system
4. **File Processing**: Add endpoints for data upload and processing
5. **Model Services**: Integrate with analytics and ML services

## Monitoring

The application includes health check endpoints for monitoring:
- Basic health: `/health`
- Detailed status: `/api/status`

For production deployment, consider using process managers like systemd, supervisord, or Docker containers.

Last Updated: 2024-12-20