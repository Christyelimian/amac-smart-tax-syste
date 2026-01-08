@echo off
echo Starting AMAC Payment Server...
cd /d "C:\Users\flood\amac"
node simple_payment_server.js
echo Payment server stopped.
pause