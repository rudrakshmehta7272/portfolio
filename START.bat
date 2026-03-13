@echo off
echo.
echo  Installing dependencies...
call npm install
echo.
echo  Starting your portfolio server...
echo  Open http://localhost:3000 in your browser
echo.
node server.js
pause
