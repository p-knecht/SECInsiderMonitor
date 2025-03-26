#!/bin/sh
set -e
LOCK_FILE="dblock/prisma-db-push.lock"

if [ -f "$LOCK_FILE" ] && find "$LOCK_FILE" -mmin +60 > /dev/null 2>&1; then # Check if the lock file is older than 60 minutes
    echo " Removing stale lock file to prevent issues..."
    rm -f "$LOCK_FILE"
fi

echo "Waiting for MongoDB to become available..."
attempt_counter=0
until nc -z sim-database 27017; do
    if [ $attempt_counter -eq 6 ]; then
        echo "MongoDB is not available after 1 minute! Exiting..."
        exit 1
    fi
    echo "MongoDB is not available yet. Retrying in 10 seconds..."
    sleep 10
    attempt_counter=$((attempt_counter + 1))
done
echo "MongoDB is ready..."

MAX_ATTEMPTS=5
attempt=0
mkdir -p $(dirname "$LOCK_FILE")

while [ "$attempt" -lt "$MAX_ATTEMPTS" ]; do
    DELAY=$((5 + (RANDOM % 16))) # Random delay between 5 and 20 seconds to prevent race conditions
    echo "Attempt $((attempt+1)) of $MAX_ATTEMPTS - Waiting for $DELAY seconds before running Prisma db push..."
    sleep $DELAY

    # check if the lock file already exists
    if [ ! -f "$LOCK_FILE" ]; then
        touch "$LOCK_FILE"
        trap 'rm -f "$LOCK_FILE"' EXIT

        echo "Checking for Prisma schema differences..."
        DIFF_OUTPUT=$(npx prisma migrate diff --from-schema-datasource=../db-schema/schema.prisma --to-schema-datamodel=../db-schema/schema.prisma --exit-code || true)
        
        # check if schema updates are needed
        if echo "$DIFF_OUTPUT" | grep -q '[\+\-\~]'; then
            echo "Changed db schema detected. Running Prisma db push..."
            if ! npm run prisma:push; then
                echo "Prisma db push failed! Exiting..."
                exit 2
            fi
        else
            echo "No schema changes detected. Skipping Prisma db push."
        fi

        rm -f "$LOCK_FILE"
        break
    else
        echo "Another instance locked database at the moment."
        attempt=$((attempt+1))
    fi
done
if [ -f "$LOCK_FILE" ]; then
    echo "Database schema checks and updates skipped after being locked during $MAX_ATTEMPTS attempts."
fi

echo "Running initialize auth config..."
if ! node initialize-auth-config.js; then
    echo "Failed to initialize auth config! Exiting..."
    exit 4
fi

echo "Creating symlink for config/.env.local to .env.local"
ln -sf /usr/src/app/app-server/config/.env.local /usr/src/app/app-server/.env.local

echo "Starting sim-appserver application..."
exec "$@"
