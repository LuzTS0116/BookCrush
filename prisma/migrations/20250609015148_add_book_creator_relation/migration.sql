-- AddForeignKey
ALTER TABLE "public"."books" ADD CONSTRAINT "books_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
