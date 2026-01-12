import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import 'dotenv/config';

const vaultPath = process.env.OBSIDIAN_VAULT_PATH;

if (!vaultPath) {
    console.error('Error: OBSIDIAN_VAULT_PATH not found in .env');
    process.exit(1);
}

const filesToSync = ['main.js', 'manifest.json', 'styles.css'];

try {
    if (!existsSync(vaultPath)) {
        mkdirSync(vaultPath, { recursive: true });
    }

    filesToSync.forEach(file => {
        if (existsSync(file)) {
            copyFileSync(file, join(vaultPath, file));
            console.log(`Synced ${file} to ${vaultPath}`);
        } else {
            console.warn(`Warning: ${file} not found, skipping.`);
        }
    });

    console.log('Sync completed successfully!');
} catch (err) {
    console.error(`Error during sync: ${err.message}`);
    process.exit(1);
}
