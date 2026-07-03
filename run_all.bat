@echo off
setlocal

set API_PORT=8000
set WEB_PORT=5173
set HOST=127.0.0.1

if not "%1"=="" set API_PORT=%1
if not "%2"=="" set WEB_PORT=%2

echo Starting Climate Vector Rwanda
echo API: http://%HOST%:%API_PORT%
echo Web: http://%HOST%:%WEB_PORT%

start "Climate Vector API" cmd /k "cd /d apps\api && ..\..\.venv\Scripts\uvicorn app.main:app --host %HOST% --port %API_PORT%"
start "Climate Vector Web" cmd /k "cd /d apps\web && set VITE_API_BASE=http://%HOST%:%API_PORT%/api&& npm run dev -- --host %HOST% --port %WEB_PORT%"

echo Open http://%HOST%:%WEB_PORT%
endlocal
