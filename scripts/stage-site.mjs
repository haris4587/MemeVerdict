import { cpSync } from 'node:fs';
cpSync('MemeVerdict/frontend/dist', 'dist', { recursive: true });
