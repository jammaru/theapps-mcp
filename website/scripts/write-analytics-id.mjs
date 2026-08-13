import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dest = path.join(root, 'src/lib/analytics-id.json');
const id = String(process.env.PUBLIC_GOOGLE_ANALYTICS_ID || '').trim();
await writeFile(dest, `${JSON.stringify({ id })}\n`);
console.log(id ? 'analytics: PUBLIC_GOOGLE_ANALYTICS_ID is set' : 'analytics: PUBLIC_GOOGLE_ANALYTICS_ID is missing (GA off)');
