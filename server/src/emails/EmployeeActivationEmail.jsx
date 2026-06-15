import React from 'react';
import { BaseTemplate } from './BaseTemplate.jsx';
import { Text, Button, Section } from '@react-email/components';

export const EmployeeActivationEmail = ({ fullName, deepLink }) => {
  return (
    <BaseTemplate previewText="Your TradeVu HR Account is Active!">
      <Text className="text-2xl font-bold text-slate-900 mb-4 mt-0">
        Account Activated 🎉
      </Text>
      
      <Text className="text-base text-slate-700 leading-relaxed mb-4">
        Hi {fullName},
      </Text>

      <Text className="text-base text-slate-700 leading-relaxed mb-4">
        Great news! Your employee profile has been fully approved and activated. You now have full access to the TradeVu HR Portal.
      </Text>

      {deepLink && (
        <Section className="text-center mb-6">
          <Button 
            href={deepLink}
            className="bg-purple-600 text-white font-semibold rounded-lg px-6 py-3 no-underline text-center inline-block"
          >
            Go to Dashboard
          </Button>
        </Section>
      )}
    </BaseTemplate>
  );
};

EmployeeActivationEmail.PreviewProps = {
  fullName: 'Jane Doe',
  deepLink: 'http://localhost:5173/dashboard'
};

export default EmployeeActivationEmail;
