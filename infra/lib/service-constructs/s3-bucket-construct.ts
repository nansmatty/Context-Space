import { Bucket, IBucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class S3BucketConstruct extends Construct {
	public readonly bucket: IBucket;

	constructor(scope: Construct, id: string) {
		super(scope, id);

		this.bucket = Bucket.fromBucketName(this, 'IngestionBucket', `${process.env.S3_BUCKET_NAME!}`);
	}
}
