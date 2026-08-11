-- AlterEnum
ALTER TYPE "PropertyType" ADD VALUE 'RESIDENCE';

-- CreateEnum
CREATE TYPE "RentalPeriod" AS ENUM ('DAILY', 'MONTHLY', 'YEARLY');

-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "furnished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rentalPeriod" "RentalPeriod";
