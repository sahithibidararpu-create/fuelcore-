import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 12;
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@fuelcore.io';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin@1234';

async function main() {
  console.log('🧹 Wiping all demo data and setting up clean database...');
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

  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS);
  await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      passwordHash: adminHash,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'SUPER_ADMIN',
      phone: '+1-555-0100',
    },
  });
  console.log(`\n✅ Super Admin created:`);
  console.log(`   Email:    ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
  console.log('\n🚀 Clean database is ready! You can now log in and configure your stations, tanks, pumps, and employees.');
}

main()
  .catch((err) => {
    console.error('❌ Clean seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
