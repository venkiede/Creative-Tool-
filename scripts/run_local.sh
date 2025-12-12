#!/bin/bash
# Start Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

# Start Frontend
cd ../frontend
npm install
npm start &
FRONTEND_PID=$!

# Cleanup
trap "kill $BACKEND_PID $FRONTEND_PID" EXIT

wait
