-- AlterEnum
ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'FREE';

-- AlterTable
ALTER TABLE "subscriptions" ALTER COLUMN "endDate" DROP NOT NULL;

-- AlterTable
ALTER TABLE "properties" ADD COLUMN "viewCount" INTEGER NOT NULL DEFAULT 0;

-- Update existing TRIAL subscriptions to FREE for compatibility
UPDATE "subscriptions"
SET "status" = 'FREE'
WHERE "status" = 'TRIAL';
