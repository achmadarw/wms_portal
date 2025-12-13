/**
 * Find all TRANSFER movements from a specific bin
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function findTransfers() {
    try {
        console.log('🔍 Finding all TRANSFER movements from Bin A-01-01...\n');

        const fromBinId = 'cmiwjmrqd000i2ia4l8j553vj'; // A-01-01
        const warehouseId = 'cmiw0mg1c000m135j3ob4dv03'; // Bandung

        const transfers = await prisma.movement.findMany({
            where: {
                type: 'TRANSFER',
                warehouseId: warehouseId,
                fromBin: fromBinId,
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

        console.log(`Found ${transfers.length} TRANSFER movements:\n`);

        for (const transfer of transfers) {
            console.log(`Reference: ${transfer.referenceNo}`);
            console.log(`Status: ${transfer.status}`);
            console.log(`Item: ${transfer.item.itemMaster.name}`);
            console.log(`Quantity: ${transfer.quantity}`);
            console.log(`From Bin: ${transfer.fromBin}`);
            console.log(`To Bin: ${transfer.toBin}`);
            console.log(`Created: ${transfer.createdAt}`);
            console.log(`---\n`);
        }

        // Check bin A-01-02
        const toBinId = 'cmiwjmrqd000j2ia4h5y9j49w';
        const toBin = await prisma.bin.findUnique({
            where: { id: toBinId },
        });

        console.log(`\n📦 Destination Bin: ${toBin?.code}`);
        console.log(`Current Qty: ${toBin?.currentQty}\n`);

        // Check inventory in both bins
        const allInventory = await prisma.inventoryItem.findMany({
            where: {
                warehouseId: warehouseId,
                binId: {
                    in: [fromBinId, toBinId],
                },
            },
            include: {
                itemMaster: true,
                bin: true,
            },
        });

        console.log('📊 Current Inventory:\n');
        for (const inv of allInventory) {
            console.log(
                `Bin: ${inv.bin?.code} - Item: ${inv.itemMaster.name} - Qty: ${inv.quantity}`
            );
        }
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

findTransfers();
