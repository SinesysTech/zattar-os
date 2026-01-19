#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Starting Docker Cleanup...${NC}"

# Prune stopped containers
echo "Removing stopped containers..."
docker container prune -f

# Prune unused images (dangling)
echo "Removing unused images..."
docker image prune -f

# Prune unused networks
echo "Removing unused networks..."
docker network prune -f

# Prune unused volumes (Optional - be careful)
# echo "Removing unused volumes..."
# docker volume prune -f

echo -e "${GREEN}Cleanup complete.${NC}"
echo "Disk usage:"
docker system df
