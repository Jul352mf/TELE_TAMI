const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const partsDir = path.join(root, 'prompt_parts');
const manifestPath = path.join(partsDir, 'manifest.json');
const outDir = path.join(root, 'generated');
const outFile = path.join(outDir, 'compiledPrompt.txt');

function main() {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const contents = [];
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
