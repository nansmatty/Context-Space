import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { Client } from 'pg';

type DbSecret = {
	username: string;
	password: string;
	host: string;
	port: number | string;
	dbname: string;
};

const secretsClient = new SecretsManagerClient({});

async function getDBCredentials() {
	const secretArn = process.env.DB_SECRET_ARN;

	if (!secretArn) throw new Error('Missing DB_SECRET_ARN');

	const command = new GetSecretValueCommand({ SecretId: secretArn });
	const response = await secretsClient.send(command);

	if (!response.SecretString) {
		throw new Error('SecretString not found in Secrets Manager response.');
	}

	const secret = JSON.parse(response.SecretString) as DbSecret;

	if (!secret.username || !secret.password || !secret.host || !secret.port || !secret.dbname) {
		throw new Error('Database connection fields missing in secret');
	}

	return {
		host: secret.host,
		port: Number(secret.port),
		database: secret.dbname,
		user: secret.username,
		password: secret.password,
	};
}

export async function createDbClient() {
	const creds = await getDBCredentials();

	const dbClient = new Client({
		host: creds.host,
		port: creds.port,
		database: creds.database,
		user: creds.user,
		password: creds.password,
		ssl: {
			rejectUnauthorized: false,
		},
	});

	await dbClient.connect();
	return dbClient;
}
