# 🛡️ AegisScan: The All-in-One Web Security Platform
> **Instant, comprehensive web security analysis** to make preventable attacks a thing of the past.

### 🎥 Live Demo
👉 *(Add link here if deployed)*

### 📸 UI Screenshot
*(Insert high-impact GIF or screenshot here)*

---

## 🔥 Why We Built This
* **The Problem:** Web security analysis is **manual**, **slow**, and **requires multiple tools**, leaving many websites vulnerable to preventable attacks.
* **The Solution:** **AegisScan** automates scanning, software detection, and reporting into **one simple web app**—no command-line expertise required.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [Manual Installation](#manual-installation)
  - [Using the Installation Script](#using-the-installation-script)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Usage](#usage)

## Prerequisites

Before you begin, ensure you have the following installed on your system:

-   **Node.js**: Version 18 or higher. You can download it from [nodejs.org](https://nodejs.org/).
-   **npm**: Node Package Manager, which comes bundled with Node.js.
-   **Nmap**: A free and open-source network scanner.
    -   **Installation**: Follow the instructions on the official Nmap website: [nmap.org/download.html](https://nmap.org/download.html)
-   **Nuclei**: A fast and customizable vulnerability scanner.
    -   **Installation**: Follow the instructions on the official Nuclei GitHub page: [github.com/projectdiscovery/nuclei#installation](https://github.com/projectdiscovery/nuclei#installation)
    -   **Update Templates**: After installation, ensure you update the Nuclei templates:
        ```bash
        nuclei -update-templates
        ```
-   **Trivy**: A comprehensive and versatile security scanner.
    -   **Installation**: Follow the instructions on the official Trivy documentation: [aquasecurity.github.io/trivy/v0.50/getting-started/installation/](https://aquasecurity.github.io/trivy/v0.50/getting-started/installation/)
-   **SSL Labs API**: This project utilizes the SSL Labs API for SSL/TLS analysis, which does not require local installation.

## Installation

You can install the project either manually or by using a provided installation script.

### Manual Installation

Follow these steps to set up the project manually:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/security-scanner.git
    cd security-scanner
    ```
    *(Replace `https://github.com/your-username/security-scanner.git` with the actual URL of your repository)*

2.  **Install root dependencies:**
    ```bash
    npm install
    ```

3.  **Install backend dependencies:**
    ```bash
    cd backend
    npm install
    cd ..
    ```

4.  **Install frontend dependencies:**
    ```bash
    cd frontend
    npm install
    cd ..
    ```

### Using the Installation Script

For a quicker setup, you can use the `install.sh` script. This script will automate the dependency installation process.

1.  **Make the script executable:**
    ```bash
    chmod +x install.sh
    ```

2.  **Run the script:**
    ```bash
    ./install.sh
    ```

## Configuration

The backend requires a `.env` file for configuration.

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Create the `.env` file:**
    Copy the example environment file:
    ```bash
    cp .env.example .env
    ```

3.  **Edit the `.env` file:**
    Open `backend/.env` in your preferred text editor and fill in the necessary environment variables. At a minimum, you might want to configure `PORT`, `FRONTEND_URL`, and `NVD_API_KEY` if you plan to use the NVD API.

    ```
    # Server Configuration
    PORT=3001
    NODE_ENV=development

    # Frontend URL
    FRONTEND_URL=http://localhost:3000

    # Logging
    LOG_LEVEL=info

    # Rate Limiting
    RATE_LIMIT_WINDOW_MS=900000
    RATE_LIMIT_MAX_REQUESTS=100

    # API Keys (leave blank if not used)
    NVD_API_KEY=
    ```
    *(Ensure `FRONTEND_URL` matches the URL where your frontend will be running, typically `http://localhost:3000` during development.)*

## Running the Application

Once installed and configured, you can run the application:

1.  **Start the Backend Server:**
    Open a new terminal, navigate to the project root, and then to the `backend` directory:
    ```bash
    cd backend
    npm start
    ```
    The backend server should start on the port specified in your `.env` file (default: `3001`).

2.  **Start the Frontend Development Server:**
    Open another new terminal, navigate to the project root, and then to the `frontend` directory:
    ```bash
    cd frontend
    npm start
    ```
    The frontend application should open in your browser (default: `http://localhost:3000`).

## Usage

(Add specific instructions on how to use your security scanner application here.)
