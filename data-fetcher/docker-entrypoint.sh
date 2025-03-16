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
        
        # check if there were other changes than the manually created indexes (which are not supported by Prisma natively)
        if echo "$DIFF_OUTPUT" | grep -qvE '^\[-\] Index'; then
            echo "Non-index changes detected. Running Prisma db push..."
            if ! npm run prisma:push; then
                echo "Prisma db push failed! Exiting..."
                exit 2
            fi
        else
            echo "Only index creations detected. Skipping Prisma db push."
        fi

        echo "Running initialize database indexes (check if already existing and create if not)..."
        if ! node initialize-database-indexes.js; then
            echo "Failed to initialize database indexes! Exiting..."
            exit 3
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

echo "Starting sim-datafetcher application..."
exec "$@"