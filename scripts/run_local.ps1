# creativeos/scripts/run_local.ps1
$backendProcess = Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd backend; python -m venv venv; .\venv\Scripts\activate; pip install -r requirements.txt; uvicorn app.main:app --reload --port 8000" -PassThru
$frontendProcess = Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd frontend; npm install; npm start" -PassThru

Write-Host "Backend and Frontend started in separate windows."
Write-Host "Press any key to close this launcher (the other windows will remain open)..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
