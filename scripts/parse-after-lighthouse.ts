import fs from 'fs';

function parse(file: string) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const score = Math.round((data.categories?.performance?.score || 0) * 100);
  const audits = data.audits || {};
  return {
    score,
    ttfbMs: Math.round(audits['server-response-time']?.numericValue || 0),
    fcpMs: Math.round(audits['first-contentful-paint']?.numericValue || 0),
    fcpDisplay: audits['first-contentful-paint']?.displayValue || 'N/A',
    lcpMs: Math.round(audits['largest-contentful-paint']?.numericValue || 0),
    lcpDisplay: audits['largest-contentful-paint']?.displayValue || 'N/A',
    tbtMs: Math.round(audits['total-blocking-time']?.numericValue || 0),
    tbtDisplay: audits['total-blocking-time']?.displayValue || 'N/A',
    renderBlocking: audits['render-blocking-resources']?.details?.items || [],
  };
}

const before = parse('scratch/lighthouse_home.json');
const after = parse('scratch/lighthouse_home_after.json');

console.log('=== LIGHTHOUSE HOME PAGE (/) BEFORE vs AFTER NEXT/FONT/GOOGLE ===\n');
console.log('BEFORE (External Google Fonts link):', before);
console.log('\nAFTER (next/font/google zero-render-blocking font):', after);
