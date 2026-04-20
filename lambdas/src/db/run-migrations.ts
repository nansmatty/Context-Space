import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createDbClient } from './db';

export async function runMigrations() {
	const dbClient = await createDbClient();

	try {
		const migrationsDir = path.join(__dirname, 'db', 'migrations');
		const files = await fs.readdir(migrationsDir);

		const sqlFiles = files.filter((file) => file.endsWith('.sql')).sort((a, b) => a.localeCompare(b));

		if (sqlFiles.length === 0) {
			console.log('No migrations files found');
			return;
		}

		for (const file of sqlFiles) {
			const filePath = path.join(migrationsDir, file);
			const sql = await fs.readFile(filePath, 'utf-8');

			console.log(`Running migration: ${file}`);
			await dbClient.query(sql);
			console.log(`Finished migration: ${file}`);
		}

		console.log('All migration completed successfully');
	} finally {
		await dbClient.end();
	}
}

// runMigrations().catch((err) => {
// 	console.error('Migration run failed:', err);
// 	process.exit(1);
// });
