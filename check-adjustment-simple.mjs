import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkLastAdjustment() {
    try {
        console.log('\n=== CHECKING LAST ADJUSTMENT MOVEMENT ===\n');

        const lastAdj = await prisma.movement.findFirst({
            where: { type: 'ADJUSTMENT' },
            orderBy: { createdAt: 'desc' },
        });

        if (!lastAdj) {
            console.log('❌ No ADJUSTMENT found');
            return;
        }

        console.log('Movement:', lastAdj.referenceNo);
        console.log('Status:', lastAdj.status);
        console.log('Quantity:', lastAdj.quantity);
        console.log('FromBin:', lastAdj.fromBin);
        console.log('ToBin:', lastAdj.toBin);
        console.log('ItemId:', lastAdj.itemId);
        console.log('');

        if (!lastAdj.toBin) {
            console.log('⚠️  PROBLEM FOUND: toBin is NULL!');
            console.log('This is why bin was not updated.');
            console.log(
                'ADJUSTMENT must have toBin set to update bin quantity.'
            );
        } else {
            console.log('✅ toBin is set:', lastAdj.toBin);
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkLastAdjustment();
