-- CreateEnum
CREATE TYPE "public"."book_media_type" AS ENUM ('e_reader', 'audio_book', 'physical_book');

-- AlterTable
ALTER TABLE "public"."user_books" ADD COLUMN     "media_type" "public"."book_media_type";
