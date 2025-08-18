/*
  Warnings:

  - You are about to drop the column `nickname` on the `profiles` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[display_name]` on the table `profiles` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."profiles" DROP COLUMN "nickname",
ADD COLUMN     "full_name" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "profiles_display_name_key" ON "public"."profiles"("display_name");
