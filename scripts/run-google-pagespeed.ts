import fs from 'fs';
import path from 'path';

const DOMAIN = 'https://ma-maison-niger.vercel.app';
const SAMPLE_PROPERTY_ID = '262c9a54-1b46-415b-99b8-aeb59df1582a';

const PAGES = [
  { name: 'Accueil (/)', url: `${DOMAIN}/` },
  { name: 'Recherche (/recherche)', url: `${DOMAIN}/recherche` },
  { name: 'Détail Annonce (/annonces/[id])', url: `${DOMAIN}/annonces/${SAMPLE_PROPERTY_ID}` },
];

async function runPageSpeedForUrl(targetUrl: string, strategy: 'mobile' | 'desktop' = 'mobile') {
  console.log(`Running Google PageSpeed API for: ${targetUrl} (${strategy})...`);
  const psiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(targetUrl)}&category=PERFORMANCE&strategy=${strategy}`;
  
  const res = await fetch(psiUrl);
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`PageSpeed API failed for ${targetUrl}: ${res.status} ${res.statusText}\n${errText}`);
  }

  const json = await res.json();
  const lighthouse = json.lighthouseResult;
  const audits = lighthouse?.audits || {};

  const score = lighthouse?.categories?.performance?.score != null
    ? Math.round(lighthouse.categories.performance.score * 100)
    : null;

  const ttfbAudit = audits['server-response-time'];
  const fcpAudit = audits['first-contentful-paint'];
  const lcpAudit = audits['largest-contentful-paint'];
  const fcpMsAudit = audits['first-contentful-paint'];
  
  return {
    url: targetUrl,
    strategy,
    performanceScore: score,
    ttfbMs: ttfbAudit?.numericValue ? Math.round(ttfbAudit.numericValue) : null,
    ttfbDisplay: ttfbAudit?.displayValue || null,
    fcpMs: fcpAudit?.numericValue ? Math.round(fcpAudit.numericValue) : null,
    fcpDisplay: fcpAudit?.displayValue || null,
    lcpMs: lcpAudit?.numericValue ? Math.round(lcpAudit.numericValue) : null,
    lcpDisplay: lcpAudit?.displayValue || null,
  };
}

async function main() {
  console.log(`=== GOOGLE PAGESPEED INSIGHTS BENCHMARK ===`);
  console.log(`Target Domain: ${DOMAIN}\n`);

  const results: any[] = [];

  for (const page of PAGES) {
    try {
      // Run Mobile benchmark
      const mobileResult = await runPageSpeedForUrl(page.url, 'mobile');
      // Run Desktop benchmark
      const desktopResult = await runPageSpeedForUrl(page.url, 'desktop');

      results.push({
        pageName: page.name,
        url: page.url,
        mobile: mobileResult,
        desktop: desktopResult,
      });

      console.log(`✓ Completed PageSpeed for ${page.name}`);
      console.log(`  Mobile  -> Score: ${mobileResult.performanceScore}/100 | TTFB: ${mobileResult.ttfbDisplay} (${mobileResult.ttfbMs}ms) | FCP: ${mobileResult.fcpDisplay}`);
      console.log(`  Desktop -> Score: ${desktopResult.performanceScore}/100 | TTFB: ${desktopResult.ttfbDisplay} (${desktopResult.ttfbMs}ms) | FCP: ${desktopResult.fcpDisplay}\n`);
    } catch (err: any) {
      console.error(`❌ Error testing ${page.name}:`, err.message);
      results.push({
        pageName: page.name,
        url: page.url,
        error: err.message,
      });
    }
  }

  const outputPath = path.join(process.cwd(), 'scratch', 'google_pagespeed_official_results.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  console.log(`All Google PageSpeed results saved to: ${outputPath}`);
}

main();
