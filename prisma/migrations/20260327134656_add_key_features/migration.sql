-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "keyFeatures" TEXT[] DEFAULT ARRAY[]::TEXT[];
