import { runMigrations } from '../db/run-migrations';

export const handler = async () => {
	console.log('Migration Lambda invoked');
	await runMigrations();
	console.log('Run migration function invoked');
	return {
		statusCode: 200,
		body: JSON.stringify({ message: 'Migration Lambda is working' }),
	};
};
