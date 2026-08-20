const fs = require('fs');
const path = require('path');
const https = require('https');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wvxojyoblzlvbedtorwq.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'wvxojyoblzlvbedtorwq';

function execSqlViaManagementApi(sql) {
  return new Promise((resolve) => {
    const body = JSON.stringify({ query: sql });
    const req = https.request({
      hostname: 'api.supabase.com',
      path: `/v1/projects/${PROJECT_REF}/database/query`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('error', e => resolve({ status: 0, body: e.message }));
    req.write(body);
    req.end();
  });
}

async function main() {
  const sqlPath = path.join(__dirname, '../supabase/migrations/009_upgrade_to_owner.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');

  console.log('Executing SQL migration 009 via Supabase Management API...');
  const res = await execSqlViaManagementApi(sqlContent);
  console.log(`Status: ${res.status}`);
  console.log(`Body: ${res.body}`);

  if (res.status !== 200) {
    console.log('\nTrying direct postgres connection via node pg...');
  }
}

main().catch(console.error);
