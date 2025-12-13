/**
 * Script untuk memeriksa dan memverifikasi ADJUSTMENT movements
 *
 * Script ini akan:
 * 1. Menampilkan semua ADJUSTMENT movements
 * 2. Menampilkan delta (perubahan) untuk setiap adjustment
 * 3. Memverifikasi bahwa bin dan inventory sync dengan benar
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdjustments() {
    console.log('='.repeat(80));
    console.log('CHECKING ADJUSTMENT MOVEMENTS');
    console.log('='.repeat(80));

    // Get all ADJUSTMENT movements
    const adjustments = await prisma.movement.findMany({
        where: {
            type: 'ADJUSTMENT',
        },
        include: {
            item: {
                include: {
                    itemMaster: true,
                    bin: true,
                },
            },
            warehouse: true,
            createdBy: {
                select: {
                    fullName: true,
                    email: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: 20,
    });

    console.log(`\nFound ${adjustments.length} ADJUSTMENT movements:\n`);

    for (const adj of adjustments) {
        console.log('-'.repeat(80));
        console.log(`Reference: ${adj.referenceNo}`);
        console.log(
            `Item: ${adj.item.itemMaster.name} (${adj.item.itemMaster.sku})`
        );
        console.log(`Warehouse: ${adj.warehouse.name}`);
        console.log(`Bin: ${adj.item.bin?.code || 'N/A'}`);
        console.log(`Status: ${adj.status}`);
        console.log(`Created: ${adj.createdAt.toISOString()}`);
        console.log(`Created By: ${adj.createdBy.fullName}`);

        // Display quantity (should be delta for new adjustments)
        const delta = adj.quantity;
        const deltaDisplay = delta > 0 ? `+${delta}` : delta;
        console.log(
            `Delta: ${deltaDisplay} ${adj.item.itemMaster.unitOfMeasure}`
        );

        // Current inventory status
        console.log(`\nCurrent Inventory:`);
        console.log(`  - Quantity: ${adj.item.quantity}`);
        console.log(`  - Available: ${adj.item.availableQty}`);

        if (adj.item.bin) {
            console.log(`\nBin Status:`);
            console.log(`  - Current Qty: ${adj.item.bin.currentQty}`);
            console.log(`  - Max Capacity: ${adj.item.bin.maxCapacity}`);
            console.log(
                `  - Utilization: ${(
                    (adj.item.bin.currentQty / adj.item.bin.maxCapacity) *
                    100
                ).toFixed(1)}%`
            );
        }

        // Verify sync
        if (adj.item.bin && adj.item.bin.currentQty !== adj.item.quantity) {
            console.log(`\n⚠️  WARNING: Bin and Inventory NOT SYNCED!`);
            console.log(
                `   Bin Qty: ${adj.item.bin.currentQty}, Inventory Qty: ${adj.item.quantity}`
            );
        } else if (adj.item.bin) {
            console.log(`\n✅ Bin and Inventory are SYNCED`);
        }

        console.log('');
    }

    console.log('='.repeat(80));

    // Summary statistics
    const stats = {
        total: adjustments.length,
        pending: adjustments.filter((a) => a.status === 'PENDING').length,
        completed: adjustments.filter((a) => a.status === 'COMPLETED').length,
        cancelled: adjustments.filter((a) => a.status === 'CANCELLED').length,
        positive: adjustments.filter((a) => a.quantity > 0).length,
        negative: adjustments.filter((a) => a.quantity < 0).length,
        zero: adjustments.filter((a) => a.quantity === 0).length,
    };

    console.log('\nSUMMARY:');
    console.log(`Total Adjustments: ${stats.total}`);
    console.log(`  - Pending: ${stats.pending}`);
    console.log(`  - Completed: ${stats.completed}`);
    console.log(`  - Cancelled: ${stats.cancelled}`);
    console.log(`\nBy Change Type:`);
    console.log(`  - Positive (+): ${stats.positive}`);
    console.log(`  - Negative (-): ${stats.negative}`);
    console.log(`  - Zero (0): ${stats.zero}`);

    console.log('\n' + '='.repeat(80));
}

checkAdjustments()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
