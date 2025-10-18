#!/bin/bash

echo "=========================================="
echo "Fixing Docker Permission Issues"
echo "=========================================="
echo ""

echo "Step 1: Stopping containers..."
docker-compose down

echo ""
echo "Step 2: Removing old volumes (this will delete uploaded files)..."
docker volume rm backend_uploads_data 2>/dev/null || true

echo ""
echo "Step 3: Rebuilding containers with new configuration..."
docker-compose build --no-cache

echo ""
echo "Step 4: Starting containers..."
docker-compose up -d

echo ""
echo "Step 5: Waiting for services to start..."
sleep 5

echo ""
echo "Step 6: Checking backend logs..."
docker-compose logs backend --tail=50

echo ""
echo "=========================================="
echo "Fix Complete!"
echo "=========================================="
echo ""
echo "Test the registration endpoint:"
echo "curl -X POST http://localhost:5000/api/auth/register \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"name\":\"Test User\",\"email\":\"test@example.com\",\"password\":\"test123\",\"role\":\"candidate\"}'"
echo ""
