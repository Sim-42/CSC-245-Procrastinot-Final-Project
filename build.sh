#!/bin/bash
# This script builds the frontend application.
echo "Building Preact app..."
if [ -d "preact-app" ]; then
  (cd preact-app && npm install && npm run build)
  echo "Build complete. The output is in the 'public' directory."
else
  echo "preact-app directory not found."
fi
