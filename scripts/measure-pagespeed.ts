import { chromium } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BASE_URL = process.env.TEST_URL || 'http://localhost:3005';

async function getSamplePropertyId(): Promise<string> {
  return '262c9a54-1b46-415b-99b8-aeb59df1582a';
}

async function measureHttpTTFB(url: string, runs = 3) {
  const results = [];
  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    const res = await fetch(url, { cache: 'no-store' });
    const headerTime = performance.now() - start;
    const body = await res.text();
    const totalTime = performance.now() - start;
    results.push({
      status: res.status,
      ttfbMs: Math.round(headerTime),
      totalMs: Math.round(totalTime),
      htmlLengthBytes: body.length,
    });
  }
  return results;
}

async function measureBrowserPage(browser: any, urlPath: string, runs = 3) {
  const pageResults = [];
  const fullUrl = `${BASE_URL}${urlPath}`;

  for (let i = 0; i < runs; i++) {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Collect Navigation Performance Metrics
    const navigationStart = performance.now();
    await page.goto(fullUrl, { waitUntil: 'domcontentloaded' });

    const timingMetrics = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(e => e.name === 'first-contentful-paint');

      return {
        dnsMs: Math.round(nav ? nav.domainLookupEnd - nav.domainLookupStart : 0),
        connectMs: Math.round(nav ? nav.connectEnd - nav.connectStart : 0),
        ttfbMs: Math.round(nav ? nav.responseStart - nav.requestStart : 0),
        domContentLoadedMs: Math.round(nav ? nav.domContentLoadedEventEnd - nav.requestStart : 0),
        loadMs: Math.round(nav ? nav.loadEventEnd - nav.requestStart : 0),
        fcpMs: fcpEntry ? Math.round(fcpEntry.startTime) : null,
      };
    });

    pageResults.push({
      run: i + 1,
      isColdStart: i === 0,
      ...timingMetrics,
    });

    await context.close();
  }

  return pageResults;
}

async function main() {
  const samplePropId = await getSamplePropertyId();
  console.log(`Using sample property ID: ${samplePropId}`);

  const pagesToTest = [
    { name: 'Page d\'accueil (/)', path: '/' },
    { name: 'Page de recherche (/recherche)', path: '/recherche' },
    { name: 'Page détail annonce (/annonces/[id])', path: `/annonces/${samplePropId}` },
  ];

  console.log(`Starting performance benchmark against ${BASE_URL}...\n`);

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (err) {
    console.log('Playwright chromium not installed or failed, using HTTP fetch benchmark fallback.');
  }

  const summaryData: any[] = [];

  for (const pageInfo of pagesToTest) {
    console.log(`--- Testing ${pageInfo.name} ---`);

    // 1. Raw HTTP Fetch measurements
    const httpMetrics = await measureHttpTTFB(`${BASE_URL}${pageInfo.path}`, 3);
    console.log('HTTP Fetch TTFB runs (ms):', httpMetrics.map(m => m.ttfbMs).join(', '));

    // 2. Browser Navigation measurements if Playwright is active
    let browserMetrics: any[] = [];
    if (browser) {
      browserMetrics = await measureBrowserPage(browser, pageInfo.path, 3);
      console.log('Browser TTFB runs (ms):', browserMetrics.map(m => m.ttfbMs).join(', '));
      console.log('Browser FCP runs (ms):', browserMetrics.map(m => m.fcpMs).join(', '));
    }

    const coldTTFB = browserMetrics[0]?.ttfbMs ?? httpMetrics[0]?.ttfbMs;
    const warmTTFB = Math.round(
      (browserMetrics.slice(1).reduce((acc, m) => acc + m.ttfbMs, 0) ||
       httpMetrics.slice(1).reduce((acc, m) => acc + m.ttfbMs, 0)) / 2
    );

    const coldFCP = browserMetrics[0]?.fcpMs ?? null;
    const warmFCP = browserMetrics.length > 1
      ? Math.round(browserMetrics.slice(1).reduce((acc, m) => acc + (m.fcpMs || 0), 0) / (browserMetrics.length - 1))
      : null;

    summaryData.push({
      pageName: pageInfo.name,
      path: pageInfo.path,
      httpMetrics,
      browserMetrics,
      coldTTFB,
      warmTTFB,
      coldFCP,
      warmFCP,
    });
  }

  if (browser) {
    await browser.close();
  }

  const outputPath = path.join(process.cwd(), 'scratch', 'pagespeed_benchmark_results.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(summaryData, null, 2));

  console.log('\n=== BENCHMARK COMPLETED ===');
  console.log(`Results saved to: ${outputPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
