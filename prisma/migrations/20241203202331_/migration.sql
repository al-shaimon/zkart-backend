/*
  Warnings:

  - The values [COMPLETED] on the enum `PaymentStatus` will be removed. If these variants are still used in the database, this will fail.
  - The primary key for the `cart_items` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `cartItemId` on the `cart_items` table. All the data in the column will be lost.
  - You are about to drop the column `response` on the `review_responses` table. All the data in the column will be lost.
  - You are about to drop the column `followedAt` on the `shop_followers` table. All the data in the column will be lost.
  - You are about to drop the column `isBlacklisted` on the `shops` table. All the data in the column will be lost.
  - You are about to drop the column `shopName` on the `shops` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[shopId,customerId]` on the table `shop_followers` will be added. If there are existing duplicate values, this will fail.
  - The required column `id` was added to the `cart_items` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `updatedAt` to the `order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `comment` to the `review_responses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `shops` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PaymentStatus_new" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');
ALTER TABLE "orders" ALTER COLUMN "paymentStatus" DROP DEFAULT;
ALTER TABLE "orders" ALTER COLUMN "paymentStatus" TYPE "PaymentStatus_new" USING ("paymentStatus"::text::"PaymentStatus_new");
ALTER TYPE "PaymentStatus" RENAME TO "PaymentStatus_old";
ALTER TYPE "PaymentStatus_new" RENAME TO "PaymentStatus";
DROP TYPE "PaymentStatus_old";
ALTER TABLE "orders" ALTER COLUMN "paymentStatus" SET DEFAULT 'PENDING';
COMMIT;

-- DropIndex
DROP INDEX "shop_followers_customerId_shopId_key";

-- DropIndex
DROP INDEX "shops_vendorId_key";

-- AlterTable
ALTER TABLE "cart_items" DROP CONSTRAINT "cart_items_pkey",
DROP COLUMN "cartItemId",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "image" TEXT,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "review_responses" DROP COLUMN "response",
ADD COLUMN     "comment" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "shop_followers" DROP COLUMN "followedAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "shops" DROP COLUMN "isBlacklisted",
DROP COLUMN "shopName",
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "name" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "shop_followers_shopId_customerId_key" ON "shop_followers"("shopId", "customerId");
