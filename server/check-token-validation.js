import { prisma } from './src/db.js';
async function main() {
  const tokenStr = 'f54ecde4-d377-4b32-8500-130ec2489621';
  const token = await prisma.inviteToken.findUnique({
    where: { token: tokenStr },
    include: { organization: true }
  });
  console.log('Token object:', token);

  if (!token) {
    console.log('Token not found');
    return;
  }
  if (token.usedAt) {
    console.log('Token already used');
    return;
  }
  if (token.expiresAt < new Date()) {
    console.log('Token expired');
    return;
  }
  console.log('Valid token!');
}
main().finally(() => prisma.$disconnect());
