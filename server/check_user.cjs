const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findUnique({where: {email: 'chijioke@gmail.com'}}).then(console.log).catch(console.error).finally(()=>prisma.$disconnect());
