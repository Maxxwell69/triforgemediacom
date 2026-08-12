-- AlterTable
ALTER TABLE "Message" ADD COLUMN "imageUrl" TEXT;
ALTER TABLE "Message" ALTER COLUMN "content" SET DEFAULT '';
