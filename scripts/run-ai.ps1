Write-Host "[DepthWizard] Starting AI Microservice (FastAPI + TensorFlow)..." -ForegroundColor Magenta
$venvPython = "$PSScriptRoot\..\ai-service\.venv\Scripts\python.exe"
if (-not (Test-Path $venvPython)) {
    Write-Warning "Virtual environment not detected at $venvPython. Falling back to system python."
    $venvPython = "python"
}
cd "$PSScriptRoot\..\ai-service"
& $venvPython main.py
