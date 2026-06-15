import React from 'react';
import { BaseTemplate } from './BaseTemplate.jsx';
import { Text, Section, Hr, Button } from '@react-email/components';

export const ExitNoticeEmail = ({ fullName, exitType, exitDate, deepLink }) => {
  return (
    <BaseTemplate previewText="Offboarding and Exit Information">
      <Text className="text-2xl font-bold text-slate-900 mb-4 mt-0">
        Offboarding Notice
      </Text>
      
      <Text className="text-base text-slate-700 leading-relaxed mb-4">
        Dear {fullName},
      </Text>

      <Text className="text-base text-slate-700 leading-relaxed mb-4">
        This email is to confirm your offboarding process as a result of your {exitType?.toLowerCase()?.replace('_', ' ') || 'exit'}. We have initiated the necessary steps for your transition.
      </Text>

      <Section className="bg-slate-100 rounded-lg p-6 mb-6 border border-slate-200">
        <Text className="text-base text-slate-800 my-1">
          <strong className="text-slate-900">Effective Exit Date:</strong> {exitDate}
        </Text>
      </Section>

      <Text className="text-base text-slate-700 leading-relaxed mb-6">
        Please ensure all company assets are returned and any necessary handover documents are completed before your final date.
      </Text>

      {deepLink && (
        <Section className="text-center mb-6">
          <Button 
            href={deepLink}
            className="bg-purple-600 text-white font-semibold rounded-lg px-6 py-3 no-underline text-center inline-block"
          >
            View Offboarding Checklist
          </Button>
        </Section>
      )}

      <Hr className="border-slate-200 my-6 mx-0" />
      <Text className="text-sm text-slate-600 leading-relaxed m-0">
        We wish you the very best in your future endeavors. If you have any questions regarding your final payroll or benefits, please contact HR.
      </Text>
    </BaseTemplate>
  );
};

ExitNoticeEmail.PreviewProps = {
  fullName: 'Jane Doe',
  exitType: 'RESIGNATION',
  exitDate: 'August 15, 2026',
  deepLink: 'http://localhost:5173/offboarding'
};

export default ExitNoticeEmail;
