import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { S3BucketConstruct } from '../service-constructs/s3-bucket-construct';
import { LambdaConstructs } from '../service-constructs/lambda-constructs';
import { EventType } from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { DatabaseConstruct } from '../service-constructs/database-construct';
import { SqsQueueConstruct } from '../service-constructs/sqs-queue-construct';

export class ContextSpaceStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		const vpc = new ec2.Vpc(this, 'ContextSpaceVPC', {
			maxAzs: 2,
			natGateways: 0,
			subnetConfiguration: [
				{
					name: 'public',
					subnetType: ec2.SubnetType.PUBLIC,
					cidrMask: 24,
				},
				{
					name: 'private',
					subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
					cidrMask: 24,
				},
			],
		});

		// Construct Calls
		const s3Bucket = new S3BucketConstruct(this, 'S3BucketConstruct');
		const database = new DatabaseConstruct(this, 'DatabaseConstruct', vpc);
		const lambdas = new LambdaConstructs(this, 'LambdaConstructs', {
			vpc,
			dbCluster: database.cluster,
			dbSecurityGroup: database.securityGroup,
		});
		const sqsQueues = new SqsQueueConstruct(this, 'SqsQueueConstruct');

		// Terminal Output logs
		new cdk.CfnOutput(this, 'DbSecretArn', {
			value: database.cluster.secret!.secretArn,
		});

		new cdk.CfnOutput(this, 'DbEndpoint', {
			value: database.cluster.clusterEndpoint.hostname,
		});

		new cdk.CfnOutput(this, 'DbPort', {
			value: database.cluster.clusterEndpoint.port.toString(),
		});

		// Permission and Event Listeners
		s3Bucket.bucket.grantRead(lambdas.ingestionLambda);
		s3Bucket.bucket.addEventNotification(EventType.OBJECT_CREATED, new s3n.LambdaDestination(lambdas.ingestionLambda), {
			prefix: 'upload/',
		});
	}
}
