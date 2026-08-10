import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function classifyEmail(email: string, name: string): { isTestPattern: boolean; patternMatched: string } {
  const e = (email || '').toLowerCase();
  
  if (e.includes('.qa@') || e.includes('qa.')) {
    return { isTestPattern: true, patternMatched: '.qa@ / qa.' };
  }
  if (e.includes('e2e.') || e.includes('e2e_') || e.includes('e2e')) {
    return { isTestPattern: true, patternMatched: 'e2e.' };
  }
  if (e.includes('test_owner') || e.includes('test.owner') || e.includes('test_proprio') || e.includes('proprio@test') || e.includes('test@example') || e.startsWith('test.') || e.startsWith('test_') || e.includes('test')) {
    return { isTestPattern: true, patternMatched: 'test_owner / test_*' };
  }
  if (/\d{10,}/.test(e)) {
    return { isTestPattern: true, patternMatched: 'timestamp in email (10+ digits)' };
  }
  if (e.endsWith('@mamaison.ne') || e.endsWith('@x.com') || e.endsWith('@test.com') || e.endsWith('@testmail.com') || e.endsWith('@example.com')) {
    return { isTestPattern: true, patternMatched: 'test domain (@mamaison.ne, @x.com, @test.com, etc.)' };
  }
  if (e.includes('patch.owner') || e.includes('other.') || e.includes('sub.owner') || e.includes('coldstart')) {
    return { isTestPattern: true, patternMatched: 'fixture prefix (patch.owner, other., sub.owner, coldstart)' };
  }

  return { isTestPattern: false, patternMatched: 'NONE' };
}

async function main() {
  const { data: deletedProfiles, error } = await supabase
    .from('profiles')
    .select('id, email, role, status, createdAt, name, phone')
    .eq('status', 'DELETED')
    .order('createdAt', { ascending: false });

  if (error || !deletedProfiles) {
    console.error('Error fetching deleted profiles:', error);
    return;
  }

  // Get all property ownerIds in bulk
  const ownerIds = deletedProfiles.map(p => p.id);
  const { data: properties } = await supabase
    .from('properties')
    .select('ownerId')
    .in('ownerId', ownerIds);

  const propertyCountMap: Record<string, number> = {};
  (properties || []).forEach(p => {
    propertyCountMap[p.ownerId] = (propertyCountMap[p.ownerId] || 0) + 1;
  });

  const testAccounts: any[] = [];
  const suspectAccounts: any[] = [];
  const fullList: any[] = [];

  for (let i = 0; i < deletedProfiles.length; i++) {
    const p = deletedProfiles[i]!;
    const { isTestPattern, patternMatched } = classifyEmail(p.email, p.name || '');
    const propertyCount = propertyCountMap[p.id] || 0;

    const item = {
      index: i + 1,
      id: p.id,
      email: p.email,
      role: p.role,
      name: p.name,
      phone: p.phone,
      createdAt: p.createdAt,
      isTestPattern,
      patternMatched,
      propertyCount,
    };

    fullList.push(item);
    if (isTestPattern) {
      testAccounts.push(item);
    } else {
      suspectAccounts.push(item);
    }
  }

  // Save to file for fast reading
  const outputPath = path.join(process.cwd(), 'scratch', 'deleted_profiles_analysis.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify({
    total: deletedProfiles.length,
    testAccountsCount: testAccounts.length,
    suspectAccountsCount: suspectAccounts.length,
    suspectAccounts,
    testAccounts,
    fullList
  }, null, 2));

  console.log(`ANALYSIS COMPLETE!`);
  console.log(`Total DELETED: ${deletedProfiles.length}`);
  console.log(`Confirmed Test Patterns: ${testAccounts.length}`);
  console.log(`Suspect / Non-standard Emails: ${suspectAccounts.length}`);
  console.log(`Saved output to: ${outputPath}`);
}

main();
