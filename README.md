# BrandBloom Insights

A comprehensive analytics platform for Marketing Mix Modeling and data science workflows.

## 🏗️ Best Practice Project Structure (Updated 2025-01-27)

```
brandbloom-insights/
├── frontend/                # Frontend React application
│   ├── src/                # React source code
│   ├── public/             # Static assets
│   ├── package.json        # Frontend dependencies
│   ├── vite.config.ts      # Build configuration
│   └── [all frontend configs]
├── backend/                # Backend services
│   ├── python/             # Primary Python FastAPI backend
│   │   ├── app/           # Application modules (routes, services, models)
│   │   ├── data/          # UNIFIED data directory (uploads, exports, metadata)
│   │   ├── archive/       # Archived legacy files
│   │   └── main.py        # Single entry point
│   └── nodejs/            # Secondary Node.js backend (read-only operations)
├── docs/                  # All project documentation
│   └── archived/          # Archived historical documentation
└── README.md              # This file
```

## 🚀 Getting Started

### Python Backend (Primary)
```bash
cd backend/python
pip install -r requirements.txt
python main.py
```
*Starts FastAPI server on http://localhost:8000*

### Node.js Backend (Secondary - Read-only operations)
```bash
cd backend/nodejs
npm install
npm start
```
*Starts Express server on http://localhost:3001*

### Frontend Setup  
```bash
cd frontend
npm install
npm run dev
```
*Starts React dev server on http://localhost:5173*

## 📚 Documentation

**Essential Documentation:**
- [docs/CODEBASE_DOCUMENTATION_UPDATE.md](docs/CODEBASE_DOCUMENTATION_UPDATE.md) - Complete codebase changes and updates
- [docs/dataflow.md](docs/dataflow.md) - Data flow and processing workflows
- [docs/INTEGRATION_GUIDE.md](docs/INTEGRATION_GUIDE.md) - System integration guide
- [docs/PYTHON_SETUP.md](docs/PYTHON_SETUP.md) - Python environment setup

**Archived Documentation:** See `docs/archived/` for historical implementation details.

## ✨ Key Features

- **Unified Data Structure**: Single `/data/` directory for all file operations
- **Modular Architecture**: Clean separation of concerns
- **Single Entry Points**: One main.py, one source of truth
- **Best Practices**: No duplicate files, clear directory purposes

## 🔧 Best Practices Implemented

This codebase has been restructured to follow industry best practices:
- ✅ **Frontend/Backend Separation**: Clear `/frontend/` and `/backend/` directories
- ✅ **Single Entry Points**: One `main.py`, organized configurations
- ✅ **Unified Data Structure**: All data operations in `/backend/python/data/`
- ✅ **No Duplicate Files**: Each file has single, clear purpose
- ✅ **Professional Organization**: Follows enterprise project standards
- ✅ **Clean Documentation**: Organized in `/docs/` directory

## 🎯 Data Directory Structure

```
backend/python/data/
├── uploads/          # File upload pipeline
│   ├── raw/         # Original uploaded files
│   ├── intermediate/ # Column-modified files
│   └── concatenated/ # Final merged files
├── exports/          # Analysis outputs
│   ├── results/     # Processing results
│   └── reports/     # Generated reports
└── metadata/         # Analysis state management
    ├── analyses/    # Analysis metadata files
    └── concatenation_states/ # Step-by-step states
```

## 🛠️ Technology Stack

- **Backend**: Python FastAPI, Node.js Express
- **Frontend**: React, TypeScript, Vite
- **UI**: shadcn-ui, Tailwind CSS
- **Data Processing**: Pandas, Excel manipulation
- **Architecture**: Modular, microservices-ready

---

*Last Updated: 2025-01-27 - Major cleanup and restructuring completed*