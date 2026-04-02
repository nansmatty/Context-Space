import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const s3 = new S3Client({
	region: process.env.AWS_REGION,
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
	},
});

export const uploadToS3 = async (file: Buffer, key: string) => {
	const params = new PutObjectCommand({
		Bucket: process.env.AWS_S3_BUCKET_NAME!,
		Key: key,
		Body: file,
	});

	await s3.send(params);

	return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};
