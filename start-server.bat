@echo off
title MandiX Express + MySQL Backend Server
echo ========================================================
echo Starting MandiX Backend Server (Node.js + Express + MySQL)
echo ========================================================
cd /d "%~dp0server"
node server.js
pause
