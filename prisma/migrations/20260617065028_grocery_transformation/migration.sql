/*
  Warnings:

  - You are about to drop the column `brand` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `color` on the `ProductVariant` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `ProductVariant` table. All the data in the column will be lost.
  - You are about to drop the column `stock` on the `ProductVariant` table. All the data in the column will be lost.
  - Added the required column `variantName` to the `ProductVariant` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "ProductStatus" ADD VALUE 'OUT_OF_STOCK';

-- DropIndex
DROP INDEX "ProductVariant_stock_idx";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "brand",
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isOrganic" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ProductVariant" DROP COLUMN "color",
DROP COLUMN "size",
DROP COLUMN "stock",
ADD COLUMN     "variantName" TEXT NOT NULL;
