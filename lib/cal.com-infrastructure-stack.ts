import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { CfnOutput } from 'aws-cdk-lib/core';

export class CalComInfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'CalComVPC', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    const dbSecurityGroup = new ec2.SecurityGroup(this, 'CalComDBSecurityGroup', {
      vpc,
      description: 'Security group for Cal.com RDS PostgreSQL database',
      allowAllOutbound: true,
    });

    dbSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access from within VPC'
    );

    const dbCredentials = new secretsmanager.Secret(this, 'CalComDBCredentials', {
      secretName: 'calcom-db-credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'calcom_admin' }),
        generateStringKey: 'password',
        excludePunctuation: true,
        includeSpace: false,
        passwordLength: 32,
      },
    });

    const dbInstance = new rds.DatabaseInstance(this, 'CalComDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [dbSecurityGroup],
      databaseName: 'calcom',
      credentials: rds.Credentials.fromSecret(dbCredentials),
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      storageType: rds.StorageType.GP3,
      backupRetention: cdk.Duration.days(7),
      deleteAutomatedBackups: true,
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
      deletionProtection: false,
      publiclyAccessible: false,
      multiAz: false,
    });

    new CfnOutput(this, 'DBEndpoint', {
      value: dbInstance.dbInstanceEndpointAddress,
      description: 'Database endpoint address',
      exportName: 'CalComDBEndpoint',
    });

    new CfnOutput(this, 'DBPort', {
      value: dbInstance.dbInstanceEndpointPort,
      description: 'Database port',
      exportName: 'CalComDBPort',
    });

    new CfnOutput(this, 'DBName', {
      value: 'calcom',
      description: 'Database name',
      exportName: 'CalComDBName',
    });

    new CfnOutput(this, 'DBCredentialsSecretArn', {
      value: dbCredentials.secretArn,
      description: 'ARN of the secret containing database credentials',
      exportName: 'CalComDBCredentialsSecretArn',
    });

    new CfnOutput(this, 'DBCredentialsSecretName', {
      value: dbCredentials.secretName,
      description: 'Name of the secret containing database credentials',
      exportName: 'CalComDBCredentialsSecretName',
    });

    new CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: 'CalComVPCId',
    });
  }
}
