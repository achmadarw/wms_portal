/**
 * Fix broken TRANSFER movements
 *
 * This script fixes TRANSFER movements that were processed with the old (broken) logic
 * where only binId was updated instead of properly transferring quantity between bins.
 *
 * Run with: npx tsx fix-transfer-movements.js
 * Or: node --loader ts-node/esm fix-transfer-movements.js
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function fixTransferMovements() {
    console.log('🔍 Scanning for broken TRANSFER movements...\n');

    try {
        // Find all COMPLETED TRANSFER movements
        const transfers = await prisma.movement.findMany({
            where: {
                type: 'TRANSFER',
                status: 'COMPLETED',
            },
            include: {
                item: {
                    include: {
                        itemMaster: true,
                        bin: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        console.log(`Found ${transfers.length} TRANSFER movements\n`);

        let fixed = 0;
        let skipped = 0;
        let errors = 0;

        for (const transfer of transfers) {
            try {
                const { fromBin, toBin, quantity, item } = transfer;

                if (!fromBin || !toBin || fromBin === toBin) {
                    console.log(
                        `⏭️  Skipping ${transfer.referenceNo} - Invalid bins`
                    );
                    skipped++;
                    continue;
                }

                console.log(`\n📦 Processing ${transfer.referenceNo}:`);
                console.log(
                    `   Item: ${item.itemMaster.name} (${item.itemMaster.sku})`
                );
                console.log(`   From Bin: ${fromBin}`);
                console.log(`   To Bin: ${toBin}`);
                console.log(`   Quantity: ${quantity}`);

                // Check current state of source bin
                const sourceItem = await prisma.inventoryItem.findFirst({
                    where: {
                        itemMasterId: item.itemMasterId,
                        warehouseId: item.warehouseId,
                        binId: fromBin,
                    },
                });

                // Check current state of destination bin
                const destItem = await prisma.inventoryItem.findFirst({
                    where: {
                        itemMasterId: item.itemMasterId,
                        warehouseId: item.warehouseId,
                        binId: toBin,
                    },
                });

                console.log(
                    `   Source bin current qty: ${sourceItem?.quantity || 0}`
                );
                console.log(
                    `   Dest bin current qty: ${destItem?.quantity || 0}`
                );

                // If destination already has the quantity, likely already fixed
                if (destItem && destItem.quantity >= quantity) {
                    console.log(
                        `   ✅ Already fixed (dest has sufficient qty)`
                    );
                    skipped++;
                    continue;
                }

                // Fix the transfer
                await prisma.$transaction(async (tx) => {
                    if (destItem) {
                        // Destination exists - increment
                        await tx.inventoryItem.update({
                            where: { id: destItem.id },
                            data: {
                                quantity: { increment: quantity },
                                availableQty: { increment: quantity },
                            },
                        });
                        console.log(
                            `   ✅ Incremented dest bin by ${quantity}`
                        );
                    } else {
                        // Create new destination inventory
                        await tx.inventoryItem.create({
                            data: {
                                itemMasterId: item.itemMasterId,
                                warehouseId: item.warehouseId,
                                binId: toBin,
                                quantity: quantity,
                                availableQty: quantity,
                                reservedQty: 0,
                            },
                        });
                        console.log(
                            `   ✅ Created new inventory in dest bin with qty ${quantity}`
                        );
                    }

                    if (sourceItem && sourceItem.quantity >= quantity) {
                        // Decrement source only if it has sufficient quantity
                        await tx.inventoryItem.update({
                            where: { id: sourceItem.id },
                            data: {
                                quantity: { decrement: quantity },
                                availableQty: { decrement: quantity },
                            },
                        });
                        console.log(
                            `   ✅ Decremented source bin by ${quantity}`
                        );
                    } else {
                        console.log(
                            `   ⚠️  WARNING: Source bin doesn't have enough qty to decrement`
                        );
                    }

                    // Update bin quantities
                    await tx.bin.update({
                        where: { id: fromBin },
                        data: { currentQty: { decrement: quantity } },
                    });
                    await tx.bin.update({
                        where: { id: toBin },
                        data: { currentQty: { increment: quantity } },
                    });
                    console.log(`   ✅ Updated bin quantities`);
                });

                console.log(`   ✅ FIXED ${transfer.referenceNo}`);
                fixed++;
            } catch (error) {
                console.error(
                    `   ❌ Error fixing ${transfer.referenceNo}:`,
                    error.message
                );
                errors++;
            }
        }

        console.log(`\n\n📊 Summary:`);
        console.log(`   Total transfers: ${transfers.length}`);
        console.log(`   ✅ Fixed: ${fixed}`);
        console.log(`   ⏭️  Skipped: ${skipped}`);
        console.log(`   ❌ Errors: ${errors}`);
    } catch (error) {
        console.error('❌ Fatal error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the fix
fixTransferMovements()
    .then(() => {
        console.log('\n✅ Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Failed:', error);
        process.exit(1);
    });
