import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedInventory() {
    console.log('🌱 Starting Inventory Seed...\n');

    try {
        // 1. Get Warehouses
        console.log('📦 Fetching warehouses...');
        const jakarta = await prisma.warehouse.findFirst({
            where: { code: 'WH-JKT-001' },
        });

        const surabaya = await prisma.warehouse.findFirst({
            where: { code: 'WH-SBY-001' },
        });

        const bandung = await prisma.warehouse.findFirst({
            where: { code: 'WH-BDG-001' },
        });

        if (!jakarta || !surabaya || !bandung) {
            throw new Error(
                '❌ Warehouses not found! Please seed warehouses first.'
            );
        }
        console.log('✅ Found 3 warehouses\n');

        // 2. Get Item Masters
        console.log('📦 Fetching item masters...');
        const items = await prisma.itemMaster.findMany({
            where: {
                sku: {
                    in: [
                        'LAP-DELL-001',
                        'LAP-HP-001',
                        'LAP-LEN-001',
                        'PHONE-APL-001',
                        'PHONE-SAM-001',
                        'ACC-MOU-001',
                        'ACC-KEY-001',
                        'ACC-HUB-001',
                        'BOOK-NOT-001',
                    ],
                },
            },
        });

        if (items.length === 0) {
            throw new Error(
                '❌ Items not found! Please seed item masters first.'
            );
        }
        console.log(`✅ Found ${items.length} items\n`);

        // Create SKU map for easy access
        const itemMap: Record<string, string> = {};
        items.forEach((item) => {
            itemMap[item.sku] = item.id;
        });

        // 3. Get Bins
        console.log('📦 Fetching bins...');
        const bins = await prisma.bin.findMany({
            where: {
                warehouseId: {
                    in: [jakarta.id, surabaya.id, bandung.id],
                },
            },
        });

        if (bins.length === 0) {
            throw new Error('❌ Bins not found! Please seed bins first.');
        }
        console.log(`✅ Found ${bins.length} bins\n`);

        // Helper function to find bin
        const findBin = (warehouseId: string, code: string) => {
            return bins.find(
                (b) => b.warehouseId === warehouseId && b.code === code
            );
        };

        // 4. Define Inventory Data based on TEST_DATA_COMPLETE.sql
        console.log('📦 Creating inventory items...\n');

        const inventoryData = [
            // JAKARTA WAREHOUSE
            {
                itemMasterId: itemMap['LAP-DELL-001'],
                warehouseId: jakarta.id,
                binId: findBin(jakarta.id, 'A-01-01')?.id,
                quantity: 25,
                availableQty: 20,
                reservedQty: 5,
                name: 'Dell XPS 15 @ Jakarta A-01-01',
            },
            {
                itemMasterId: itemMap['LAP-HP-001'],
                warehouseId: jakarta.id,
                binId: findBin(jakarta.id, 'A-02-01')?.id,
                quantity: 45,
                availableQty: 45,
                reservedQty: 0,
                name: 'HP Pavilion @ Jakarta A-02-01',
            },
            {
                itemMasterId: itemMap['ACC-MOU-001'],
                warehouseId: jakarta.id,
                binId: findBin(jakarta.id, 'B-01-01')?.id,
                quantity: 150,
                availableQty: 120,
                reservedQty: 30,
                name: 'Logitech Mouse @ Jakarta B-01-01',
            },
            {
                itemMasterId: itemMap['ACC-KEY-001'],
                warehouseId: jakarta.id,
                binId: findBin(jakarta.id, 'B-02-01')?.id,
                quantity: 80,
                availableQty: 70,
                reservedQty: 10,
                name: 'Keychron Keyboard @ Jakarta B-02-01',
            },
            {
                itemMasterId: itemMap['PHONE-APL-001'],
                warehouseId: jakarta.id,
                binId: findBin(jakarta.id, 'C-01-01')?.id,
                quantity: 35,
                availableQty: 30,
                reservedQty: 5,
                name: 'iPhone 15 Pro @ Jakarta C-01-01',
            },

            // SURABAYA WAREHOUSE
            {
                itemMasterId: itemMap['LAP-DELL-001'],
                warehouseId: surabaya.id,
                binId: findBin(surabaya.id, 'A-01-01')?.id,
                quantity: 15,
                availableQty: 15,
                reservedQty: 0,
                name: 'Dell XPS 15 @ Surabaya A-01-01',
            },
            {
                itemMasterId: itemMap['PHONE-SAM-001'],
                warehouseId: surabaya.id,
                binId: findBin(surabaya.id, 'A-02-01')?.id,
                quantity: 40,
                availableQty: 35,
                reservedQty: 5,
                name: 'Samsung Galaxy S24 @ Surabaya A-02-01',
            },
            {
                itemMasterId: itemMap['BOOK-NOT-001'],
                warehouseId: surabaya.id,
                binId: findBin(surabaya.id, 'B-01-01')?.id,
                quantity: 500,
                availableQty: 500,
                reservedQty: 0,
                name: 'Moleskine Notebook @ Surabaya B-01-01',
            },

            // BANDUNG WAREHOUSE (LOW STOCK for testing alerts)
            {
                itemMasterId: itemMap['LAP-LEN-001'],
                warehouseId: bandung.id,
                binId: findBin(bandung.id, 'A-01-01')?.id,
                quantity: 5,
                availableQty: 5,
                reservedQty: 0,
                name: 'Lenovo ThinkPad @ Bandung A-01-01 (LOW STOCK)',
            },
            {
                itemMasterId: itemMap['ACC-HUB-001'],
                warehouseId: bandung.id,
                binId: findBin(bandung.id, 'A-02-01')?.id,
                quantity: 45,
                availableQty: 45,
                reservedQty: 0,
                name: 'USB-C Hub @ Bandung A-02-01 (LOW STOCK)',
            },
        ];

        // 5. Create inventory items
        let created = 0;
        for (const data of inventoryData) {
            if (!data.itemMasterId) {
                console.log(
                    `⚠️  Skipping ${data.name} - Item master not found`
                );
                continue;
            }
            if (!data.binId) {
                console.log(`⚠️  Skipping ${data.name} - Bin not found`);
                continue;
            }

            try {
                // Check if already exists
                const existing = await prisma.inventoryItem.findFirst({
                    where: {
                        itemMasterId: data.itemMasterId,
                        warehouseId: data.warehouseId,
                        binId: data.binId,
                    },
                });

                if (existing) {
                    console.log(`⏭️  Already exists: ${data.name}`);
                    continue;
                }

                await prisma.inventoryItem.create({
                    data: {
                        itemMasterId: data.itemMasterId,
                        warehouseId: data.warehouseId,
                        binId: data.binId,
                        quantity: data.quantity,
                        availableQty: data.availableQty,
                        reservedQty: data.reservedQty,
                    },
                });

                console.log(`✅ Created: ${data.name}`);
                created++;
            } catch (error) {
                console.error(`❌ Failed to create ${data.name}:`, error);
            }
        }

        // 6. Update Bin currentQty
        console.log('\n📦 Updating bin quantities...');
        const uniqueBinIds = [
            ...new Set(inventoryData.map((d) => d.binId).filter(Boolean)),
        ];

        for (const binId of uniqueBinIds) {
            const totalQty = await prisma.inventoryItem.aggregate({
                where: { binId: binId as string },
                _sum: { quantity: true },
            });

            await prisma.bin.update({
                where: { id: binId as string },
                data: { currentQty: totalQty._sum.quantity || 0 },
            });
        }

        console.log(`✅ Updated ${uniqueBinIds.length} bins\n`);

        // 7. Summary
        const total = await prisma.inventoryItem.count();
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`✅ Inventory Seed Complete!`);
        console.log(`   - Created: ${created} new items`);
        console.log(`   - Total in DB: ${total} items`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // 8. Display summary by warehouse
        const summary = await prisma.inventoryItem.groupBy({
            by: ['warehouseId'],
            _sum: { quantity: true },
            _count: true,
        });

        console.log('📊 Inventory by Warehouse:');
        for (const s of summary) {
            const warehouse = await prisma.warehouse.findUnique({
                where: { id: s.warehouseId },
            });
            console.log(
                `   ${warehouse?.name}: ${s._count} items, ${s._sum.quantity} total qty`
            );
        }
        console.log('');
    } catch (error) {
        console.error('❌ Seed failed:', error);
        throw error;
    }
}

// Run seed
seedInventory()
    .catch((e) => {
        console.error('Fatal error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
