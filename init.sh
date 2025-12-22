#!/bin/bash

echo "Welcome to the Firebase Project Initializer!"
echo "This script will guide you through setting up a new Firebase project."
echo ""

# Login to Firebase
echo "First, let's log in to Firebase."
firebase login --no-localhost

# Initialize Firebase
echo ""
echo "Now, let's initialize your Firebase project."
echo "Please follow the prompts from the Firebase CLI."
echo ""
firebase init

# Configure emulator hosts to be accessible outside the container
if [ -f "firebase.json" ]; then
    echo "Configuring emulator hosts in firebase.json to use 0.0.0.0 for external access..."
    # Use jq to add or update the host for every emulator defined.
    # This ensures the emulators are accessible from the host machine.
    if command -v jq &> /dev/null
    then
        # This command robustly modifies the firebase.json file.
        # It iterates over all values in the .emulators object.
        # If a value is an object (i.e., a configurable emulator), it adds/updates its host.
        # If a value is not an object (e.g., "ui": true), it is ignored.
        jq 'if .emulators then .emulators |= map_values(if type == "object" then . + {"host": "0.0.0.0"} else . end) else . end' firebase.json > firebase.json.tmp && mv firebase.json.tmp firebase.json
    else
        echo "Warning: jq is not installed. Cannot configure emulator hosts automatically."
    fi
fi

# Completion message
echo ""
echo "Firebase project initialization is complete!"
echo ""

# Ask about Preact frontend
read -p "Do you want to set up a Preact application for Firebase Hosting? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "Setting up Preact application..."

    # Check for firebase.json
    if [ ! -f "firebase.json" ]; then
        echo "firebase.json not found. Please make sure you initialized Firebase correctly."
        exit 1
    fi

    # Check for hosting configuration
    if ! grep -q '"hosting"' firebase.json; then
        echo "No hosting configuration found in firebase.json. Initializing now..."
        firebase init hosting
    fi

    # Create preact-app directory
    echo "Creating preact-app directory..."
    mkdir preact-app
    cd preact-app

    # Initialize Vite Preact project
    echo "Initializing Vite + Preact project..."
    npm create vite@latest . -- --template preact

    # Install dependencies
    echo "Installing dependencies..."
    npm install

    # Install Firebase SDK and save it to package.json
    echo "Installing Firebase SDK..."
    npm install firebase --save

    # Create vite.config.js
    echo "Creating vite.config.js..."
    cat > vite.config.js <<'EOF'
import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [preact()],
  build: {
    outDir: '../public',
    emptyOutDir: true,
    rollupOptions: {
        output: {
            entryFileNames: 'bundle.js',
            assetFileNames: 'assets/[name].[ext]'
        }
    }
  }
})
EOF

    # Create firebase.js
    echo "Creating src/firebase.js with emulator support..."
    cat > src/firebase.js <<'EOF'
import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getAuth, connectAuthEmulator } from "firebase/auth";

// TODO: Replace with your web app's Firebase configuration.
// You can get this from the Firebase console, or by running:
// firebase apps:sdkconfig WEB <your-app-id>
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const functions = getFunctions(app);
const auth = getAuth(app);

// Connect to emulators if running locally
if (window.location.hostname === "localhost") {
  console.log("Development mode: Connecting to local Firebase emulators...");
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectFunctionsEmulator(functions, 'localhost', 5001);
  connectAuthEmulator(auth, 'http://localhost:9099');
} else {
  console.log("Production mode: Connecting to live Firebase services.");
}

export { app, db, functions, auth };
EOF

    # Import firebase.js into main.jsx
    echo "Importing firebase.js into src/main.jsx..."
    echo "import './firebase.js';" | cat - src/main.jsx > temp && mv temp src/main.jsx

    echo "Preact application setup complete!"
    echo "You can run 'npm run dev' in the 'preact-app' directory to start the dev server."
    echo "Run 'npm run build' to build your app for production."
    cd ..
fi

echo ""
echo "Generating helper scripts (build.sh, run.sh, run-vite.sh, deploy.sh)..."

# Create build.sh
cat > build.sh <<'EOF'
#!/bin/bash
# This script builds the frontend application.
echo "Building Preact app..."
if [ -d "preact-app" ]; then
  (cd preact-app && npm install && npm run build)
  echo "Build complete. The output is in the 'public' directory."
else
  echo "preact-app directory not found."
fi
EOF
chmod +x build.sh

# Create run.sh
cat > run.sh <<'EOF'
#!/bin/bash
# This script starts the Firebase emulators.
echo "Starting Firebase emulators..."
firebase emulators:start
EOF
chmod +x run.sh

# Create run-vite.sh
cat > run-vite.sh <<'EOF'
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
EOF
chmod +x run-vite.sh

# Create deploy.sh
cat > deploy.sh <<'EOF'
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
EOF
chmod +x deploy.sh

echo "Helper scripts created successfully."

echo ""
echo "You can now use the Firebase CLI and the generated scripts to manage your project."
echo "For example, run './run.sh' to start the emulators."
echo "Or run './deploy.sh' to deploy your project."
echo ""
echo "Happy coding!"
