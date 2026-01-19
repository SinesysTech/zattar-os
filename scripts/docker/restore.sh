#!/bin/bash
set -e

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 [path_to_backup_tar_gz]"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file not found."
    exit 1
fi

# Create a temporary extraction dir
TEMP_DIR=$(mktemp -d)
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

# Find the inner directory (timestamp name)
EXTRACTED_PATH=$(find "$TEMP_DIR" -mindepth 1 -maxdepth 1 -type d | head -n 1)

if [ -z "$EXTRACTED_PATH" ]; then
    # Maybe it was tarred without a directory?
    EXTRACTED_PATH=$TEMP_DIR
fi

echo "Restoring from $EXTRACTED_PATH..."

# 1. Restore Postgres
if [ -f "$EXTRACTED_PATH/postgres_dump.sql.gz" ]; then
    echo "Restoring Postgres..."
    gunzip -c "$EXTRACTED_PATH/postgres_dump.sql.gz" | docker exec -i sinesys_postgres psql -U postgres
fi

# 2. Restore Redis
if [ -f "$EXTRACTED_PATH/redis_dump.rdb" ]; then
    echo "Restoring Redis..."
    echo "Stopping Redis..."
    docker stop sinesys_redis
    echo "Copying dump..."
    docker cp "$EXTRACTED_PATH/redis_dump.rdb" sinesys_redis:/data/dump.rdb
    echo "Starting Redis..."
    docker start sinesys_redis
fi

# Cleanup
rm -rf "$TEMP_DIR"

echo "Restore complete."
