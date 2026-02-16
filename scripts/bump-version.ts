import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const pkgPath = resolve(import.meta.dirname, '..', 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

const part = (process.argv[2] || 'patch') as 'major' | 'minor' | 'patch';
const [major, minor, patch] = pkg.version.split('.').map(Number);

switch (part) {
  case 'major':
    pkg.version = `${major + 1}.0.0`;
    break;
  case 'minor':
    pkg.version = `${major}.${minor + 1}.0`;
    break;
  case 'patch':
    pkg.version = `${major}.${minor}.${patch + 1}`;
    break;
  default:
    console.error(`Unknown bump type: ${part}. Use major, minor, or patch.`);
    process.exit(1);
}

writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log(pkg.version);
