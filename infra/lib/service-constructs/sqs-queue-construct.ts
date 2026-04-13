import { Construct } from 'constructs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Duration, RemovalPolicy } from 'aws-cdk-lib';

export class SqsQueueConstruct extends Construct {
	public readonly embeddingsQueue: sqs.Queue;
	public readonly databaseDataQueue: sqs.Queue;

	constructor(scope: Construct, id: string) {
		super(scope, id);

		this.embeddingsQueue = new sqs.Queue(this, 'EmbeddingsQueue', {
			queueName: 'contextspace-embeddings-queue',
			visibilityTimeout: Duration.minutes(2),
			retentionPeriod: Duration.days(7),
			removalPolicy: RemovalPolicy.DESTROY,
			deadLetterQueue: {
				queue: new sqs.Queue(this, 'embeddingsDLQ', {
					retentionPeriod: Duration.days(7),
					removalPolicy: RemovalPolicy.DESTROY,
				}),
				maxReceiveCount: 5,
			},
		});

		this.databaseDataQueue = new sqs.Queue(this, 'DatabaseDataQueue', {
			queueName: 'contextspace-database-data-queue',
			visibilityTimeout: Duration.minutes(2),
			retentionPeriod: Duration.days(7),
			removalPolicy: RemovalPolicy.DESTROY,
			deadLetterQueue: {
				queue: new sqs.Queue(this, 'databaseDataDLQ', {
					retentionPeriod: Duration.days(7),
					removalPolicy: RemovalPolicy.DESTROY,
				}),
				maxReceiveCount: 5,
			},
		});
	}
}
