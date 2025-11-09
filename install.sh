#!/bin/bash

echo "Starting installation process..."

# Install root dependencies
echo "Installing root dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "Error installing root dependencies. Exiting."
    exit 1
fi
echo "Root dependencies installed."

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "Error installing backend dependencies. Exiting."
    exit 1
fi
cd ..
echo "Backend dependencies installed."

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo "Error installing frontend dependencies. Exiting."
    exit 1
fi
cd ..
echo "Frontend dependencies installed."

echo "Installation complete. Please remember to configure your backend/.env file."
echo "You can do this by navigating to the 'backend' directory and running 'cp .env.example .env', then editing the '.env' file."
