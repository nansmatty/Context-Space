import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { S3BucketConstruct } from '../service-constructs/s3-bucket-construct';
import { LambdaConstructs } from '../service-constructs/lambda-constructs';
import { EventType } from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { DatabaseConstruct } from '../service-constructs/database-construct';

export class ContextSpaceStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		const vpc = new ec2.Vpc(this, 'ContextSpaceVPC', {
			maxAzs: 2,
			natGateways: 1,
		});

		// Construct Calls
		const s3Bucket = new S3BucketConstruct(this, 'S3BucketConstruct');
		const database = new DatabaseConstruct(this, 'DatabaseConstruct', vpc);
		const lambdaConstructs = new LambdaConstructs(this, 'LambdaConstructs', {
			vpc,
			dbCluster: database.cluster,
			dbSecurityGroup: database.securityGroup,
		});

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
		s3Bucket.bucket.grantRead(lambdaConstructs.ingestionLambda);
		s3Bucket.bucket.addEventNotification(EventType.OBJECT_CREATED, new s3n.LambdaDestination(lambdaConstructs.ingestionLambda), {
			prefix: 'upload/',
		});
	}
}
