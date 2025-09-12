#!/bin/bash

echo "Starting FastAPI Backend Server..."
echo
cd BE
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing dependencies..."
pip3 install -r requirements.txt

echo
echo "Starting server at http://localhost:3000"
echo "API Documentation: http://localhost:3000/docs"
echo
python3 main.py
