import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
const prisma = new PrismaClient();

async function main() {
  const candidates: any[] = await prisma.$queryRaw`
    select p.id, p.title, p."ownerId", pr.email as owner_email, pr.status as owner_status, p."createdAt"
    from properties p 
    join profiles pr on pr.id = p."ownerId" 
    where p.status = 'APPROVED' and pr.status = 'DELETED'
    order by p."createdAt" desc;
  `;

  console.log(`=== FOUND ${candidates.length} APPROVED PROPERTIES WITH DELETED OWNERS ===\n`);
  console.table(candidates);

  const propertyIds = candidates.map(c => c.id);

  if (propertyIds.length > 0) {
    // Check foreign key dependencies count
    const imagesCount: any[] = await prisma.$queryRaw`
      select count(*)::int as count from property_images where "propertyId" = any(${propertyIds});
    `;
    const favoritesCount: any[] = await prisma.$queryRaw`
      select count(*)::int as count from favorites where "propertyId" = any(${propertyIds});
    `;
    const conversationsCount: any[] = await prisma.$queryRaw`
      select count(*)::int as count from conversations where "propertyId" = any(${propertyIds});
    `;
    const reviewsCount: any[] = await prisma.$queryRaw`
      select count(*)::int as count from reviews where "propertyId" = any(${propertyIds});
    `;
    const reportsCount: any[] = await prisma.$queryRaw`
      select count(*)::int as count from reports where "propertyId" = any(${propertyIds});
    `;

    console.log(`\n=== DEPENDENT RECORDS TO BE DELETED ===`);
    console.log(`- property_images: ${imagesCount[0]?.count || 0}`);
    console.log(`- favorites:       ${favoritesCount[0]?.count || 0}`);
    console.log(`- conversations:   ${conversationsCount[0]?.count || 0}`);
    console.log(`- reviews:         ${reviewsCount[0]?.count || 0}`);
    console.log(`- reports:         ${reportsCount[0]?.count || 0}`);
  }

  // Count remaining APPROVED properties if these 17 are deleted
  const remainingApproved: any[] = await prisma.$queryRaw`
    select count(*)::int as count from properties p
    join profiles pr on pr.id = p."ownerId"
    where p.status = 'APPROVED' and pr.status = 'ACTIVE';
  `;
  console.log(`\nRemaining APPROVED properties (with ACTIVE owners) that will be kept: ${remainingApproved[0]?.count || 0}`);

  await prisma.$disconnect();
}

main().catch(console.error);
