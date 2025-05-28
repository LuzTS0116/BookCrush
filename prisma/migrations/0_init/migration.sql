-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."FriendRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- CreateEnum
CREATE TYPE "public"."ClubRole" AS ENUM ('MEMBER', 'ADMIN', 'OWNER');

-- CreateEnum
CREATE TYPE "public"."ClubMembershipStatus" AS ENUM ('ACTIVE', 'PENDING', 'REJECTED', 'LEFT', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."ReactionTargetType" AS ENUM ('BOOK', 'COMMENT', 'CLUB_DISCUSSION');

-- CreateEnum
CREATE TYPE "public"."ReactionType" AS ENUM ('LIKE', 'HEART', 'THUMBS_UP', 'THUMBS_DOWN');

-- CreateEnum
CREATE TYPE "public"."shelf_type" AS ENUM ('favorite', 'currently_reading', 'queue');

-- CreateEnum
CREATE TYPE "public"."status_type" AS ENUM ('in_progress', 'almost_done', 'finished');

-- CreateEnum
CREATE TYPE "public"."club_book_status" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateTable
CREATE TABLE "public"."profiles" (
    "id" UUID NOT NULL,
    "display_name" TEXT NOT NULL,
    "about" TEXT,
    "kindle_email" TEXT,
    "favorite_genres" TEXT[],
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."books" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "cover_url" TEXT,
    "description" TEXT,
    "reading_time" TEXT,
    "pages" INTEGER,
    "genres" TEXT[],
    "published_date" TEXT,
    "rating" DOUBLE PRECISION,
    "added_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."book_files" (
    "id" UUID NOT NULL,
    "book_id" UUID NOT NULL,
    "storage_key" TEXT NOT NULL,
    "original_name" TEXT,
    "mime_type" TEXT,
    "size_bytes" INTEGER,

    CONSTRAINT "book_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."friend_requests" (
    "id" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "receiverId" UUID NOT NULL,
    "status" "public"."FriendRequestStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "friend_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."friendships" (
    "id" UUID NOT NULL,
    "userId1" UUID NOT NULL,
    "userId2" UUID NOT NULL,
    "establishedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "friendships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."clubs" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "owner_id" UUID NOT NULL,
    "memberCount" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "is_private" BOOLEAN NOT NULL,
    "current_book_id" UUID,

    CONSTRAINT "clubs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."club_memberships" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "club_id" UUID NOT NULL,
    "role" "public"."ClubRole" NOT NULL DEFAULT 'MEMBER',
    "status" "public"."ClubMembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "club_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reactions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "target_type" "public"."ReactionTargetType" NOT NULL,
    "target_id" UUID NOT NULL,
    "type" "public"."ReactionType" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clubDiscussionId" UUID,

    CONSTRAINT "reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_books" (
    "user_id" UUID NOT NULL,
    "book_id" UUID NOT NULL,
    "shelf" "public"."shelf_type" NOT NULL,
    "status" "public"."status_type" NOT NULL,
    "position" INTEGER,
    "added_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comment" TEXT,

    CONSTRAINT "user_books_pkey" PRIMARY KEY ("user_id","book_id","shelf")
);

-- CreateTable
CREATE TABLE "public"."club_books" (
    "id" UUID NOT NULL,
    "club_id" UUID NOT NULL,
    "book_id" UUID NOT NULL,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMPTZ(6),
    "status" "public"."club_book_status" NOT NULL DEFAULT 'IN_PROGRESS',

    CONSTRAINT "club_books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."club_discussions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "club_id" UUID NOT NULL,
    "book_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "parent_discussion_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "club_discussions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "friend_requests_senderId_receiverId_key" ON "public"."friend_requests"("senderId", "receiverId");

-- CreateIndex
CREATE UNIQUE INDEX "friendships_userId1_userId2_key" ON "public"."friendships"("userId1", "userId2");

-- CreateIndex
CREATE UNIQUE INDEX "clubs_name_key" ON "public"."clubs"("name");

-- CreateIndex
CREATE UNIQUE INDEX "club_memberships_user_id_club_id_key" ON "public"."club_memberships"("user_id", "club_id");

-- CreateIndex
CREATE UNIQUE INDEX "reactions_user_id_target_type_target_id_type_key" ON "public"."reactions"("user_id", "target_type", "target_id", "type");

-- AddForeignKey
ALTER TABLE "public"."book_files" ADD CONSTRAINT "book_files_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."friend_requests" ADD CONSTRAINT "friend_requests_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."friend_requests" ADD CONSTRAINT "friend_requests_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."friendships" ADD CONSTRAINT "friendships_userId1_fkey" FOREIGN KEY ("userId1") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."friendships" ADD CONSTRAINT "friendships_userId2_fkey" FOREIGN KEY ("userId2") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."clubs" ADD CONSTRAINT "clubs_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."clubs" ADD CONSTRAINT "clubs_current_book_id_fkey" FOREIGN KEY ("current_book_id") REFERENCES "public"."books"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."club_memberships" ADD CONSTRAINT "club_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."club_memberships" ADD CONSTRAINT "club_memberships_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reactions" ADD CONSTRAINT "reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reactions" ADD CONSTRAINT "reactions_clubDiscussionId_fkey" FOREIGN KEY ("clubDiscussionId") REFERENCES "public"."club_discussions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_books" ADD CONSTRAINT "user_books_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_books" ADD CONSTRAINT "user_books_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."club_books" ADD CONSTRAINT "club_books_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."club_books" ADD CONSTRAINT "club_books_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."club_discussions" ADD CONSTRAINT "club_discussions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."club_discussions" ADD CONSTRAINT "club_discussions_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."club_discussions" ADD CONSTRAINT "club_discussions_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."club_discussions" ADD CONSTRAINT "club_discussions_parent_discussion_id_fkey" FOREIGN KEY ("parent_discussion_id") REFERENCES "public"."club_discussions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
