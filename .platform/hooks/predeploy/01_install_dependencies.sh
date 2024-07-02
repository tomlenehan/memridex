#!/bin/bash

LOGFILE="/var/log/deploy.log"
VENV_DIR="/var/app/venv/staging-LQM1lest"

echo "Starting dependency installation..." | sudo tee -a $LOGFILE

# Navigate to backend directory and activate virtual environment
cd /var/app/current/backend
source $VENV_DIR/bin/activate
sudo pip install -r requirements.txt | sudo tee -a $LOGFILE

# Initialize the database
#python ./app/initial_data.py | sudo tee -a $LOGFILE

# Install Node.js and npm
sudo yum install -y nodejs | sudo tee -a $LOGFILE

# Install frontend dependencies
cd /var/app/current/frontend
sudo npm install | sudo tee -a $LOGFILE

# Build the frontend project
NODE_OPTIONS="--max-old-space-size=8192"
sudo mkdir -p /var/app/current/frontend/dist
sudo npm run build | sudo tee -a $LOGFILE

# Move static files to the web server directory
sudo mkdir -p /var/www/frontend/static
sudo cp -r /var/app/current/frontend/dist/* /var/www/frontend/static

# Ensure permissions are correct
sudo chown -R nginx:nginx /var/www/frontend/static
sudo chmod -R 755 /var/www/frontend/static/

echo "Dependency installation completed." | sudo tee -a $LOGFILE
