/*
  Warnings:

  - Added the required column `shopId` to the `coupons` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "coupons" ADD COLUMN     "shopId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
