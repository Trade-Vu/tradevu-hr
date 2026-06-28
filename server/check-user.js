import { prisma } from './src/db.js';
async function main() {
  const u = await prisma.user.findUnique({ where: { email: 'ichizanum@gmail.com' } });
  console.log('USER:', u);
  const token = await prisma.inviteToken.findFirst({ where: { email: 'ichizanum@gmail.com' } });
  console.log('TOKEN:', token);
}
main().finally(() => prisma.$disconnect());
