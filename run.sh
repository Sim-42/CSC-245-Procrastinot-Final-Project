#!/bin/bash
# This script starts the Firebase emulators.
echo "Starting Firebase emulators..."
export FUNCTIONS_DISCOVERY_TIMEOUT=30
firebase emulators:start
