#!/bin/bash

# Script to build and run the Teaching Tales Docker container with environment variables

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Building Teaching Tales Docker image...${NC}"

# Source the environment file to get the variables
if [ -f .env.docker ]; then
    # Export variables from .env.docker
    export $(grep -v '^#' .env.docker | xargs)
    
    # Build the Docker image with build arguments
    docker build \
        --build-arg NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
        --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
        -t teaching-tales:prod .
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Build successful!${NC}"
        
        # Stop and remove existing container if it exists
        docker stop teaching-tales-prod 2>/dev/null && docker rm teaching-tales-prod 2>/dev/null
        
        echo -e "${YELLOW}Starting Teaching Tales container...${NC}"
        
        # Run the container with the environment file
        docker run -d \
            --name teaching-tales-prod \
            --env-file .env.docker \
            -p 3001:3000 \
            teaching-tales:prod
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}Container started successfully!${NC}"
            echo "Access the application at: http://localhost:3001"
            echo ""
            echo "To view logs: docker logs -f teaching-tales-prod"
            echo "To stop: docker stop teaching-tales-prod"
        else
            echo "Failed to start container"
            exit 1
        fi
    else
        echo "Build failed"
        exit 1
    fi
else
    echo "Error: .env.docker file not found!"
    echo "Please create .env.docker with your Supabase credentials"
    exit 1
fi
