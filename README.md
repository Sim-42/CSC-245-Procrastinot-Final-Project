# Firebase Project Environment

This directory contains a Docker-based environment for quickly setting up a new Firebase project. It includes all the necessary tools and scripts to get you started in minutes.
## Prerequisites

Before you begin, ensure you have the following tools installed on your system.

*   **Docker:** You must have Docker installed. Get it from the official [Docker website](https://www.docker.com/get-started).
*   **Git:** You must have Git installed. See the OS-specific instructions below.

### Installing Git

<details>
<summary>Click to expand for OS-specific Git installation instructions</summary>

#### **For Windows:**

1.  Go to the official [Git for Windows download page](https://git-scm.com/download/win).
2.  The installer will automatically download. Run the installer once it's finished.
3.  Follow the on-screen instructions. **Crucially, ensure that "Git Bash" is included in the installation**, as it provides a Linux-like environment that is the recommended way to run the scripts in this project.
4.  Once the installation is complete, you can verify that Git is installed by opening Command Prompt (or Git Bash) and typing:

    ```bash
    git --version
    ```

#### **For macOS:**

1.  The easiest way to install Git is with [Homebrew](https://brew.sh/). If you don't have Homebrew, install it first:
    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    ```
2.  Once Homebrew is installed, install Git:
    ```bash
    brew install git
    ```
3.  Alternatively, you can install Git via the Xcode command line tools:
    ```bash
    xcode-select --install
    ```
4.  Verify the installation:
    ```bash
    git --version
    ```

#### **For Linux (Ubuntu/Debian-based):**

1.  Open a terminal and run:
    ```bash
    sudo apt update
    sudo apt install git
    ```
2.  Verify the installation:
    ```bash
    git --version
    ```

</details>

---

## How to Create Your Own Project from this Template

Follow these steps to get a clean copy of the project files, ready to be used in your own new, independent repository.

1.  **Clone the template repository:**
    This command downloads the files into a new folder named `my-new-firebase-project`.
    ```bash
    git clone https://github.com/edwjonesga/docker-firebase-project-env.git my-new-firebase-project
    ```

2.  **Navigate into the new directory:**
    ```bash
    cd my-new-firebase-project
    ```

3.  **Remove the template's git history:**
    This is a crucial step to disconnect your new project from the template.
    ```bash
    rm -rf .git
    ```

4.  **Initialize a new, empty repository:**
    Now you can start fresh with your own version history.
    ```bash
    git init -b main
    ```

5.  **(Optional) Add your own remote repository:**
    If you have already created a new repository on a platform like GitHub, you can link it now.
    ```bash
    # git remote add origin <your-new-repository-url>
    ```

You now have a fresh project, ready for you to customize and push to your own repository. You can proceed with the setup instructions in the "Getting Started" section below.

---

## Getting Started

Follow the instructions for your operating system to set up your Firebase project.

### For macOS & Linux

These operating systems have native support for the bash scripts (`.sh`) used in this project.

#### 1. Build the Docker Image

First, build the Docker image by running the `build-container.sh` script:

```bash
./build-container.sh
```

This will create a Docker image named `firebase-project-env` with all the necessary dependencies.

#### 2. Start the Docker Container

Next, start the Docker container using the `start-container.sh` script:

```bash
./start-container.sh
```

This will start an interactive shell inside the container. The current directory is mounted as a volume at `/app`, so any changes you make locally will be reflected inside the container, and vice-versa.

#### 3. Initialize Your Firebase Project

Once you are inside the container's shell, run the `init.sh` script to begin the Firebase project setup:

```bash
./init.sh
```

This script will guide you through the Firebase login and initialization process. It will also ask if you want to set up a Preact application for your Firebase Hosting frontend. Follow the on-screen prompts to configure your project.

After the script finishes, it will generate a set of helper scripts in your project's root directory.

---

### For Windows

For the best experience on Windows, we **strongly recommend using Git Bash**, which is included with Git for Windows. This will allow you to run the `.sh` scripts without any changes.

#### Option 1: Recommended (Using Git Bash)

1.  **Open Git Bash:** Right-click in your project folder and select "Git Bash Here".
2.  **Run the scripts:** Follow the same instructions as for macOS & Linux, but execute them inside the Git Bash terminal.
    ```bash
    # In Git Bash
    ./build-container.sh
    ./start-container.sh
    ```
    Once inside the container, you can proceed with `./init.sh`.

#### Option 2: Alternative (Using PowerShell or CMD)

If you prefer to use PowerShell or the classic Command Prompt, you can run the Docker commands directly. However, the `init.sh` script is complex and should still be run with Git Bash.

**1. Build the Docker Image (PowerShell/CMD):**

The `build-container.sh` script just runs a standard Docker command. You can run it directly:

```powershell
# In PowerShell or CMD
docker build -t firebase-project-env -f Dockerfile .
```

**2. Start the Docker Container (PowerShell):**

The `start-container.sh` script uses `$(pwd)`, which needs to be adapted for your shell.

```powershell
# In PowerShell
docker run -it -p 4000:4000 -p 5000:5000 -p 5001:5001 -p 8080:8080 -p 8085:8085 -p 9000:9000 -p 9099:9099 -p 9199:9199 -v "${PWD}:/app" firebase-project-env
```

**3. Start the Docker Container (Command Prompt):**

```cmd
:: In Command Prompt
docker run -it -p 4000:4000 -p 5000:5000 -p 5001:5001 -p 8080:8080 -p 8085:8085 -p 9000:9000 -p 9099:9099 -p 9199:9199 -v "%CD%:/app" firebase-project-env
```

**4. Initialize Your Firebase Project:**

The `init.sh` script is complex and contains Linux-specific commands. It is **highly recommended** to run it from within the container as instructed, or by using Git Bash if you need to run it from the host.

### 4. Generated Helper Scripts

The initialization script creates the following useful scripts in your project directory:

-   `build.sh`: Builds the Preact frontend application. It runs `npm install` and `npm run build` inside the `preact-app` directory.
-   `run.sh`: Starts the local Firebase emulators for testing your backend functions and rules.
-   `run-vite.sh`: A convenience script that starts the Firebase emulators in the background and then starts the Vite development server for your Preact app.
-   `deploy.sh`: Builds the frontend application and then deploys both your hosting and functions to the Firebase project you specify.

### 5. Happy Coding!

After the `init.sh` script is complete, your Firebase project will be set up in the current directory. You can now use the generated helper scripts or the `firebase` CLI directly to manage your project. For example:

- `firebase emulators:start` to start the local emulators.
- `firebase deploy` to deploy your project.

If you created a Preact app, you can `cd preact-app` and use `npm run dev` to start the development server.

Enjoy your new Firebase project environment!
# procrastinot
# procrastinot
# CSC-245-Procrastinot-Final-Project
