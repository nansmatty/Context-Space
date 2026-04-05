import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as path from 'path';

export class LambdaConstructs extends Construct {
	public readonly ingestionLambda: NodejsFunction;

	constructor(scope: Construct, id: string) {
		super(scope, id);

		this.ingestionLambda = new NodejsFunction(this, 'IngestionLambda', {
			runtime: Runtime.NODEJS_22_X,
			entry: path.join(__dirname, '..', '..', '..', 'lambdas', 'src', 'ingestion-handler', 'index.ts'),
			handler: 'handler',
		});
	}
}
