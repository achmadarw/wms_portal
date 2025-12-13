import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixBinData() {
    const binId = 'cmiwjmrqd000k2ia45max0tdo';

    console.log('🔧 Fixing bin quantity data...\n');

    // Get all inventory in bin
    const items = await prisma.inventoryItem.findMany({
        where: { binId },
        select: {
            quantity: true,
            itemMaster: { select: { name: true, sku: true } },
        },
    });

    const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);

    console.log('Items in bin:');
    items.forEach((i) => {
        console.log(
            `  - ${i.itemMaster.name} (${i.itemMaster.sku}): ${i.quantity}`
        );
    });
    console.log(`\nTotal inventory: ${totalQty}`);

    // Update bin
    const updated = await prisma.bin.update({
        where: { id: binId },
        data: { currentQty: totalQty },
    });

    console.log(
        `\n✅ Bin ${updated.code} updated: currentQty = ${updated.currentQty}`
    );

    await prisma.$disconnect();
}

fixBinData();
