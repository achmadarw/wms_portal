/*
  Warnings:

  - You are about to drop the column `category` on the `ItemMaster` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Insert default categories from existing data
INSERT INTO "Category" ("id", "code", "name", "description", "createdAt", "updatedAt")
SELECT 
    lower(hex(randomblob(16))),
    category,
    category,
    'Auto-created from existing items',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM (
    SELECT DISTINCT category FROM "ItemMaster" WHERE category IS NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ItemMaster" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sku" TEXT NOT NULL,
    "barcode" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" TEXT,
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
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ItemMaster_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Copy data and link to categories
INSERT INTO "new_ItemMaster" ("active", "barcode", "createdAt", "description", "dimensions", "id", "imageUrl", "manufacturer", "maxStockLevel", "minStockLevel", "name", "reorderPoint", "reorderQty", "sellingPrice", "sku", "supplier", "unitCost", "unitOfMeasure", "updatedAt", "weight", "categoryId")
SELECT 
    i."active", i."barcode", i."createdAt", i."description", i."dimensions", i."id", i."imageUrl", 
    i."manufacturer", i."maxStockLevel", i."minStockLevel", i."name", i."reorderPoint", i."reorderQty", 
    i."sellingPrice", i."sku", i."supplier", i."unitCost", i."unitOfMeasure", i."updatedAt", i."weight",
    c."id" as "categoryId"
FROM "ItemMaster" i
LEFT JOIN "Category" c ON c.code = i.category;

DROP TABLE "ItemMaster";
ALTER TABLE "new_ItemMaster" RENAME TO "ItemMaster";
CREATE UNIQUE INDEX "ItemMaster_sku_key" ON "ItemMaster"("sku");
CREATE UNIQUE INDEX "ItemMaster_barcode_key" ON "ItemMaster"("barcode");
CREATE INDEX "ItemMaster_sku_idx" ON "ItemMaster"("sku");
CREATE INDEX "ItemMaster_barcode_idx" ON "ItemMaster"("barcode");
CREATE INDEX "ItemMaster_categoryId_idx" ON "ItemMaster"("categoryId");
CREATE INDEX "ItemMaster_active_idx" ON "ItemMaster"("active");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Category_code_key" ON "Category"("code");

-- CreateIndex
CREATE INDEX "Category_code_idx" ON "Category"("code");

-- CreateIndex
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");
