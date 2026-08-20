import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

const TEST_EMAIL = 'e2e_tenant_browser_test@example.com';
const TEST_PASSWORD = 'Password123!';

async function prepareTenant() {
  console.log(`Setting up test user in Supabase Auth & DB: ${TEST_EMAIL}`);

  // Check if user exists in auth
  const { data: usersData, error: listErr } = await serviceClient.auth.admin.listUsers();
  if (listErr) {
    console.error('Error listing users:', listErr);
    process.exit(1);
  }

  let user = usersData.users.find(u => u.email === TEST_EMAIL);

  if (!user) {
    console.log('User not found in Auth. Creating user...');
    const { data: createData, error: createErr } = await serviceClient.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: 'Locataire Test E2E' },
    });

    if (createErr) {
      console.error('Error creating user:', createErr);
      process.exit(1);
    }
    user = createData.user;
    console.log(`Created Auth User ID: ${user.id}`);
  } else {
    console.log(`Found Auth User ID: ${user.id}. Updating password...`);
    await serviceClient.auth.admin.updateUserById(user.id, {
      password: TEST_PASSWORD,
      email_confirm: true,
    });
  }

  const userId = user.id;

  // Clean existing properties and subscriptions for this user
  await serviceClient.from('properties').delete().eq('ownerId', userId);
  await serviceClient.from('subscriptions').delete().eq('userId', userId);

  // Set profile role to TENANT
  const { error: profErr } = await serviceClient.from('profiles').upsert({
    id: userId,
    email: TEST_EMAIL,
    name: 'Locataire Test E2E',
    phone: '+22790998877',
    role: 'TENANT',
    status: 'ACTIVE',
    updatedAt: new Date().toISOString(),
  });

  if (profErr) {
    console.error('Error updating profile:', profErr);
    process.exit(1);
  }

  console.log('✅ Test TENANT account is ready!');
  console.log(`User ID: ${userId}`);
  console.log(`Email: ${TEST_EMAIL}`);
  console.log(`Password: ${TEST_PASSWORD}`);
}

prepareTenant().catch(console.error);
