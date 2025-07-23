@echo off
echo Starting FastAPI Backend Server...
echo.
cd BE
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate

echo Installing dependencies...
pip install -r requirements.txt

echo.
echo Starting server at http://localhost:3000
echo API Documentation: http://localhost:3000/docs
echo.
python main.py

pause
