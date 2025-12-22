# Use Node.js 22 on Debian 12 (Bookworm) for better compatibility
FROM node:22-bookworm

# --- Install Java 21 ---
# We copy the Java 21 files directly from the official Eclipse Temurin image
COPY --from=eclipse-temurin:21-jre /opt/java/openjdk /opt/java/openjdk
ENV JAVA_HOME=/opt/java/openjdk
ENV PATH="${JAVA_HOME}/bin:${PATH}"

# Set the working directory
WORKDIR /app

# Install dependencies
# (Removed openjdk-11-jre from here since we added Java 21 above)
RUN apt-get update && apt-get install -y python3 python3-pip python3-venv jq

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