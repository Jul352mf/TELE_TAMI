#!/usr/bin/env ts-node
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

interface ManifestPart { id: string; file: string; }
interface Manifest { version: number; parts: ManifestPart[]; }

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const partsDir = path.join(root, 'prompt_parts');
const manifestPath = path.join(partsDir, 'manifest.json');
const outDir = path.join(root, 'generated');
const outFile = path.join(outDir, 'compiledPrompt.txt');

function main() {
  const manifest: Manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const contents: string[] = [];
  for (const p of manifest.parts) {
    const filePath = path.join(partsDir, p.file);
    if (!fs.existsSync(filePath)) throw new Error(`Missing part file: ${p.file}`);
    const raw = fs.readFileSync(filePath, 'utf8').trim();
    contents.push(raw);
  }
  const joined = contents.join('\n\n');
  const hash = crypto.createHash('sha1').update(joined).digest('hex').slice(0, 10);
  const header = `# COMPILED PROMPT\n# manifestVersion=${manifest.version} hash=${hash} generated=${new Date().toISOString()}\n`;
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
  fs.writeFileSync(outFile, header + '\n' + joined + '\n');
  console.log(outFile);
  console.log('hash=' + hash);
}

main();
