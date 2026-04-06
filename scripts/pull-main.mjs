import { execSync } from 'child_process';

try {
  const result = execSync('git fetch origin main && git merge origin/main --no-edit', {
    cwd: '/vercel/share/v0-project',
    encoding: 'utf8'
  });
  console.log(result);
} catch (e) {
  console.error(e.message);
}
