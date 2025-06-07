-- AlterTable
ALTER TABLE "public"."user_books" ADD COLUMN     "is_favorite" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "status" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."reactions" ADD CONSTRAINT "reactions_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "public"."books"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
