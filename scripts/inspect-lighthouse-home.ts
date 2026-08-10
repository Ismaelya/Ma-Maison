import fs from 'fs';

function inspectLighthouseHome() {
  const file = 'scratch/lighthouse_home.json';
  if (!fs.existsSync(file)) {
    console.error('File not found:', file);
    return;
  }

  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  const audits = json.audits || {};

  console.log('=== LIGHTHOUSE FCP AUDIT BREAKDOWN FOR HOME PAGE (/) ===\n');

  // Key FCP / Render blocking metrics & audits
  const auditKeys = [
    'render-blocking-resources',
    'font-display',
    'unused-css-rules',
    'unused-javascript',
    'server-response-time',
    'first-contentful-paint',
    'largest-contentful-paint-element',
    'modern-image-formats',
    'uses-optimized-images',
    'uses-responsive-images',
    'offscreen-images',
  ];

  for (const key of auditKeys) {
    const audit = audits[key];
    if (audit) {
      console.log(`--- [${audit.title || key}] (Score: ${audit.score}) ---`);
      if (audit.displayValue) console.log(`  Display Value: ${audit.displayValue}`);
      if (audit.explanation) console.log(`  Explanation: ${audit.explanation}`);
      if (audit.details?.items && audit.details.items.length > 0) {
        console.log('  Details / Resources:');
        console.log(JSON.stringify(audit.details.items.slice(0, 5), null, 2));
      }
      console.log('');
    }
  }

  // Network requests during loading to check font / render blocking requests
  const networkAudit = audits['network-requests'];
  if (networkAudit?.details?.items) {
    console.log('=== TOP CRITICAL NETWORK REQUESTS (RENDER BLOCKING / FONTS) ===');
    const items = networkAudit.details.items;
    const fontRequests = items.filter((i: any) => i.resourceType === 'Font' || i.url.includes('fonts.'));
    const cssRequests = items.filter((i: any) => i.resourceType === 'Stylesheet');
    console.log('Font & Google Font CSS Requests:', fontRequests);
    console.log('Stylesheet Requests:', cssRequests);
  }
}

inspectLighthouseHome();
