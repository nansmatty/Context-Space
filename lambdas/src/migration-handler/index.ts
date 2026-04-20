import { runMigrations } from '../db/run-migrations';

export const handler = async () => {
	console.log('Migration Lambda invoked');

	try {
		await runMigrations();

		return {
			statusCode: 200,
			body: JSON.stringify({ message: 'Migrations completed successfully' }),
		};
	} catch (err) {
		console.error('Migration run failed:', err);
		throw err;
	}
};
