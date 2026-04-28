-- AlterTable
ALTER TABLE "Dealer" ADD COLUMN     "contacted_at" TIMESTAMP(3),
ADD COLUMN     "contacted_by_id" TEXT;

-- CreateTable
CREATE TABLE "DealerContactAudit" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "previousContacted" BOOLEAN,
    "nextContacted" BOOLEAN,
    "previousContactedAt" TIMESTAMP(3),
    "nextContactedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "DealerContactAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DealerContactAudit_dealerId_createdAt_idx" ON "DealerContactAudit"("dealerId", "createdAt");

-- AddForeignKey
ALTER TABLE "Dealer" ADD CONSTRAINT "Dealer_contacted_by_id_fkey" FOREIGN KEY ("contacted_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealerContactAudit" ADD CONSTRAINT "DealerContactAudit_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "Dealer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealerContactAudit" ADD CONSTRAINT "DealerContactAudit_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
