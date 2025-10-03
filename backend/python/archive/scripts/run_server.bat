@echo off
echo Starting BrandBloom Insights API Server...
echo.

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install dependencies if not already installed
echo Installing/updating dependencies...
pip install -r requirements.txt

echo.
echo Starting FastAPI server with Uvicorn...
echo Server will be available at: http://localhost:8000
echo API Documentation: http://localhost:8000/docs
echo.

REM Start the server
python main.py

pause