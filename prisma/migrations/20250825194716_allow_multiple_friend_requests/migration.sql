/*
  Warnings:

  - A unique constraint covering the columns `[senderId,receiverId,status]` on the table `friend_requests` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."friend_requests_senderId_receiverId_key";

-- CreateIndex
CREATE UNIQUE INDEX "friend_requests_senderId_receiverId_status_key" ON "public"."friend_requests"("senderId", "receiverId", "status");
