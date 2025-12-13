import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

async function checkBinQuantity() {
    try {
        const binId = 'cmiwjmrqd000k2ia45max0tdo';

        console.log('\n=== CHECKING BIN QUANTITY ===\n');

        // Get bin info
        const bin = await prisma.bin.findUnique({
            where: { id: binId },
            include: {
                warehouse: true,
            },
        });

        console.log('📦 Bin Info:');
        console.log(`  Code: ${bin.code}`);
        console.log(`  Name: ${bin.name}`);
        console.log(`  Current Qty (Bin): ${bin.currentQty}`);
        console.log(`  Max Capacity: ${bin.maxCapacity}`);
        console.log(`  Warehouse: ${bin.warehouse.name}`);

        // Get all inventory items in this bin
        const inventoryItems = await prisma.inventoryItem.findMany({
            where: { binId },
            include: {
                itemMaster: {
                    select: {
                        sku: true,
                        name: true,
                    },
                },
            },
        });

        console.log('\n📊 Inventory Items in This Bin:');
        let totalActualQty = 0;
        inventoryItems.forEach((item) => {
            console.log(`  - ${item.itemMaster.name} (${item.itemMaster.sku})`);
            console.log(`    Quantity: ${item.quantity}`);
            console.log(`    Available: ${item.availableQty}`);
            totalActualQty += item.quantity;
        });

        console.log(`\n📈 Summary:`);
        console.log(`  Bin.currentQty: ${bin.currentQty}`);
        console.log(`  Actual Total Inventory: ${totalActualQty}`);
        console.log(`  Difference: ${bin.currentQty - totalActualQty}`);

        if (bin.currentQty !== totalActualQty) {
            console.log('\n⚠️  BIN QUANTITY MISMATCH DETECTED!');
            console.log(`   Bin says: ${bin.currentQty}`);
            console.log(`   Should be: ${totalActualQty}`);

            // Fix it
            console.log('\n🔧 Fixing bin quantity...');
            const updated = await prisma.bin.update({
                where: { id: binId },
                data: { currentQty: totalActualQty },
            });
            console.log(`✅ Bin quantity updated to ${updated.currentQty}`);
        } else {
            console.log('\n✅ Bin quantity is correct!');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkBinQuantity();
