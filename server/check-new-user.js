import { prisma } from './src/db.js';
async function main() {
  const token = await prisma.inviteToken.findFirst({ where: { email: 'chizanum@tradevu.co' } });
  console.log('TOKEN:', token);
  const u = await prisma.user.findUnique({ where: { email: 'chizanum@tradevu.co' } });
  console.log('USER:', u);
}
main().finally(() => prisma.$disconnect());
