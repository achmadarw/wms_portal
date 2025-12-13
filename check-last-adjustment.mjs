import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

async function checkLastAdjustment() {
    try {
        console.log('\n=== CHECKING LAST ADJUSTMENT MOVEMENT ===\n');

        // Get last ADJUSTMENT movement
        const lastAdjustment = await prisma.movement.findFirst({
            where: { type: 'ADJUSTMENT' },
            orderBy: { createdAt: 'desc' },
            include: {
                item: {
                    include: {
                        itemMaster: {
                            select: {
                                sku: true,
                                name: true,
                            },
                        },
                        bin: {
                            select: {
                                code: true,
                                name: true,
                                currentQty: true,
                            },
                        },
                    },
                },
            },
        });

        if (!lastAdjustment) {
            console.log('❌ No ADJUSTMENT movements found');
            return;
        }

        console.log('📋 Last ADJUSTMENT Movement:');
        console.log(`  Reference: ${lastAdjustment.referenceNo}`);
        console.log(`  Status: ${lastAdjustment.status}`);
        console.log(`  Quantity: ${lastAdjustment.quantity}`);
        console.log(`  From Bin: ${lastAdjustment.fromBin || 'NULL'}`);
        console.log(`  To Bin: ${lastAdjustment.toBin || 'NULL'}`);
        console.log(`  Created At: ${lastAdjustment.createdAt}`);
        console.log(`  Updated At: ${lastAdjustment.updatedAt}`);

        console.log('\n📦 Inventory Item:');
        console.log(`  Item: ${lastAdjustment.item.itemMaster.name}`);
        console.log(`  SKU: ${lastAdjustment.item.itemMaster.sku}`);
        console.log(`  Current Qty: ${lastAdjustment.item.quantity}`);
        console.log(`  Available Qty: ${lastAdjustment.item.availableQty}`);
        console.log(
            `  Bin: ${lastAdjustment.item.bin.code} - ${lastAdjustment.item.bin.name}`
        );
        console.log(`  Bin Current Qty: ${lastAdjustment.item.bin.currentQty}`);

        console.log('\n🔍 Analysis:');
        if (!lastAdjustment.toBin) {
            console.log('  ⚠️  WARNING: toBin is NULL!');
            console.log('  This is why bin quantity was not updated.');
            console.log('  ADJUSTMENT movements must have toBin set.');
        } else if (
            lastAdjustment.toBin !== lastAdjustment.inventoryItem.binId
        ) {
            console.log(
                '  ⚠️  WARNING: toBin does not match inventoryItem.binId!'
            );
            console.log(`  toBin: ${lastAdjustment.toBin}`);
            console.log(
                `  inventoryItem.binId: ${lastAdjustment.inventoryItem.binId}`
            );
        } else {
            console.log('  ✅ toBin is correctly set');
            console.log('  Issue might be in the processing logic');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkLastAdjustment();
