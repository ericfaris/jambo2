/* eslint-env node */

import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const thisDir = fileURLToPath(new URL('.', import.meta.url));
const projectRoot = resolve(thisDir, '..');
const sourceDir = resolve(projectRoot, 'receiver', 'caf');
const targetDir = resolve(projectRoot, 'dist', 'receiver', 'caf');

if (!existsSync(sourceDir)) {
  console.error(`Receiver source directory not found: ${sourceDir}`);
  process.exit(1);
}

mkdirSync(targetDir, { recursive: true });
cpSync(sourceDir, targetDir, { recursive: true, force: true });
console.log(`Copied receiver files to ${targetDir}`);
