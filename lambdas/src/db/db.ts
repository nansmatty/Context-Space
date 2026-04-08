import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { Client } from 'pg';

type DbSecret = {
	username: string;
	password: string;
	engine?: string;
	host?: string;
	port?: number | string;
	dbname?: string;
};

async function getDBCredentials() {
	const secretArn = process.env.DB_SECRET_ARN;
	const host = process.env.DB_HOST;
	const port = process.env.DB_PORT;
	const database = process.env.DB_NAME;

	if (!secretArn) throw new Error('Missing DB_SECRET_ARN');
	if (!host) throw new Error('Missing DB_HOST');
	if (!port) throw new Error('Missing DB_PORT');
	if (!database) throw new Error('Missing DB_NAME');

	const client = new SecretsManagerClient({});
	const command = new GetSecretValueCommand({ SecretId: secretArn });
	const response = await client.send(command);

	if (!response.SecretString) {
		throw new Error('SecretString not found in Secrets Manager response.');
	}

	const secret = JSON.parse(response.SecretString) as DbSecret;

	if (!secret.username || !secret.password) {
		throw new Error('Database credentials missing in secret');
	}

	return {
		host,
		port: Number(port),
		database,
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
