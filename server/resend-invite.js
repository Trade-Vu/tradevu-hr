import { prisma } from './src/db.js';
import { NotificationService } from './src/services/NotificationService.js';
import { config } from 'dotenv';
config();

async function main() {
  const email = 'ichizanum@gmail.com';
  console.log(`Finding last invite for ${email}...`);
  
  const token = await prisma.inviteToken.findFirst({
    where: { email },
    orderBy: { createdAt: 'desc' }
  });
  
  if (!token) {
    console.error('No invite token found for that email!');
    return;
  }
  
  const inviter = await prisma.user.findUnique({
    where: { id: token.invitedByUserId }
  });
  
  const inviteLink = `${process.env.FRONTEND_URL || 'https://staging.hr.tradevu.co'}/accept-invite?token=${token.token}`;
  
  console.log('Sending email...');
  
  await NotificationService.notify({
    userId: inviter.id,
    category: 'invite',
    title: `You've been invited to join TradeVu HR`,
    message: `You've been invited to join your organization on TradeVu HR.`,
    sendEmail: true,
    emailProps: {
      inviterName: inviter.email,
      roleName: token.role === 'HR_ADMIN' ? 'HR Manager' : 'Employee',
      inviteLink,
    }
  });
  
  console.log('Done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
