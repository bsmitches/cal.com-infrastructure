#!/bin/bash

echo "Retrieving Cal.com database credentials..."
echo ""

SECRET=$(aws secretsmanager get-secret-value --secret-id calcom-db-credentials --query SecretString --output text 2>/dev/null)

if [ $? -ne 0 ]; then
  echo "Error: Could not retrieve credentials. Make sure the stack is deployed and you have AWS credentials configured."
  exit 1
fi

USERNAME=$(echo $SECRET | jq -r '.username')
PASSWORD=$(echo $SECRET | jq -r '.password')

ENDPOINT=$(aws cloudformation describe-stacks --stack-name CalComInfrastructureStack --query 'Stacks[0].Outputs[?OutputKey==`DBEndpoint`].OutputValue' --output text 2>/dev/null)
PORT=$(aws cloudformation describe-stacks --stack-name CalComInfrastructureStack --query 'Stacks[0].Outputs[?OutputKey==`DBPort`].OutputValue' --output text 2>/dev/null)
DBNAME=$(aws cloudformation describe-stacks --stack-name CalComInfrastructureStack --query 'Stacks[0].Outputs[?OutputKey==`DBName`].OutputValue' --output text 2>/dev/null)

echo "Database Credentials:"
echo "===================="
echo "Username: $USERNAME"
echo "Password: $PASSWORD"
echo ""
echo "Connection Details:"
echo "===================="
echo "Endpoint: $ENDPOINT"
echo "Port: $PORT"
echo "Database: $DBNAME"
echo ""
echo "Connection String:"
echo "===================="
echo "postgresql://$USERNAME:$PASSWORD@$ENDPOINT:$PORT/$DBNAME"
echo ""
echo "Environment Variables:"
echo "===================="
echo "export DATABASE_URL=\"postgresql://$USERNAME:$PASSWORD@$ENDPOINT:$PORT/$DBNAME\""
echo "export DB_HOST=\"$ENDPOINT\""
echo "export DB_PORT=\"$PORT\""
echo "export DB_NAME=\"$DBNAME\""
echo "export DB_USER=\"$USERNAME\""
echo "export DB_PASSWORD=\"$PASSWORD\""
