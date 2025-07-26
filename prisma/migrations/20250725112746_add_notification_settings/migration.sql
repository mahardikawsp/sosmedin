-- AlterTable
ALTER TABLE "User" ADD COLUMN     "notificationSettings" JSONB DEFAULT '{"likes": true, "follows": true, "replies": true}';
