import { PrismaClient, FuelType, PumpStatus, SalePaymentMethod, AttendanceStatus, ExpenseCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { subDays, format, addHours, startOfDay } from 'date-fns';

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 12;
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@fuelcore.io';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin@1234';

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomBetween(min, max + 1));
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateInvoice(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV-${ts}-${rand}`;
}

function generateCode(prefix: string): string {
  return `${prefix}-${Math.floor(Math.random() * 90000) + 10000}`;
}

async function main() {
  console.log('🌱 Seeding FuelCore database...\n');

  // ─── Clean up ──────────────────────────────────────────────────────────────
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.fleetPayment.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.pumpMeterReading.deleteMany();
  await prisma.pump.deleteMany();
  await prisma.fuelRefill.deleteMany();
  await prisma.fuelTank.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.fleetAccount.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.stationSettings.deleteMany();
  await prisma.user.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.station.deleteMany();

  console.log('✅ Database cleaned');

  // ─── Super Admin ───────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS);
  const admin = await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      passwordHash: adminHash,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'SUPER_ADMIN',
      phone: '+1-555-0100',
    },
  });
  console.log(`✅ Super Admin created: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);

  // ─── Stations ──────────────────────────────────────────────────────────────
  const stationsData = [
    { name: 'FuelCore Downtown', address: '123 Main Street', city: 'Houston', state: 'TX', phone: '+1-555-0201', email: 'downtown@fuelcore.io' },
    { name: 'FuelCore Westside', address: '456 Oak Avenue', city: 'Houston', state: 'TX', phone: '+1-555-0202', email: 'westside@fuelcore.io' },
    { name: 'FuelCore Airport', address: '789 Airport Blvd', city: 'Houston', state: 'TX', phone: '+1-555-0203', email: 'airport@fuelcore.io' },
  ];

  const stations = await Promise.all(
    stationsData.map((s) => prisma.station.create({ data: s }))
  );

  // Station settings
  const fuelPrices = [
    { dieselPrice: 3.89, petrolPrice: 4.15, premiumPrice: 4.65, kerosenePrice: 3.25 },
    { dieselPrice: 3.79, petrolPrice: 4.09, premiumPrice: 4.55, kerosenePrice: 3.19 },
    { dieselPrice: 3.99, petrolPrice: 4.25, premiumPrice: 4.75, kerosenePrice: 3.35 },
  ];

  await Promise.all(
    stations.map((s, i) =>
      prisma.stationSettings.create({
        data: {
          stationId: s.id,
          ...fuelPrices[i],
          lowStockThreshold: 1000,
          criticalStockThreshold: 400,
        },
      })
    )
  );
  console.log(`✅ ${stations.length} stations created`);

  // ─── Managers ──────────────────────────────────────────────────────────────
  const managerNames = [
    { firstName: 'James', lastName: 'Wilson', email: 'james.wilson@fuelcore.io' },
    { firstName: 'Maria', lastName: 'Garcia', email: 'maria.garcia@fuelcore.io' },
    { firstName: 'Robert', lastName: 'Chen', email: 'robert.chen@fuelcore.io' },
  ];

  const managerHash = await bcrypt.hash('Manager@1234', BCRYPT_ROUNDS);
  const managers = await Promise.all(
    managerNames.map((m, i) =>
      prisma.user.create({
        data: {
          ...m,
          passwordHash: managerHash,
          role: 'STATION_MANAGER',
          stationId: stations[i].id,
          phone: `+1-555-03${String(i + 1).padStart(2, '0')}`,
        },
      })
    )
  );
  console.log(`✅ ${managers.length} managers created`);

  // ─── Suppliers ─────────────────────────────────────────────────────────────
  const suppliersData = [
    { name: 'PetroSupply Inc', contactName: 'Alice Brown', phone: '+1-555-0401', email: 'alice@petrosupply.com' },
    { name: 'Gulf Coast Fuel', contactName: 'Bob Davis', phone: '+1-555-0402', email: 'bob@gulfcoast.com' },
    { name: 'Texas Energy Co', contactName: 'Carol Smith', phone: '+1-555-0403', email: 'carol@texasenergy.com' },
    { name: 'National Petroleum', contactName: 'Dan Jones', phone: '+1-555-0404', email: 'dan@natpetro.com' },
    { name: 'Southern Fuels LLC', contactName: 'Eve Martinez', phone: '+1-555-0405', email: 'eve@southfuels.com' },
    { name: 'Continental Gas', contactName: 'Frank Lee', phone: '+1-555-0406', email: 'frank@continentalgas.com' },
  ];

  const suppliers = await Promise.all(
    suppliersData.map((s) => prisma.supplier.create({ data: s }))
  );
  console.log(`✅ ${suppliers.length} suppliers created`);

  // ─── Fuel Tanks (12) ───────────────────────────────────────────────────────
  const tankConfigs: Array<{ name: string; fuelType: FuelType; capacity: number; stationIdx: number }> = [
    { name: 'Downtown Diesel A', fuelType: 'DIESEL', capacity: 20000, stationIdx: 0 },
    { name: 'Downtown Diesel B', fuelType: 'DIESEL', capacity: 15000, stationIdx: 0 },
    { name: 'Downtown Petrol A', fuelType: 'PETROL', capacity: 18000, stationIdx: 0 },
    { name: 'Downtown Premium', fuelType: 'PREMIUM', capacity: 10000, stationIdx: 0 },
    { name: 'Westside Diesel', fuelType: 'DIESEL', capacity: 20000, stationIdx: 1 },
    { name: 'Westside Petrol A', fuelType: 'PETROL', capacity: 18000, stationIdx: 1 },
    { name: 'Westside Petrol B', fuelType: 'PETROL', capacity: 15000, stationIdx: 1 },
    { name: 'Westside Kerosene', fuelType: 'KEROSENE', capacity: 8000, stationIdx: 1 },
    { name: 'Airport Diesel A', fuelType: 'DIESEL', capacity: 25000, stationIdx: 2 },
    { name: 'Airport Diesel B', fuelType: 'DIESEL', capacity: 20000, stationIdx: 2 },
    { name: 'Airport Petrol', fuelType: 'PETROL', capacity: 20000, stationIdx: 2 },
    { name: 'Airport Premium', fuelType: 'PREMIUM', capacity: 12000, stationIdx: 2 },
  ];

  const tanks = await Promise.all(
    tankConfigs.map((t) =>
      prisma.fuelTank.create({
        data: {
          name: t.name,
          fuelType: t.fuelType,
          capacityLiters: t.capacity,
          currentLiters: t.capacity * randomBetween(0.3, 0.85),
          minThreshold: t.capacity * 0.1,
          stationId: stations[t.stationIdx].id,
        },
      })
    )
  );
  console.log(`✅ ${tanks.length} fuel tanks created`);

  // ─── Pumps (24 – 2 per tank) ───────────────────────────────────────────────
  const pumps = [];
  for (let i = 0; i < tanks.length; i++) {
    const tank = tanks[i];
    for (let j = 0; j < 2; j++) {
      const pumpNum = String(i * 2 + j + 1).padStart(2, '0');
      const pump = await prisma.pump.create({
        data: {
          pumpNumber: `P${pumpNum}`,
          label: `Pump ${pumpNum}`,
          status: Math.random() > 0.1 ? 'ACTIVE' : randomChoice(['INACTIVE', 'MAINTENANCE'] as PumpStatus[]),
          currentMeter: randomBetween(5000, 50000),
          openingMeter: randomBetween(0, 5000),
          stationId: tank.stationId,
          tankId: tank.id,
        },
      });
      pumps.push(pump);
    }
  }
  console.log(`✅ ${pumps.length} pumps created`);

  // ─── Employees (15) ────────────────────────────────────────────────────────
  const employeeNames = [
    { firstName: 'Alex', lastName: 'Johnson' }, { firstName: 'Bella', lastName: 'Williams' },
    { firstName: 'Carlos', lastName: 'Brown' }, { firstName: 'Diana', lastName: 'Taylor' },
    { firstName: 'Ethan', lastName: 'Anderson' }, { firstName: 'Fiona', lastName: 'Thomas' },
    { firstName: 'George', lastName: 'Jackson' }, { firstName: 'Hannah', lastName: 'White' },
    { firstName: 'Ivan', lastName: 'Harris' }, { firstName: 'Julia', lastName: 'Martin' },
    { firstName: 'Kevin', lastName: 'Thompson' }, { firstName: 'Laura', lastName: 'Garcia' },
    { firstName: 'Mike', lastName: 'Martinez' }, { firstName: 'Nina', lastName: 'Robinson' },
    { firstName: 'Oscar', lastName: 'Clark' },
  ];

  const positions = ['Fuel Attendant', 'Cashier', 'Shift Supervisor', 'Pump Technician', 'Customer Service'];
  const employeeHash = await bcrypt.hash('Employee@1234', BCRYPT_ROUNDS);
  const employeeUsers: Array<{ id: string; stationId: string | null; employeeRecord: { id: string } }> = [];

  for (let i = 0; i < employeeNames.length; i++) {
    const name = employeeNames[i];
    const stationIdx = i % 3;
    const station = stations[stationIdx];

    const user = await prisma.user.create({
      data: {
        email: `${name.firstName.toLowerCase()}.${name.lastName.toLowerCase()}@fuelcore.io`,
        passwordHash: employeeHash,
        firstName: name.firstName,
        lastName: name.lastName,
        role: 'EMPLOYEE',
        stationId: station.id,
        phone: `+1-555-${String(500 + i).padStart(4, '0')}`,
      },
    });

    const employee = await prisma.employee.create({
      data: {
        employeeCode: generateCode('EMP'),
        position: randomChoice(positions),
        department: randomChoice(['Operations', 'Customer Service', 'Maintenance']),
        baseSalary: randomBetween(32000, 55000),
        hourlyRate: randomBetween(15, 28),
        hireDate: subDays(new Date(), randomInt(30, 1000)),
        userId: user.id,
        stationId: station.id,
      },
    });

    employeeUsers.push({ id: user.id, stationId: user.stationId, employeeRecord: employee });
  }
  console.log(`✅ ${employeeNames.length} employees created`);

  // ─── Attendance Records (90 days) ──────────────────────────────────────────
  let attendanceCount = 0;
  for (const emp of employeeUsers) {
    for (let day = 0; day < 90; day++) {
      const date = startOfDay(subDays(new Date(), day));
      const rand = Math.random();
      let status: AttendanceStatus = 'PRESENT';
      let checkIn: Date | null = null;
      let checkOut: Date | null = null;
      let hoursWorked: number | null = null;

      if (rand < 0.75) {
        status = 'PRESENT';
        checkIn = addHours(date, randomBetween(6, 9));
        checkOut = addHours(checkIn, randomBetween(7, 9));
        hoursWorked = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
      } else if (rand < 0.85) {
        status = 'ABSENT';
      } else if (rand < 0.92) {
        status = 'LATE';
        checkIn = addHours(date, randomBetween(9, 11));
        checkOut = addHours(checkIn, randomBetween(7, 8));
        hoursWorked = (checkOut!.getTime() - checkIn!.getTime()) / (1000 * 60 * 60);
      } else {
        status = 'HALF_DAY';
        checkIn = addHours(date, randomBetween(6, 8));
        checkOut = addHours(checkIn, randomBetween(4, 5));
        hoursWorked = (checkOut!.getTime() - checkIn!.getTime()) / (1000 * 60 * 60);
      }

      try {
        await prisma.attendance.create({
          data: {
            userId: emp.id,
            date,
            checkIn,
            checkOut,
            hoursWorked,
            status,
          },
        });
        attendanceCount++;
      } catch {
        // Ignore duplicates
      }
    }
  }
  console.log(`✅ ${attendanceCount} attendance records created`);

  // ─── Fleet Accounts (10) ───────────────────────────────────────────────────
  const fleetCompanies = [
    'Houston Logistics Corp', 'Gulf Transport LLC', 'TexOil Distribution',
    'Star Delivery Services', 'Metro Cab Company', 'Southwest Trucking',
    'Coastal Shipping Inc', 'Pioneer Fleet Services', 'Delta Express Ltd',
    'Lone Star Couriers',
  ];

  const fleetAccounts = await Promise.all(
    fleetCompanies.map((company, i) =>
      prisma.fleetAccount.create({
        data: {
          accountNumber: generateCode('FLT'),
          companyName: company,
          contactName: `${randomChoice(['John', 'Jane', 'Mike', 'Sarah'])} ${randomChoice(['Smith', 'Jones', 'Davis', 'Wilson'])}`,
          contactPhone: `+1-555-${String(600 + i).padStart(4, '0')}`,
          contactEmail: `fleet@${company.toLowerCase().replace(/\s+/g, '')}.com`,
          creditLimit: randomChoice([25000, 50000, 75000, 100000, 150000]),
          currentBalance: 0,
          stationId: randomChoice(stations).id,
        },
      })
    )
  );
  console.log(`✅ ${fleetAccounts.length} fleet accounts created`);

  // ─── Sales (500+) ──────────────────────────────────────────────────────────
  const activePumps = pumps.filter((p) => p.status === 'ACTIVE');
  const paymentMethods: SalePaymentMethod[] = ['CASH', 'CARD', 'FLEET', 'MOBILE'];
  let saleCount = 0;

  for (let day = 0; day < 90; day++) {
    const date = subDays(new Date(), day);
    const dailySales = randomInt(4, 12); // 4-12 sales per day

    for (let s = 0; s < dailySales; s++) {
      const pump = randomChoice(activePumps);
      const tank = tanks.find((t) => t.id === pump.tankId);
      if (!tank) continue;

      const stationEmployees = employeeUsers.filter((e) => e.stationId === pump.stationId);
      if (stationEmployees.length === 0) continue;

      const employee = randomChoice(stationEmployees);
      const prices: Record<string, number[]> = {
        DIESEL: [3.79, 3.89, 3.99],
        PETROL: [4.05, 4.15, 4.25],
        PREMIUM: [4.55, 4.65, 4.75],
        KEROSENE: [3.15, 3.25, 3.35],
      };

      const pricePerLiter = randomChoice(prices[tank.fuelType] || [3.89]);
      const volumeLiters = randomBetween(10, 80);
      const totalAmount = volumeLiters * pricePerLiter;

      let paymentMethod: SalePaymentMethod = randomChoice(paymentMethods);
      let fleetAccountId: string | null = null;

      if (paymentMethod === 'FLEET') {
        const stationFleet = fleetAccounts.filter((f) => f.stationId === pump.stationId);
        if (stationFleet.length > 0) {
          const fleet = randomChoice(stationFleet);
          fleetAccountId = fleet.id;
        } else {
          paymentMethod = 'CASH';
        }
      }

      const saleDate = addHours(startOfDay(date), randomBetween(6, 22));

      try {
        const sale = await prisma.sale.create({
          data: {
            invoiceNumber: generateInvoice(),
            volumeLiters,
            pricePerLiter,
            totalAmount,
            paymentMethod,
            customerName: Math.random() > 0.7 ? `Customer ${randomInt(1, 500)}` : null,
            vehicleNumber: Math.random() > 0.6 ? `TX-${randomInt(1000, 9999)}` : null,
            stationId: pump.stationId,
            pumpId: pump.id,
            tankId: tank.id,
            employeeId: employee.id,
            fleetAccountId,
            createdAt: saleDate,
            updatedAt: saleDate,
          },
        });

        // Update fleet balance
        if (fleetAccountId && paymentMethod === 'FLEET') {
          await prisma.fleetAccount.update({
            where: { id: fleetAccountId },
            data: { currentBalance: { increment: totalAmount } },
          });
        }

        saleCount++;
      } catch {
        // Ignore conflicts
      }
    }
  }
  console.log(`✅ ${saleCount} sales created`);

  // ─── Fleet Payments ────────────────────────────────────────────────────────
  for (const account of fleetAccounts) {
    const numPayments = randomInt(2, 8);
    for (let p = 0; p < numPayments; p++) {
      const paymentDate = subDays(new Date(), randomInt(1, 60));
      const amount = randomBetween(500, 5000);
      await prisma.fleetPayment.create({
        data: {
          fleetAccountId: account.id,
          amount,
          paymentDate,
          reference: `REF-${randomInt(10000, 99999)}`,
          notes: 'Monthly settlement',
        },
      });

      await prisma.fleetAccount.update({
        where: { id: account.id },
        data: { currentBalance: { decrement: Math.min(amount, account.currentBalance) } },
      });
    }
  }
  console.log(`✅ Fleet payments created`);

  // ─── Fuel Refills ──────────────────────────────────────────────────────────
  let refillCount = 0;
  for (const tank of tanks) {
    const numRefills = randomInt(3, 8);
    for (let r = 0; r < numRefills; r++) {
      const deliveryDate = subDays(new Date(), randomInt(1, 85));
      const volumeLiters = randomBetween(3000, 8000);
      const pricePerLiter = randomBetween(2.8, 3.4);
      await prisma.fuelRefill.create({
        data: {
          volumeLiters,
          pricePerLiter,
          totalCost: volumeLiters * pricePerLiter,
          deliveryDate,
          invoiceNumber: `SUPP-${randomInt(10000, 99999)}`,
          stationId: tank.stationId,
          tankId: tank.id,
          supplierId: randomChoice(suppliers).id,
        },
      });
      refillCount++;
    }
  }
  console.log(`✅ ${refillCount} fuel refills created`);

  // ─── Expenses (50+) ────────────────────────────────────────────────────────
  const expenseCategories: ExpenseCategory[] = ['UTILITIES', 'MAINTENANCE', 'SALARIES', 'SUPPLIES', 'TRANSPORT', 'MISCELLANEOUS', 'MARKETING', 'INSURANCE'];
  const expenseTitles: Record<string, string[]> = {
    UTILITIES: ['Electric Bill', 'Water Bill', 'Gas Bill', 'Internet Service'],
    MAINTENANCE: ['Pump Repair', 'Tank Inspection', 'Equipment Service', 'Plumbing Fix'],
    SALARIES: ['Monthly Payroll', 'Overtime Pay', 'Bonus Payment'],
    SUPPLIES: ['Office Supplies', 'Cleaning Materials', 'Safety Equipment'],
    TRANSPORT: ['Delivery Charges', 'Vehicle Fuel', 'Courier Service'],
    MISCELLANEOUS: ['Bank Charges', 'License Renewal', 'Miscellaneous'],
    MARKETING: ['Local Advertising', 'Promotional Materials', 'Digital Ads'],
    INSURANCE: ['Property Insurance', 'Vehicle Insurance', 'Liability Insurance'],
  };

  let expenseCount = 0;
  for (const station of stations) {
    for (let e = 0; e < 20; e++) {
      const category = randomChoice(expenseCategories);
      const titles = expenseTitles[category] || ['Expense'];
      await prisma.expense.create({
        data: {
          title: randomChoice(titles),
          amount: randomBetween(100, 8000),
          category,
          expenseDate: subDays(new Date(), randomInt(0, 85)),
          stationId: station.id,
          isApproved: Math.random() > 0.3,
        },
      });
      expenseCount++;
    }
  }
  console.log(`✅ ${expenseCount} expenses created`);

  // ─── Summary ───────────────────────────────────────────────────────────────
  console.log('\n🎉 Seed complete! Summary:');
  console.log(`   📧 Admin: ${ADMIN_EMAIL} | Password: ${ADMIN_PASSWORD}`);
  console.log(`   📧 Managers: james.wilson@fuelcore.io, maria.garcia@fuelcore.io, robert.chen@fuelcore.io | Password: Manager@1234`);
  console.log(`   📧 Employees: <name>@fuelcore.io | Password: Employee@1234`);
  console.log(`   ⛽ Stations: ${stations.length}`);
  console.log(`   🛢️ Tanks: ${tanks.length} | Pumps: ${pumps.length}`);
  console.log(`   💳 Fleet Accounts: ${fleetAccounts.length}`);
  console.log(`   💰 Sales: ${saleCount} | Expenses: ${expenseCount}`);
  console.log(`   📋 Attendance: ${attendanceCount} records (90 days)`);
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
