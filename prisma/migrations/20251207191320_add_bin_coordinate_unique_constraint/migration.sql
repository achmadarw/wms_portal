/*
  Warnings:

  - A unique constraint covering the columns `[warehouseId,row,column,level]` on the table `Bin` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Bin_warehouseId_row_column_level_key" ON "Bin"("warehouseId", "row", "column", "level");
