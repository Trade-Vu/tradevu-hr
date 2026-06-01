import { prisma } from '../src/db.js'
import bcrypt from 'bcryptjs'

async function main() {
  // Check if organization already exists
  let org = await prisma.organization.findFirst({
    where: { name: 'TradeVu' }
  });

  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: 'TradeVu',
        ownerEmail: 'superadmin@tradevu.com',
      }
    });
  }

  // Hash passwords
  const superAdminPassword = await bcrypt.hash('Admin@12345', 10)
  const hrAdminPassword = await bcrypt.hash('HrAdmin@12345', 10)
  const employeePassword = await bcrypt.hash('Employee@12345', 10)

  // Super Admin
  await prisma.user.upsert({
    where: { email: 'superadmin@tradevu.com' },
    update: { passwordHash: superAdminPassword },
    create: {
      email: 'superadmin@tradevu.com',
      passwordHash: superAdminPassword,
      role: 'SUPER_ADMIN',
      organizationId: org.id,
      isOrgOwner: true
    }
  })

  // HR Admin
  await prisma.user.upsert({
    where: { email: 'hradmin@tradevu.com' },
    update: { passwordHash: hrAdminPassword },
    create: {
      email: 'hradmin@tradevu.com',
      passwordHash: hrAdminPassword,
      role: 'HR_ADMIN',
      organizationId: org.id,
    }
  })

  // Employee
  await prisma.user.upsert({
    where: { email: 'employee@tradevu.com' },
    update: { passwordHash: employeePassword },
    create: {
      email: 'employee@tradevu.com',
      passwordHash: employeePassword,
      role: 'EMPLOYEE',
      organizationId: org.id,
    }
  })

  console.log('Seeded database with test users')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
