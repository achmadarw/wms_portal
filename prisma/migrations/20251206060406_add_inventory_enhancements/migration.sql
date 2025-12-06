-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_InventoryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "reservedQty" INTEGER NOT NULL DEFAULT 0,
    "availableQty" INTEGER NOT NULL DEFAULT 0,
    "batchNumber" TEXT,
    "expiryDate" DATETIME,
    "manufacturingDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastCountDate" DATETIME,
    "itemMasterId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "binId" TEXT,
    CONSTRAINT "InventoryItem_itemMasterId_fkey" FOREIGN KEY ("itemMasterId") REFERENCES "ItemMaster" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InventoryItem_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InventoryItem_binId_fkey" FOREIGN KEY ("binId") REFERENCES "Bin" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_InventoryItem" ("binId", "createdAt", "id", "itemMasterId", "quantity", "updatedAt", "warehouseId") SELECT "binId", "createdAt", "id", "itemMasterId", "quantity", "updatedAt", "warehouseId" FROM "InventoryItem";
DROP TABLE "InventoryItem";
ALTER TABLE "new_InventoryItem" RENAME TO "InventoryItem";
CREATE INDEX "InventoryItem_itemMasterId_idx" ON "InventoryItem"("itemMasterId");
CREATE INDEX "InventoryItem_warehouseId_idx" ON "InventoryItem"("warehouseId");
CREATE INDEX "InventoryItem_binId_idx" ON "InventoryItem"("binId");
CREATE INDEX "InventoryItem_batchNumber_idx" ON "InventoryItem"("batchNumber");
CREATE INDEX "InventoryItem_expiryDate_idx" ON "InventoryItem"("expiryDate");
CREATE UNIQUE INDEX "InventoryItem_itemMasterId_warehouseId_binId_key" ON "InventoryItem"("itemMasterId", "warehouseId", "binId");
CREATE TABLE "new_ItemMaster" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sku" TEXT NOT NULL,
    "barcode" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "unitOfMeasure" TEXT NOT NULL DEFAULT 'PCS',
    "weight" REAL,
    "dimensions" TEXT,
    "unitCost" REAL NOT NULL DEFAULT 0,
    "sellingPrice" REAL,
    "minStockLevel" INTEGER NOT NULL DEFAULT 0,
    "maxStockLevel" INTEGER,
    "reorderPoint" INTEGER NOT NULL DEFAULT 0,
    "reorderQty" INTEGER NOT NULL DEFAULT 0,
    "manufacturer" TEXT,
    "supplier" TEXT,
    "imageUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ItemMaster" ("active", "category", "createdAt", "description", "dimensions", "id", "name", "sellingPrice", "sku", "unitCost", "unitOfMeasure", "updatedAt", "weight") SELECT "active", "category", "createdAt", "description", "dimensions", "id", "name", "sellingPrice", "sku", "unitCost", "unitOfMeasure", "updatedAt", "weight" FROM "ItemMaster";
DROP TABLE "ItemMaster";
ALTER TABLE "new_ItemMaster" RENAME TO "ItemMaster";
CREATE UNIQUE INDEX "ItemMaster_sku_key" ON "ItemMaster"("sku");
CREATE UNIQUE INDEX "ItemMaster_barcode_key" ON "ItemMaster"("barcode");
CREATE INDEX "ItemMaster_sku_idx" ON "ItemMaster"("sku");
CREATE INDEX "ItemMaster_barcode_idx" ON "ItemMaster"("barcode");
CREATE INDEX "ItemMaster_category_idx" ON "ItemMaster"("category");
CREATE INDEX "ItemMaster_active_idx" ON "ItemMaster"("active");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
