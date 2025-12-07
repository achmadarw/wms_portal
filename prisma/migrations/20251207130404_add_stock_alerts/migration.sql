-- CreateTable
CREATE TABLE "StockAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "alertType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "itemMasterId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "currentQty" INTEGER NOT NULL,
    "threshold" INTEGER NOT NULL,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedBy" TEXT,
    "acknowledgedAt" DATETIME,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "emailSentAt" DATETIME,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StockAlert_itemMasterId_fkey" FOREIGN KEY ("itemMasterId") REFERENCES "ItemMaster" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StockAlert_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "StockAlert_alertType_idx" ON "StockAlert"("alertType");

-- CreateIndex
CREATE INDEX "StockAlert_severity_idx" ON "StockAlert"("severity");

-- CreateIndex
CREATE INDEX "StockAlert_acknowledged_idx" ON "StockAlert"("acknowledged");

-- CreateIndex
CREATE INDEX "StockAlert_resolved_idx" ON "StockAlert"("resolved");

-- CreateIndex
CREATE INDEX "StockAlert_createdAt_idx" ON "StockAlert"("createdAt");

-- CreateIndex
CREATE INDEX "StockAlert_itemMasterId_idx" ON "StockAlert"("itemMasterId");

-- CreateIndex
CREATE INDEX "StockAlert_warehouseId_idx" ON "StockAlert"("warehouseId");
