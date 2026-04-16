import { Duration } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as path from 'path';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';

interface LambdaConstructsProps {
	vpc: ec2.IVpc;
	dbCluster: rds.DatabaseCluster;
	dbSecurityGroup: ec2.SecurityGroup;
}

export class LambdaConstructs extends Construct {
	public readonly ingestionLambda: NodejsFunction;
	public readonly migrationLambda: NodejsFunction;
	public readonly embeddingsLambda: NodejsFunction;
	public readonly lambdaSecurityGroup: ec2.SecurityGroup;

	constructor(scope: Construct, id: string, props: LambdaConstructsProps) {
		super(scope, id);

		this.lambdaSecurityGroup = new ec2.SecurityGroup(this, 'IngestionLambdaSecurityGroup', {
			vpc: props.vpc,
			allowAllOutbound: true,
			description: 'Security group for ingestion lambda',
		});

		props.dbSecurityGroup.addIngressRule(this.lambdaSecurityGroup, ec2.Port.tcp(5432), 'Allow Lambda to access Aurora PostgreSQL');

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
			memorySize: 512,
		});

		props.dbCluster.secret?.grantRead(this.ingestionLambda);

		this.migrationLambda = new NodejsFunction(this, 'MigrationLambda', {
			runtime: Runtime.NODEJS_22_X,
			entry: path.join(__dirname, '..', '..', '..', 'lambdas', 'src', 'migration-handler', 'index.ts'),
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
			bundling: {
				commandHooks: {
					beforeBundling(inputDir: string, outputDir: string): string[] {
						return [];
					},
					beforeInstall(inputDir: string, outputDir: string): string[] {
						return [];
					},
					afterBundling(inputDir: string, outputDir: string): string[] {
						return [
							`if not exist "${outputDir}\\db\\migrations" mkdir "${outputDir}\\db\\migrations"`,
							`xcopy "${inputDir}\\..\\lambdas\\src\\db\\migrations\\*" "${outputDir}\\db\\migrations\\" /E /I /Y`,
						];
					},
				},
			},
		});

		props.dbCluster.secret?.grantRead(this.migrationLambda);

		this.embeddingsLambda = new NodejsFunction(this, 'EmbeddingsLambda', {
			runtime: Runtime.NODEJS_22_X,
			entry: path.join(__dirname, '..', '..', '..', 'lambdas', 'src', 'embeddings-handler', 'index.ts'),
			handler: 'handler',
			timeout: Duration.seconds(30),
		});
	}
}
