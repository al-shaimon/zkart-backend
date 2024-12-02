/*
  Warnings:

  - You are about to drop the column `phone` on the `customers` table. All the data in the column will be lost.
  - Added the required column `contactNumber` to the `customers` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "customers" DROP COLUMN "phone",
ADD COLUMN     "contactNumber" TEXT NOT NULL,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;
