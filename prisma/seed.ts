import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding...');

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            username: 'admin',
            name: 'Admin User',
            email: 'admin@example.com',
            password: hashedPassword,
            role: 'ADMIN',
        },
    });
    console.log('Created admin user:', admin.email);

    // Create warehouse
    const warehouse = await prisma.warehouse.upsert({
        where: { code: 'WH-001' },
        update: {},
        create: {
            code: 'WH-001',
            name: 'Main Warehouse',
            location: 'Jakarta',
            type: 'MAIN',
        },
    });
    console.log('Created warehouse:', warehouse.name);

    // Create bin
    const bin = await prisma.bin.upsert({
        where: { code: 'A-01-01' },
        update: {},
        create: {
            code: 'A-01-01',
            name: 'Aisle A, Rack 01, Level 01',
            warehouseId: warehouse.id,
            type: 'STORAGE',
        },
    });
    console.log('Created bin:', bin.code);

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
