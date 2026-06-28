import { prisma } from './src/db.js';

async function main() {
  const orgs = await prisma.organization.findMany();
  for (const org of orgs) {
    const hrExists = await prisma.department.findFirst({
      where: { name: 'HR', organizationId: org.id }
    });
    if (!hrExists) {
      await prisma.department.create({
        data: {
          name: 'HR',
          organizationId: org.id
        }
      });
      console.log(`Created HR department for org ${org.id}`);
    } else {
      console.log(`HR department already exists for org ${org.id}`);
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
