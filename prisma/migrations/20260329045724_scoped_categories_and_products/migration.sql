/*
  Warnings:

  - A unique constraint covering the columns `[name,storeId]` on the table `Category` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Category_name_key";

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "storeId" TEXT,
ALTER COLUMN "createdBy" SET DEFAULT 'ADMIN';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "createdBy" TEXT NOT NULL DEFAULT 'STORE',
ALTER COLUMN "storeId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Category_storeId_idx" ON "Category"("storeId");

-- CreateIndex
CREATE INDEX "Category_createdBy_idx" ON "Category"("createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_storeId_key" ON "Category"("name", "storeId");

-- CreateIndex
CREATE INDEX "Product_storeId_idx" ON "Product"("storeId");

-- CreateIndex
CREATE INDEX "Product_createdBy_idx" ON "Product"("createdBy");

-- CreateIndex
CREATE INDEX "Product_inStock_idx" ON "Product"("inStock");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
