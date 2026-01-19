#!/bin/bash
set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "Checking system health..."

# Check Docker Daemon
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Docker daemon is NOT running.${NC}"
    exit 1
fi

# Check Docker Compose Services (Dev)
if [ -d "docker/dev" ]; then
    echo "Checking Local Dev Services..."
    cd docker/dev
    docker-compose ps
    
    # Check for unhealthy containers
    if docker-compose ps | grep "unhealthy" > /dev/null; then
        echo -e "${RED}Warning: Some containers are unhealthy!${NC}"
        docker-compose ps --filter "health=unhealthy"
    else
        echo -e "${GREEN}All local containers appear healthy or starting.${NC}"
    fi
    cd ../..
fi

# Check Swarm Services (if active)
if docker info | grep -q "Swarm: active"; then
    echo "Checking Swarm Services..."
    docker service ls
fi

# Check Resource Usage
echo "Resource Usage:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"

echo -e "${GREEN}Health check complete.${NC}"
