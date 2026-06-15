-- AlterTable
ALTER TABLE "Bill" ADD COLUMN     "employeeId" TEXT;

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "employeeId" TEXT;

-- CreateIndex
CREATE INDEX "Bill_employeeId_idx" ON "Bill"("employeeId");

-- CreateIndex
CREATE INDEX "Sale_employeeId_idx" ON "Sale"("employeeId");

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
