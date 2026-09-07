-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('CPU', 'GPU', 'RAM', 'SSD');

-- CreateEnum
CREATE TYPE "ScrapeStatus" AS ENUM ('SUCCESS', 'FAILED', 'PARTIAL');

-- CreateEnum
CREATE TYPE "TriggerType" AS ENUM ('SCHEDULED', 'MANUAL');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'PARTIAL', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "modelNumber" TEXT,
    "description" TEXT,
    "specs" JSONB,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "referencePrice" DECIMAL(12,2),
    "referenceComputedAt" TIMESTAMPTZ(3),
    "historyDays" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Retailer" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Retailer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSource" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "retailerId" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "retailerProductName" TEXT,
    "retailerSku" TEXT,
    "currentPrice" DECIMAL(12,2),
    "regularPrice" DECIMAL(12,2),
    "inStock" BOOLEAN,
    "lastCheckedAt" TIMESTAMPTZ(3),
    "lastSuccessAt" TIMESTAMPTZ(3),
    "lastError" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ProductSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceSnapshot" (
    "id" UUID NOT NULL,
    "productSourceId" UUID NOT NULL,
    "price" DECIMAL(12,2),
    "regularPrice" DECIMAL(12,2),
    "inStock" BOOLEAN,
    "checkedAt" TIMESTAMPTZ(3) NOT NULL,
    "status" "ScrapeStatus" NOT NULL,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScrapeJob" (
    "id" UUID NOT NULL,
    "triggerType" "TriggerType" NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMPTZ(3),
    "finishedAt" TIMESTAMPTZ(3),
    "heartbeatAt" TIMESTAMPTZ(3),
    "totalSources" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScrapeJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScrapeLog" (
    "id" UUID NOT NULL,
    "scrapeJobId" UUID NOT NULL,
    "productSourceId" UUID,
    "retailerId" UUID,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "durationMs" INTEGER,
    "price" DECIMAL(12,2),
    "parser" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScrapeLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_modelNumber_idx" ON "Product"("modelNumber");

-- CreateIndex
CREATE INDEX "Product_category_brand_isActive_idx" ON "Product"("category", "brand", "isActive");

-- CreateIndex
CREATE INDEX "Product_isDemo_isActive_idx" ON "Product"("isDemo", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Retailer_slug_key" ON "Retailer"("slug");

-- CreateIndex
CREATE INDEX "ProductSource_retailerId_idx" ON "ProductSource"("retailerId");

-- CreateIndex
CREATE INDEX "ProductSource_lastCheckedAt_idx" ON "ProductSource"("lastCheckedAt");

-- CreateIndex
CREATE INDEX "ProductSource_isActive_isDemo_idx" ON "ProductSource"("isActive", "isDemo");

-- CreateIndex
CREATE UNIQUE INDEX "ProductSource_productId_retailerId_key" ON "ProductSource"("productId", "retailerId");

-- CreateIndex
CREATE INDEX "PriceSnapshot_productSourceId_checkedAt_idx" ON "PriceSnapshot"("productSourceId", "checkedAt");

-- CreateIndex
CREATE INDEX "PriceSnapshot_checkedAt_idx" ON "PriceSnapshot"("checkedAt");

-- CreateIndex
CREATE INDEX "ScrapeJob_status_createdAt_idx" ON "ScrapeJob"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ScrapeLog_scrapeJobId_createdAt_idx" ON "ScrapeLog"("scrapeJobId", "createdAt");

-- AddForeignKey
ALTER TABLE "ProductSource" ADD CONSTRAINT "ProductSource_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSource" ADD CONSTRAINT "ProductSource_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES "Retailer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceSnapshot" ADD CONSTRAINT "PriceSnapshot_productSourceId_fkey" FOREIGN KEY ("productSourceId") REFERENCES "ProductSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScrapeLog" ADD CONSTRAINT "ScrapeLog_scrapeJobId_fkey" FOREIGN KEY ("scrapeJobId") REFERENCES "ScrapeJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScrapeLog" ADD CONSTRAINT "ScrapeLog_productSourceId_fkey" FOREIGN KEY ("productSourceId") REFERENCES "ProductSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScrapeLog" ADD CONSTRAINT "ScrapeLog_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES "Retailer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
