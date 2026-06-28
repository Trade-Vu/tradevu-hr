import React from 'react';
import { BaseTemplate } from './BaseTemplate.jsx';
import { Text, Button, Section, Hr } from '@react-email/components';

export const InviteEmail = ({ inviteeName, orgName, role, inviteLink }) => {
  const roleLabel = role === 'HR_ADMIN' ? 'HR Manager' : 'Employee';

  return (
    <BaseTemplate previewText={`You've been invited to join ${orgName} on TradeVu HR`}>
      <Text className="text-2xl font-bold text-slate-900 mb-4 mt-0">
        You've been invited! 🎉
      </Text>

      <Text className="text-base text-slate-700 leading-relaxed mb-4">
        {inviteeName ? `Hi ${inviteeName},` : 'Hi there,'}
      </Text>

      <Text className="text-base text-slate-700 leading-relaxed mb-6">
        You've been invited to join <strong>{orgName}</strong> on TradeVu HR as a{' '}
        <strong>{roleLabel}</strong>. Click the button below to set up your account
        and get started.
      </Text>

      <Section className="text-center mb-6">
        <Button
          href={inviteLink}
          className="bg-slate-900 text-white font-semibold rounded-lg px-6 py-3 no-underline text-center inline-block"
        >
          Accept Invitation
        </Button>
      </Section>

      <Hr className="border-slate-200 my-6" />

      <Text className="text-sm text-slate-500 leading-relaxed m-0">
        This invite link expires in <strong>72 hours</strong>. If you weren't
        expecting this email, you can safely ignore it.
      </Text>

      <Text className="text-sm text-slate-500 mt-2 m-0">
        Or copy this link into your browser:{' '}
        <a href={inviteLink} className="text-slate-700 underline break-all">
          {inviteLink}
        </a>
      </Text>
    </BaseTemplate>
  );
};

InviteEmail.PreviewProps = {
  inviteeName: 'Amara Okafor',
  orgName: 'TradeVu Ltd',
  role: 'HR_ADMIN',
  inviteLink: 'https://staging.hr.tradevu.co/accept-invite?token=preview-token-123',
};

export default InviteEmail;
