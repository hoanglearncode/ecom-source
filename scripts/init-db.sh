#!/bin/bash
# Script to initialize multiple databases for microservices

set -e

# Default to postgres user if not specified
POSTGRES_USER="${POSTGRES_USER:-postgres}"

# Create databases for each service
databases=(
    "auth_db"
    "product_db"
    "order_db"
    "inventory_db"
    "payment_db"
    "gateway_db"
)

for db in "${databases[@]}"; do
    echo "Creating database: $db"
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
        CREATE DATABASE $db;
        GRANT ALL PRIVILEGES ON DATABASE $db TO $POSTGRES_USER;
EOSQL
done

echo "All databases created successfully!"
