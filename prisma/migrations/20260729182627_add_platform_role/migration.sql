-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('CUSTOMER', 'SUPPORT', 'MODERATOR', 'SUPER_ADMIN');

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "role" "PlatformRole" NOT NULL DEFAULT 'CUSTOMER';
