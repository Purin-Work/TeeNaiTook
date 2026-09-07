-- One leased worker globally, including manual single-source tests.
CREATE UNIQUE INDEX "ScrapeJob_one_active" ON "ScrapeJob" ((true)) WHERE "status" IN ('PENDING', 'RUNNING');

ALTER TABLE "ProductSource" ADD CONSTRAINT "ProductSource_positive_price" CHECK ("currentPrice" IS NULL OR "currentPrice" > 0);
ALTER TABLE "PriceSnapshot" ADD CONSTRAINT "PriceSnapshot_positive_price" CHECK ("price" IS NULL OR "price" > 0);
ALTER TABLE "PriceSnapshot" ADD CONSTRAINT "PriceSnapshot_success_requires_price_stock" CHECK ("status" <> 'SUCCESS' OR ("price" IS NOT NULL AND "inStock" IS NOT NULL));

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX "Product_name_trgm" ON "Product" USING gin ("name" gin_trgm_ops);
CREATE INDEX "Product_brand_trgm" ON "Product" USING gin ("brand" gin_trgm_ops);
CREATE INDEX "Product_model_trgm" ON "Product" USING gin ("modelNumber" gin_trgm_ops);
