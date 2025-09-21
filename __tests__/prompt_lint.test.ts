import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

describe('Prompt lint', () => {
  const root = path.join(__dirname, '..');
  const compiled = path.join(root, 'generated', 'compiledPrompt.txt');

  beforeAll(() => {
    execSync('npm run build:prompt', { stdio: 'inherit', cwd: root });
  });

  it('passes lint rules', () => {
    execSync('npm run lint:prompt', { stdio: 'inherit', cwd: root });
    expect(fs.existsSync(compiled)).toBe(true);
  });
});
