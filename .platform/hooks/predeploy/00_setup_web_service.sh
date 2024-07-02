#!/bin/bash

# Ensure the /var/pids directory exists
mkdir -p /var/pids

# Copy the web.service file to the correct location
cp .platform/web.service /etc/systemd/system/web.service

# Reload systemd to recognize the new service file
systemctl daemon-reload

# Enable the web service to start on boot
systemctl enable web.service
