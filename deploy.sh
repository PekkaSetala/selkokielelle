#!/bin/bash
set -e

PROJECT_DIR="/var/www/selkokielelle"

echo "==> Navigating to project directory..."
cd "$PROJECT_DIR"

echo "==> Pulling latest code from main branch..."
git pull origin main

echo "==> Activating virtual environment..."
source backend/venv/bin/activate

echo "==> Installing/updating Python dependencies..."
pip install -r backend/requirements.txt

echo "==> Restarting backend service..."
sudo systemctl restart selkokielelle

echo "==> Checking service status..."
sudo systemctl status selkokielelle
