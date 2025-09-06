#!/bin/bash
set -e

echo "Starting Python model server..."
python3 model_server.py &

# Tunggu Python server siap (opsional, 5 detik)
sleep 5

echo "Starting Node.js backend..."
node app.js
