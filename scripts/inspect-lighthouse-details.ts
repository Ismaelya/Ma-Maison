import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scratch/lighthouse_home.json', 'utf8'));
const items = data.audits['network-requests']?.details?.items || [];

console.log('=== ALL NETWORK REQUESTS TIMELINE ===');
items.forEach((item: any) => {
  const reqStart = Math.round(item.networkRequestTime || 0);
  const reqEnd = Math.round(item.networkEndTime || 0);
  const dur = reqEnd - reqStart;
  console.log(`[${item.resourceType || 'Other'}] ${item.url.slice(0, 80)} | Start: ${reqStart}ms | End: ${reqEnd}ms | Duration: ${dur}ms | Size: ${item.transferSize}B`);
});
