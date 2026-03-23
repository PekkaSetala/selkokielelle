#!/bin/bash
set -e

PROJECT_DIR="/var/www/selkokielelle"

echo "==> Navigating to project directory..."
cd "$PROJECT_DIR"

# Record current commit for rollback
CURRENT_COMMIT=$(git rev-parse HEAD)
echo "==> Current commit: $CURRENT_COMMIT"
echo "    To rollback: git checkout $CURRENT_COMMIT && sudo systemctl restart selkokielelle"

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

echo "==> Deploy complete. New commit: $(git rev-parse HEAD)"
