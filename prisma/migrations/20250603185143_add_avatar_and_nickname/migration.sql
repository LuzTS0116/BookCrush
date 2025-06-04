-- CreateEnum
CREATE TYPE "public"."ClubInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED');

-- AlterTable
ALTER TABLE "public"."profiles" ADD COLUMN     "avatar_url" TEXT,
ADD COLUMN     "nickname" TEXT;

-- CreateTable
CREATE TABLE "public"."club_invitations" (
    "id" UUID NOT NULL,
    "club_id" UUID NOT NULL,
    "inviter_id" UUID NOT NULL,
    "invitee_id" UUID,
    "email" TEXT,
    "status" "public"."ClubInvitationStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "club_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "club_invitations_club_id_invitee_id_key" ON "public"."club_invitations"("club_id", "invitee_id");

-- CreateIndex
CREATE UNIQUE INDEX "club_invitations_club_id_email_key" ON "public"."club_invitations"("club_id", "email");

-- AddForeignKey
ALTER TABLE "public"."club_invitations" ADD CONSTRAINT "club_invitations_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."club_invitations" ADD CONSTRAINT "club_invitations_inviter_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."club_invitations" ADD CONSTRAINT "club_invitations_invitee_id_fkey" FOREIGN KEY ("invitee_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
