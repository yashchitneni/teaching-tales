#!/bin/bash

# Update TimeBack API Specification
# This script downloads the latest OpenAPI spec from the running TimeBack server

echo "🔄 Updating TimeBack API specification..."

# Check if TimeBack server is running
if ! curl -s http://localhost:8080/api/auth/info > /dev/null; then
    echo "❌ TimeBack server is not running on localhost:8080"
    echo "   Please start the server first: cd ../timeback-superbuilders && bun run dev"
    exit 1
fi

# Backup current spec
if [ -f "api-spec.json" ]; then
    cp api-spec.json api-spec.json.backup
    echo "📦 Backed up current spec to api-spec.json.backup"
fi

# Download latest spec
echo "📡 Downloading latest spec from http://localhost:8080/openapi.json..."
if curl -s http://localhost:8080/openapi.json > api-spec.json; then
    echo "✅ API specification updated successfully"
    echo "📊 Spec info:"
    echo "   - Source: http://localhost:8080/openapi.json"
    echo "   - Date: $(date)"
    echo "   - Size: $(wc -c < api-spec.json) bytes"
    
    # Extract API info
    if command -v jq &> /dev/null; then
        echo "   - Title: $(jq -r '.info.title' api-spec.json)"
        echo "   - Version: $(jq -r '.info.version' api-spec.json)"
        echo "   - Server: $(jq -r '.servers[0].url' api-spec.json)"
    fi
else
    echo "❌ Failed to download API specification"
    
    # Restore backup if it exists
    if [ -f "api-spec.json.backup" ]; then
        mv api-spec.json.backup api-spec.json
        echo "🔄 Restored previous spec from backup"
    fi
    exit 1
fi

echo "🎉 API specification update complete!"
