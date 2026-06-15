import React from 'react';
import { BaseTemplate } from './BaseTemplate.jsx';
import { Text, Button, Section } from '@react-email/components';

export const ProbationNoticeEmail = ({ fullName, status, evaluationDate, deepLink }) => {
  return (
    <BaseTemplate previewText="Probation Period Update">
      <Text className="text-2xl font-bold text-slate-900 mb-4 mt-0">
        Probation Update
      </Text>
      
      <Text className="text-base text-slate-700 leading-relaxed mb-4">
        Hi {fullName},
      </Text>

      <Text className="text-base text-slate-700 leading-relaxed mb-4">
        This is a notification regarding your probation period. Your current probation status is marked as: <strong className="text-purple-700">{status}</strong>.
      </Text>

      {evaluationDate && (
        <Text className="text-base text-slate-700 leading-relaxed mb-4">
          Your next evaluation or confirmation date is scheduled for: <strong>{evaluationDate}</strong>.
        </Text>
      )}

      {deepLink && (
        <Section className="text-center mb-6">
          <Button 
            href={deepLink}
            className="bg-purple-600 text-white font-semibold rounded-lg px-6 py-3 no-underline text-center inline-block"
          >
            View Profile
          </Button>
        </Section>
      )}
    </BaseTemplate>
  );
};

ProbationNoticeEmail.PreviewProps = {
  fullName: 'Jane Doe',
  status: 'Confirmed',
  evaluationDate: 'August 1, 2026',
  deepLink: 'http://localhost:5173/profile'
};

export default ProbationNoticeEmail;
