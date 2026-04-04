import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { S3BucketConstruct } from '../service-constructs/s3-bucket-construct';
import { LambdaConstructs } from '../service-constructs/lambda-constructs';
import { EventType } from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';

export class ContextSpaceStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		const s3Bucket = new S3BucketConstruct(this, 'S3BucketConstruct');
		const lambdaConstructs = new LambdaConstructs(this, 'LambdaConstructs');

		s3Bucket.bucket.grantRead(lambdaConstructs.ingestionLambda);

		s3Bucket.bucket.addEventNotification(EventType.OBJECT_CREATED, new s3n.LambdaDestination(lambdaConstructs.ingestionLambda), {
			prefix: 'upload/',
		});
	}
}
