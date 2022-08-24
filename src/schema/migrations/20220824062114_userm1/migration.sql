-- CreateEnum
CREATE TYPE "AccountEnum" AS ENUM ('REVIEWED', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "Warehouses" (
    "id" SERIAL NOT NULL,
    "areaname" TEXT NOT NULL,
    "assletter" TEXT NOT NULL,
    "locid" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" SERIAL NOT NULL,
    "locid" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "firstname" TEXT NOT NULL,
    "lastname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "account" "AccountEnum" NOT NULL DEFAULT 'REVIEWED',
    "rejectedreason" TEXT,
    "locid" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Warehouses_locid_key" ON "Warehouses"("locid");

-- CreateIndex
CREATE UNIQUE INDEX "Location_locid_key" ON "Location"("locid");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_locid_key" ON "User"("locid");

-- AddForeignKey
ALTER TABLE "Warehouses" ADD CONSTRAINT "Warehouses_locid_fkey" FOREIGN KEY ("locid") REFERENCES "Location"("locid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_locid_fkey" FOREIGN KEY ("locid") REFERENCES "Location"("locid") ON DELETE RESTRICT ON UPDATE CASCADE;
