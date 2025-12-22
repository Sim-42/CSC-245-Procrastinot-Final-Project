#!/bin/bash
# This script builds the frontend and deploys to Firebase.

# Prompt for the project to deploy to
read -p "Enter the Firebase project ID to deploy to: " project_id
if [ -z "$project_id" ]; then
  echo "Project ID cannot be empty."
  exit 1
fi

echo "Building the frontend app first..."
./build.sh

echo "Deploying to Firebase project: $project_id"
firebase deploy --only functions,hosting --project $project_id
