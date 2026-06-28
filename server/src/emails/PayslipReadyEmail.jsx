import React from 'react';
import { BaseTemplate } from './BaseTemplate.jsx';
import { Text, Button, Section, Hr } from '@react-email/components';

export const PayslipReadyEmail = ({ fullName, month, payslipLink }) => {
  return (
    <BaseTemplate previewText={`Your ${month} payslip is ready`}>
      <Text className="text-2xl font-bold text-slate-900 mb-4 mt-0">
        Your payslip is ready 💰
      </Text>

      <Text className="text-base text-slate-700 leading-relaxed mb-4">
        Hi {fullName},
      </Text>

      <Text className="text-base text-slate-700 leading-relaxed mb-6">
        Your payslip for <strong>{month}</strong> has been published and is now
        available to view and download on TradeVu HR.
      </Text>

      <Section className="text-center mb-6">
        <Button
          href={payslipLink}
          className="bg-slate-900 text-white font-semibold rounded-lg px-6 py-3 no-underline text-center inline-block"
        >
          View My Payslip
        </Button>
      </Section>

      <Hr className="border-slate-200 my-6" />

      <Text className="text-sm text-slate-500 leading-relaxed m-0">
        If you have any questions about your payslip, please contact the HR team.
      </Text>
    </BaseTemplate>
  );
};

PayslipReadyEmail.PreviewProps = {
  fullName: 'Amara Okafor',
  month: 'June 2026',
  payslipLink: 'https://staging.hr.tradevu.co/employeeselfservice',
};

export default PayslipReadyEmail;
