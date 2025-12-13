import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function quickCheck() {
    const binId = 'cmiwjmrqd000k2ia45max0tdo';

    // Check bin
    const bin = await prisma.bin.findUnique({
        where: { id: binId },
        select: { code: true, currentQty: true, maxCapacity: true },
    });

    // Check inventory in bin
    const inv = await prisma.inventoryItem.findMany({
        where: { binId },
        select: { quantity: true, itemMaster: { select: { name: true } } },
    });

    // Check last ADJUSTMENT
    const lastAdj = await prisma.movement.findFirst({
        where: { type: 'ADJUSTMENT' },
        orderBy: { createdAt: 'desc' },
        select: {
            referenceNo: true,
            status: true,
            quantity: true,
            toBin: true,
            createdAt: true,
        },
    });

    console.log('\nBin:', bin);
    console.log('\nInventory:', inv);
    console.log('\nLast ADJUSTMENT:', lastAdj);

    const totalInv = inv.reduce((sum, i) => sum + i.quantity, 0);
    console.log('\n❌ MISMATCH:', bin.currentQty, '!=', totalInv);

    await prisma.$disconnect();
}

quickCheck();
