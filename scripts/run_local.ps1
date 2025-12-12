# run_local.ps1
# Start Backend in new window
Start-Process powershell -ArgumentList "-NoExit -Command cd backend; python -m venv venv; .\venv\Scripts\activate; pip install -r requirements.txt; uvicorn app.main:app --reload --port 8000"

# Start Frontend in new window
Start-Process powershell -ArgumentList "-NoExit -Command cd frontend; npm install; npm start"

Write-Host "Services starting in new windows..."
