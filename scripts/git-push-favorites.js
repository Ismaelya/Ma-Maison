const { execSync } = require('child_process');

try {
  console.log('Staging changes...');
  const addOut = execSync('git add app/api/favorites/route.ts hooks/use-favorites.ts lib/notifications/notification.service.ts lib/audit/audit.service.ts scripts/test-favorites-real.ts', { encoding: 'utf8' });
  console.log('Add out:', addOut);

  console.log('Committing changes...');
  const commitOut = execSync('git commit -m "fix(favorites): supply crypto.randomUUID() for favorites, notifications, and audit_logs inserts"', { encoding: 'utf8' });
  console.log('Commit out:', commitOut);

  console.log('Pushing to origin main...');
  const pushOut = execSync('git push origin main', { encoding: 'utf8' });
  console.log('Push out:', pushOut);

  console.log('SUCCESSFULLY COMMITTED AND PUSHED TO GITHUB!');
} catch (err) {
  console.error('Error during git operations:', err.message);
  if (err.stdout) console.log('stdout:', err.stdout.toString());
  if (err.stderr) console.log('stderr:', err.stderr.toString());
}
