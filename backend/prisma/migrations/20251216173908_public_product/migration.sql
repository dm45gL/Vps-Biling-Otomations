-- CreateTable
CREATE TABLE "PublicProduct" (
    "id" TEXT NOT NULL,
    "rawProductId" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PublicProduct_publicId_key" ON "PublicProduct"("publicId");

-- AddForeignKey
ALTER TABLE "PublicProduct" ADD CONSTRAINT "PublicProduct_rawProductId_fkey" FOREIGN KEY ("rawProductId") REFERENCES "RawProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
