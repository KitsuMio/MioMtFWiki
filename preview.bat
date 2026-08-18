@echo off
setlocal

cd /d "%~dp0"
title MioMtFWiki Preview

echo [1/2] Building documentation...
call npm run docs:build
if errorlevel 1 (
  echo.
  echo Build failed. Review the error output above.
  pause
  exit /b 1
)

echo.
echo [2/2] Starting preview server...
echo Press Ctrl+C to stop the server.
call npm run docs:preview

if errorlevel 1 (
  echo.
  echo Preview server exited with an error.
  pause
  exit /b 1
)

endlocal
