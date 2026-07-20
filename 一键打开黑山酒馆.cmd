@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\startHeishan.ps1"
if errorlevel 1 (
  echo.
  echo Heishan Tavern could not be opened.
  echo Keep this window open and send the error above for diagnosis.
  pause
  exit /b 1
)
exit /b 0
