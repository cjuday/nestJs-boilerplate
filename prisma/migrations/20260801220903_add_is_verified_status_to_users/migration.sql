-- AlterTable
ALTER TABLE "User" ADD COLUMN     "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_phone_verified" BOOLEAN NOT NULL DEFAULT false;
