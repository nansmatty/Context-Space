import { runMigrations } from '../db/run-migrations';

export const handler = async () => {
	console.log('Migration Lambda invoked');
	runMigrations().catch((err) => {
		console.error('Migration run failed:', err);
		process.exit(1);
	});
	return {
		statusCode: 200,
		body: JSON.stringify({ message: 'Migration Lambda is working' }),
	};
};
