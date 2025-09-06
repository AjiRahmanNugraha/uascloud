#!/usr/bin/env bash
set -e

# start python model server in background
echo "Starting python model server..."
python3 model_server.py &

# wait a few seconds to allow model server to bind (optional)
sleep 2

echo "Starting node backend..."
node app.js
