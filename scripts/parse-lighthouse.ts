import fs from 'fs';
import path from 'path';

function parseLighthouseJson(filePath: string) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const score = Math.round((data.categories?.performance?.score || 0) * 100);
  const audits = data.audits || {};

  return {
    score,
    ttfbMs: Math.round(audits['server-response-time']?.numericValue || 0),
    ttfbDisplay: audits['server-response-time']?.displayValue || 'N/A',
    fcpMs: Math.round(audits['first-contentful-paint']?.numericValue || 0),
    fcpDisplay: audits['first-contentful-paint']?.displayValue || 'N/A',
    lcpMs: Math.round(audits['largest-contentful-paint']?.numericValue || 0),
    lcpDisplay: audits['largest-contentful-paint']?.displayValue || 'N/A',
    tbtMs: Math.round(audits['total-blocking-time']?.numericValue || 0),
    tbtDisplay: audits['total-blocking-time']?.displayValue || 'N/A',
    clsDisplay: audits['cumulative-layout-shift']?.displayValue || '0',
  };
}

async function main() {
  const home = parseLighthouseJson('scratch/lighthouse_home.json');
  const recherche = parseLighthouseJson('scratch/lighthouse_recherche.json');
  const annonce = parseLighthouseJson('scratch/lighthouse_annonce.json');

  console.log('=== LIGHTHOUSE PRODUCTION BENCHMARK (https://ma-maison-niger.vercel.app) ===\n');

  console.log('1. Home Page (/):', home);
  console.log('2. Search Page (/recherche):', recherche);
  console.log('3. Detail Page (/annonces/[id]):', annonce);

  // Also measure HTTP TTFB directly across 5 runs for live Vercel
  const urls = [
    { name: 'Home (/)', url: 'https://ma-maison-niger.vercel.app/' },
    { name: 'Recherche (/recherche)', url: 'https://ma-maison-niger.vercel.app/recherche' },
    { name: 'Detail (/annonces/262c9a54-1b46-415b-99b8-aeb59df1582a)', url: 'https://ma-maison-niger.vercel.app/annonces/262c9a54-1b46-415b-99b8-aeb59df1582a' },
  ];

  console.log('\n--- LIVE PRODUCTION HTTP FETCH TTFB (5 RUNS EACH) ---');
  for (const item of urls) {
    const runs = [];
    for (let i = 0; i < 5; i++) {
      const start = performance.now();
      const res = await fetch(item.url, { cache: 'no-store' });
      const elapsed = Math.round(performance.now() - start);
      await res.text();
      runs.push(elapsed);
    }
    console.log(`${item.name} TTFB runs (ms): ${runs.join(', ')} | Avg: ${Math.round(runs.reduce((a, b) => a + b, 0) / 5)}ms`);
  }
}

main();
