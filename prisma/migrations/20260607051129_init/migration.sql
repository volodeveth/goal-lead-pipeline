-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('PENDING', 'ENRICHED', 'NOTIFIED', 'ENRICH_FAILED', 'NOTIFY_FAILED');

-- CreateEnum
CREATE TYPE "Temperature" AS ENUM ('HOT', 'WARM', 'COLD');

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "company" TEXT,
    "serviceInterest" TEXT[],
    "budgetRange" TEXT,
    "message" TEXT NOT NULL,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'PENDING',
    "failureReason" TEXT,
    "summary" TEXT,
    "temperature" "Temperature",
    "intent" TEXT,
    "priority" INTEGER,
    "confidence" DOUBLE PRECISION,
    "reasoning" TEXT,
    "enrichedAt" TIMESTAMP(3),
    "notifiedAt" TIMESTAMP(3),
    "telegramMessageId" TEXT,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Lead_requestId_key" ON "Lead"("requestId");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE INDEX "Lead_temperature_idx" ON "Lead"("temperature");

-- CreateIndex
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt");
