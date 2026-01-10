// Script to seed initial categories and subcategories from hardcoded values
// Run with: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed-categories.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categoriesData = [
    {
        name: 'OIL & GAS Piping Systems',
        icon: 'Package',
        subCategories: [
            { name: 'PROJECTS', isHeading: true },
            { name: 'NG FACTORY PIPELINES AND SKIDS INSTALLATIONS' },
            { name: 'LNG STORAGE TANKS AND SYSTEM INSTALLATIONS' },
            { name: 'NITROGEN & OXYGEN GENERATORS' },
            { name: 'PRODUCTS', isHeading: true },
            { name: 'Pipes' },
            { name: 'Valves & Fittings' },
            { name: 'Flexible connections' },
            { name: 'Filters' },
            { name: 'Pressure Regulators' },
            { name: 'Gas Meters' },
            { name: 'Solenoid valves' },
            { name: 'GAS SKIDS / PRMS' },
            { name: 'LNG/LPG STORAGE TANKS and systems' }
        ]
    },
    {
        name: 'Dairy & Food',
        icon: 'Package',
        subCategories: [
            { name: 'PROJECTS', isHeading: true },
            { name: 'DAIRY PLANTS' },
            { name: 'WATER TREATMENT PLANTS' },
            { name: 'CIP PLANTS' },
            { name: 'PILOT PLANT / MINI PLANT' },
            { name: 'FACTORY RELOCATIONS' },
            { name: 'SS STORAGE TANKS & MIXERS' },
            { name: 'CLEANING STATIONS' },
            { name: 'IBC DOSING STATIONS' },
            { name: 'PLATFORMS' },
            { name: 'SS PIPINGS' },
            { name: 'PRODUCTS', isHeading: true },
            { name: 'SS DRAINS' },
            { name: 'SS Valve & Fittings' },
            { name: 'Flexible connections' },
            { name: 'pumps' }
        ]
    },
    {
        name: 'Industrial',
        icon: 'Package',
        subCategories: [
            { name: 'PROJECTS', isHeading: true },
            { name: 'HOME & PERSONAL CARE PLANTS' },
            { name: 'SULPHONATION PLANT' },
            { name: 'LAB PLANT' },
            { name: 'TANK FARMS' },
            { name: 'UTILITY & pipings' },
            { name: 'READY FACTORIES TO BUY FOR BUSINESS INVESTMENTS' },
            { name: 'PRODUCTS', isHeading: true },
            { name: 'FANS' },
            { name: 'NITROGEN / OXYGEN GENERATORS' },
            { name: 'BOILERS' },
            { name: 'PUMPS' },
            { name: 'FILTRATION SYSTEMS' },
            { name: 'LIQUID DOSING SYSTEMS' }
        ]
    },
    {
        name: 'Consulting & Services',
        icon: 'Package',
        subCategories: [
            { name: 'SERVICES', isHeading: true },
            { name: 'AMC contracts' },
            { name: 'FAN Balance and Monitoring' },
            { name: 'Thermal inspections' },
            { name: 'Vibration checks' },
            { name: 'Central Lubrication system' },
            { name: 'Tightening checks' },
            { name: '6S Trainings' },
            { name: 'TPM' },
            { name: 'Focused Improvements' },
            { name: 'Autonomus Maintenance' },
            { name: 'Planned Maintenance' },
            { name: 'Energy Savings RISK ASSESMENT' },
            { name: 'COST Reductions' },
            { name: 'Early Equipment Management' },
            { name: 'HSE Risk Assessments and Predictions' },
            { name: 'Efficiency monitoring-FOL' },
            { name: 'Low cost Automations' },
            { name: 'SUPPLY CHAIN - RAW MATERIALS' }
        ]
    }
];

async function seed() {
    console.log('🌱 Seeding categories...');

    for (let catIndex = 0; catIndex < categoriesData.length; catIndex++) {
        const catData = categoriesData[catIndex];

        // Check if category already exists
        const existingCategory = await prisma.category.findUnique({
            where: { name: catData.name },
        });

        if (existingCategory) {
            console.log(`⏭️  Category "${catData.name}" already exists, skipping...`);
            continue;
        }

        // Create category
        const category = await prisma.category.create({
            data: {
                name: catData.name,
                icon: catData.icon,
                order: catIndex,
                isActive: true,
            },
        });

        console.log(`✅ Created category: ${category.name}`);

        // Create subcategories
        for (let subIndex = 0; subIndex < catData.subCategories.length; subIndex++) {
            const subData = catData.subCategories[subIndex];

            await prisma.subCategory.create({
                data: {
                    categoryId: category.id,
                    name: subData.name,
                    isHeading: subData.isHeading || false,
                    order: subIndex,
                    isActive: true,
                },
            });
        }

        console.log(`   └─ Created ${catData.subCategories.length} subcategories`);
    }

    console.log('\n✨ Seeding complete!');
}

seed()
    .catch((e) => {
        console.error('❌ Error seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
