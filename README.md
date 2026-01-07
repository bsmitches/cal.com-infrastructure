# Cal.com Infrastructure

AWS CDK infrastructure for Cal.com application database.

## Overview

This project provisions the following AWS resources:
- **VPC** with public, private, and isolated subnets across 2 availability zones
- **RDS PostgreSQL 15.4** database instance (t3.micro)
- **AWS Secrets Manager** secret for database credentials
- **Security Groups** for database access control

## Prerequisites

- Node.js 18+ and npm
- AWS CLI configured with credentials
- AWS CDK CLI installed (`npm install -g aws-cdk`)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Bootstrap CDK (first time only):
```bash
npx cdk bootstrap
```

## Deployment

Deploy the infrastructure:
```bash
npx cdk deploy
```

The deployment will output:
- Database endpoint address
- Database port
- Database name
- Secret ARN and name for credentials
- VPC ID

## Retrieve Database Credentials

After deployment, retrieve the database credentials:

```bash
aws secretsmanager get-secret-value \
  --secret-id calcom-db-credentials \
  --query SecretString \
  --output text | jq -r '.'
```

Or use the helper script:
```bash
npm run get-credentials
```

## Database Connection

Connect to the database using the credentials from Secrets Manager:

```bash
# Get credentials
SECRET=$(aws secretsmanager get-secret-value --secret-id calcom-db-credentials --query SecretString --output text)
USERNAME=$(echo $SECRET | jq -r '.username')
PASSWORD=$(echo $SECRET | jq -r '.password')
ENDPOINT=$(aws cloudformation describe-stacks --stack-name CalComInfrastructureStack --query 'Stacks[0].Outputs[?OutputKey==`DBEndpoint`].OutputValue' --output text)

# Connection string
echo "postgresql://$USERNAME:$PASSWORD@$ENDPOINT:5432/calcom"
```

## Infrastructure Details

### Database Configuration
- **Engine**: PostgreSQL 15.4
- **Instance Type**: t3.micro
- **Storage**: 20GB GP3 (auto-scaling up to 100GB)
- **Backup Retention**: 7 days
- **Multi-AZ**: Disabled (for cost optimization)
- **Public Access**: Disabled (private subnet only)

### Security
- Database is deployed in isolated subnets
- Access restricted to VPC CIDR block
- Credentials stored in AWS Secrets Manager
- Automatic credential rotation supported

## Useful Commands

* `npm run build`   - Compile TypeScript to JavaScript
* `npm run watch`   - Watch for changes and compile
* `npm run test`    - Run Jest unit tests
* `npx cdk deploy`  - Deploy stack to AWS
* `npx cdk diff`    - Compare deployed stack with current state
* `npx cdk synth`   - Emit synthesized CloudFormation template
* `npx cdk destroy` - Remove all resources from AWS

## Cost Considerations

The infrastructure uses cost-optimized settings:
- t3.micro instance (eligible for free tier)
- Single NAT Gateway
- Single AZ deployment
- GP3 storage

Estimated monthly cost: ~$15-25 USD (excluding free tier)

## Clean Up

To remove all resources:
```bash
npx cdk destroy
```

Note: Database snapshots will be retained due to `SNAPSHOT` removal policy.
