import { Duration } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as path from 'path';

export class LambdaConstructs extends Construct {
	public readonly ingestionLambda: NodejsFunction;

	constructor(scope: Construct, id: string) {
		super(scope, id);

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
		});
	}
}
