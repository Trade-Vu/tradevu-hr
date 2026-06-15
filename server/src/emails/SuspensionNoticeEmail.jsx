import React from 'react';
import { BaseTemplate } from './BaseTemplate.jsx';
import { Text, Section, Hr } from '@react-email/components';

export const SuspensionNoticeEmail = ({ fullName, startDate, endDate, reason }) => {
  return (
    <BaseTemplate previewText="Important Notice Regarding Your Employment Status">
      <Text className="text-2xl font-bold text-slate-900 mb-4 mt-0">
        Notice of Suspension
      </Text>
      
      <Text className="text-base text-slate-700 leading-relaxed mb-4">
        Dear {fullName},
      </Text>

      <Text className="text-base text-slate-700 leading-relaxed mb-4">
        This email serves as official notification that your employment with TradeVu has been temporarily suspended.
      </Text>

      <Section className="bg-red-50 rounded-lg p-6 mb-6 border border-red-100">
        <Text className="text-base text-slate-800 my-1">
          <strong className="text-red-900">Effective Date:</strong> {startDate}
        </Text>
        <Text className="text-base text-slate-800 my-1">
          <strong className="text-red-900">Expected End Date:</strong> {endDate || 'Until further notice'}
        </Text>
      </Section>

      {reason && (
        <>
          <Text className="text-base text-slate-900 font-semibold mb-2">Reason for Suspension:</Text>
          <Text className="text-base text-slate-700 italic border-l-4 border-red-300 pl-4 py-2 bg-slate-50 m-0 mb-6">
            "{reason}"
          </Text>
        </>
      )}

      <Hr className="border-slate-200 my-6 mx-0" />
      <Text className="text-sm text-slate-600 leading-relaxed m-0">
        During this period, your access to company systems will be temporarily disabled. Please direct any questions or appeals to the Human Resources department.
      </Text>
    </BaseTemplate>
  );
};

SuspensionNoticeEmail.PreviewProps = {
  fullName: 'Jane Doe',
  startDate: 'July 1, 2026',
  endDate: 'July 15, 2026',
  reason: 'Pending administrative review of recent policy violations.'
};

export default SuspensionNoticeEmail;
