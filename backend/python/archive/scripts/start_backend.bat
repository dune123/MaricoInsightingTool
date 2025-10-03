@echo off
echo 🚀 Starting BrandBloom Insights Backend...
echo 📁 Activating virtual environment...

call venv\Scripts\activate.bat

echo ✅ Virtual environment activated
echo 🔧 Starting FastAPI server...

cd /d "%~dp0\.."
python main.py

echo 🛑 Server stopped
pause