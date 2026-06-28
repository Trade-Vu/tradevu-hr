import React from 'react';
import { BaseTemplate } from './BaseTemplate.jsx';
import { Text, Button, Section, Hr } from '@react-email/components';

export const PasswordResetEmail = ({ userName, resetLink }) => {
  return (
    <BaseTemplate previewText="Reset your TradeVu HR password">
      <Text className="text-2xl font-bold text-slate-900 mb-4 mt-0">
        Reset your password
      </Text>

      <Text className="text-base text-slate-700 leading-relaxed mb-4">
        Hi {userName || 'there'},
      </Text>

      <Text className="text-base text-slate-700 leading-relaxed mb-6">
        We received a request to reset the password for your TradeVu HR account.
        Click the button below to choose a new password.
      </Text>

      <Section className="text-center mb-6">
        <Button
          href={resetLink}
          className="bg-slate-900 text-white font-semibold rounded-lg px-6 py-3 no-underline text-center inline-block"
        >
          Reset Password
        </Button>
      </Section>

      <Hr className="border-slate-200 my-6" />

      <Text className="text-sm text-slate-500 leading-relaxed m-0">
        This link expires in <strong>1 hour</strong>. If you didn't request a
        password reset, you can safely ignore this email — your password won't change.
      </Text>

      <Text className="text-sm text-slate-500 mt-2 m-0">
        Or copy this link into your browser:{' '}
        <a href={resetLink} className="text-slate-700 underline break-all">
          {resetLink}
        </a>
      </Text>
    </BaseTemplate>
  );
};

PasswordResetEmail.PreviewProps = {
  userName: 'Chiza',
  resetLink: 'https://staging.hr.tradevu.co/resetpassword?token=preview-token-456',
};

export default PasswordResetEmail;
