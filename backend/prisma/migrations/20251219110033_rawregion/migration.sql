-- CreateTable
CREATE TABLE "RawProductRegion" (
    "id" TEXT NOT NULL,
    "rawProductId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,

    CONSTRAINT "RawProductRegion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RawProductRegion_rawProductId_regionId_key" ON "RawProductRegion"("rawProductId", "regionId");

-- AddForeignKey
ALTER TABLE "RawProductRegion" ADD CONSTRAINT "RawProductRegion_rawProductId_fkey" FOREIGN KEY ("rawProductId") REFERENCES "RawProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RawProductRegion" ADD CONSTRAINT "RawProductRegion_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
