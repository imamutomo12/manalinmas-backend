#!/bin/sh

set -e

echo "DATABASE_URL=$DATABASE_URL"
echo "Generating Prisma Client..."
npx prisma generate

echo "Running Prisma Migration..."
npx prisma migrate deploy

# Uncomment jika deployment pertama
# npx prisma db seed

echo "Starting NestJS..."
node dist/src/main.js 