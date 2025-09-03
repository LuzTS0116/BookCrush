-- CreateTable
CREATE TABLE "public"."push_subscriptions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "push_subscriptions_userId_idx" ON "public"."push_subscriptions"("userId");

-- CreateIndex
CREATE INDEX "push_subscriptions_type_idx" ON "public"."push_subscriptions"("type");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_userId_type_key" ON "public"."push_subscriptions"("userId", "type");

-- AddForeignKey
ALTER TABLE "public"."push_subscriptions" ADD CONSTRAINT "push_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
