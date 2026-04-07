import { Duration } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as path from 'path';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as rds from 'aws-cdk-lib/aws-rds';

interface LambdaConstructsProps {
	vpc: ec2.IVpc;
	dbCluster: rds.DatabaseCluster;
	dbSecurityGroup: ec2.SecurityGroup;
}

export class LambdaConstructs extends Construct {
	public readonly ingestionLambda: NodejsFunction;
	public readonly lambdaSecurityGroup: ec2.SecurityGroup;

	constructor(scope: Construct, id: string, props: LambdaConstructsProps) {
		super(scope, id);

		this.lambdaSecurityGroup = new ec2.SecurityGroup(this, 'IngestionLambdaSecurityGroup', {
			vpc: props.vpc,
			allowAllOutbound: true,
			description: 'Security group for ingestion lambda',
		});

		// This lambda setup is configured with PDF Parser package.
		// this.ingestionLambda = new NodejsFunction(this, 'IngestionLambda', {
		// 	runtime: Runtime.NODEJS_22_X,
		// 	entry: path.join(__dirname, '..', '..', '..', 'lambdas', 'src', 'ingestion-handler', 'index.ts'),
		// 	handler: 'handler',
		// 	depsLockFilePath: path.join(__dirname, '..', '..', '..', 'lambdas', 'package-lock.json'),
		// 	projectRoot: path.join(__dirname, '..', '..', '..', 'lambdas'),
		// 	timeout: Duration.seconds(30),
		// 	bundling: {
		// 		externalModules: ['@aws-sdk/*', '@smithy/*'],
		// 		nodeModules: ['pdf-parse'],
		// 		forceDockerBundling: true,
		// 		commandHooks: {
		// 			beforeBundling() {
		// 				return [];
		// 			},
		// 			beforeInstall() {
		// 				return [];
		// 			},
		// 			afterBundling(_inputDir: string, outputDir: string) {
		// 				return [`rm -rf ${outputDir}/node_modules/.bin`];
		// 			},
		// 		},
		// 	},
		// });

		// This lambda setup is configured with UnPDF package.
		this.ingestionLambda = new NodejsFunction(this, 'IngestionLambda', {
			runtime: Runtime.NODEJS_22_X,
			entry: path.join(__dirname, '..', '..', '..', 'lambdas', 'src', 'ingestion-handler', 'index.ts'),
			handler: 'handler',
			timeout: Duration.seconds(30),
			vpc: props.vpc,
			securityGroups: [this.lambdaSecurityGroup],
			environment: {
				DB_HOST: props.dbCluster.clusterEndpoint.hostname,
				DB_PORT: props.dbCluster.clusterEndpoint.port.toString(),
				DB_NAME: 'contextspace',
				DB_SECRET_ARN: props.dbCluster.secret!.secretArn,
			},
		});

		props.dbCluster.secret?.grantRead(this.ingestionLambda);
		props.dbSecurityGroup.addIngressRule(this.lambdaSecurityGroup, ec2.Port.tcp(5432), 'Allow Lambda to access Aurora PostgreSQL');
	}
}
