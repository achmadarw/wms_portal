import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkMovements() {
    // Get last 5 ADJUSTMENT movements
    const movements = await prisma.movement.findMany({
        where: { type: 'ADJUSTMENT' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
            referenceNo: true,
            status: true,
            quantity: true,
            fromBin: true,
            toBin: true,
            createdAt: true,
        },
    });

    console.log('\n=== Last 5 ADJUSTMENT Movements ===\n');
    movements.forEach((m, i) => {
        console.log(`${i + 1}. ${m.referenceNo}`);
        console.log(`   Status: ${m.status}`);
        console.log(`   Quantity: ${m.quantity}`);
        console.log(`   FromBin: ${m.fromBin || 'NULL'}`);
        console.log(
            `   ToBin: ${m.toBin || 'NULL'} ${!m.toBin ? '❌ MISSING!' : '✅'}`
        );
        console.log(`   Created: ${m.createdAt}`);
        console.log('');
    });

    await prisma.$disconnect();
}

checkMovements();
