# Use a Node.js base image
FROM node:22-bullseye

# Set the working directory
WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y python3 python3-pip python3-venv openjdk-11-jre jq

# Install Firebase CLI
RUN npm install -g firebase-tools

# Install Vite
RUN npm install -g vite

# Copy the rest of the application code
COPY . .

# Expose the default Vite port
EXPOSE 5173

# Expose the default Firebase emulator ports
EXPOSE 4000 5000 5001 8080 8085 9000 9099 9199 4400 4500 9150

# Set the entrypoint to bash
ENTRYPOINT ["/bin/bash"]
