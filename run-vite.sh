#!/bin/bash
# This script starts the Firebase emulators and the Vite dev server.
echo "Starting Firebase emulators in the background..."
firebase emulators:start --non-interactive &
EMULATOR_PID=$!

if [ -d "preact-app" ]; then
  echo "Starting Vite dev server..."
  (cd preact-app && npm run dev)
else
  echo "preact-app directory not found."
fi

# Kill the emulators when the script exits
kill $EMULATOR_PID
