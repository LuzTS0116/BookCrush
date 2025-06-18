-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('USER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN');

-- DropForeignKey
ALTER TABLE "public"."feedback" DROP CONSTRAINT "feedback_user_id_fkey";

-- DropIndex
DROP INDEX "public"."feedback_status_idx";

-- DropIndex
DROP INDEX "public"."feedback_type_idx";

-- DropIndex
DROP INDEX "public"."feedback_user_id_created_at_idx";

-- AlterTable
ALTER TABLE "public"."feedback" ALTER COLUMN "type" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."profiles" ADD COLUMN     "role" "public"."UserRole" NOT NULL DEFAULT 'USER';

-- AddForeignKey
ALTER TABLE "public"."feedback" ADD CONSTRAINT "feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
