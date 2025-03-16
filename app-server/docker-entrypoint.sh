#!/bin/sh
set -e  

echo "Waiting for MongoDB to become available..."
attempt_counter=0
until nc -z sim-database 27017; do
    if [ $attempt_counter -eq 6 ]; then
        echo "MongoDB is not available after 1 minute! Exiting..."
        exit 1
    fi
    echo "MongoDB is not available yet. Retrying in 10 seconds..."
    sleep 10
    attempt_counter=$(($attempt_counter+1))
done
echo "MongoDB is ready..."

echo "Running Prisma db push..."
if ! npm run prisma:push; then
    echo "Prisma db push failed! Exiting..."
    exit 2
fi

echo "Running initialize database indexes..."
if ! npm run initialize-db-indexes; then
    echo "Failed to initialize database indexes! Exiting..."
    exit 3
fi

echo "Running initialize auth token..."
if ! npm run initialize-auth-token; then
    echo "Failed to initialize auth token! Exiting..."
    exit 4
fi


echo "Starting sim-appserver application..."
exec "$@"