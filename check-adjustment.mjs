/**
 * Check ADJUSTMENT movement for specific bin
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkAdjustment() {
    try {
        const binId = 'cmiwjmrqd000k2ia45max0tdo';

        console.log('🔍 Checking ADJUSTMENT movement for bin...\n');

        // Get bin info
        const bin = await prisma.bin.findUnique({
            where: { id: binId },
        });

        console.log(`📦 Bin: ${bin?.code} - Current Qty: ${bin?.currentQty}\n`);

        // Find inventory in this bin
        const inventory = await prisma.inventoryItem.findMany({
            where: { binId: binId },
            include: {
                itemMaster: true,
            },
        });

        console.log('📊 Current Inventory:');
        for (const inv of inventory) {
            console.log(
                `   ${inv.itemMaster.name}: ${inv.quantity} units (Available: ${inv.availableQty})`
            );
        }

        // Find ADJUSTMENT movements for this bin
        const adjustments = await prisma.movement.findMany({
            where: {
                type: 'ADJUSTMENT',
                fromBin: binId,
            },
            include: {
                item: {
                    include: {
                        itemMaster: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        console.log(`\n📝 Found ${adjustments.length} ADJUSTMENT movements:\n`);

        for (const adj of adjustments) {
            console.log(`Reference: ${adj.referenceNo}`);
            console.log(`Status: ${adj.status}`);
            console.log(`Item: ${adj.item.itemMaster.name}`);
            console.log(`Quantity (new value): ${adj.quantity}`);
            console.log(`Created: ${adj.createdAt}`);
            console.log(`Updated: ${adj.updatedAt}`);
            console.log('---\n');
        }

        // Check if there's a PENDING adjustment
        const pendingAdj = adjustments.find((adj) => adj.status === 'PENDING');
        if (pendingAdj) {
            console.log('⚠️  There is a PENDING adjustment!');
            console.log('   Need to PROCESS it to update inventory.');
            console.log(`   Movement ID: ${pendingAdj.id}`);
        }
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAdjustment();
