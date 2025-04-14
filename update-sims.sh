#!/bin/bash
echo "📥 Pulling latest code from GitHub..."
cd ~/sims || exit
git pull

echo "🔧 Rebuilding sims-custom image..."
docker compose build

echo "♻️ Restarting SIMS stack..."
docker compose up -d

echo "✅ SIMS is updated and running!"
