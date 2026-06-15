import React from 'react';
import { BaseTemplate } from './BaseTemplate.jsx';
import { Text, Button, Section } from '@react-email/components';

export const WelcomeEmail = ({ fullName, onboardingLink }) => {
  return (
    <BaseTemplate previewText="Welcome to TradeVu!">
      <Text className="text-2xl font-bold text-slate-900 mb-4 mt-0">
        Welcome to the team, {fullName}! 🎉
      </Text>
      
      <Text className="text-base text-slate-700 leading-relaxed mb-6">
        We are absolutely thrilled to have you join us at TradeVu. Your onboarding journey starts here, and we've prepared everything you need to hit the ground running.
      </Text>

      <Section className="text-center mb-6">
        <Button 
          href={onboardingLink}
          className="bg-purple-600 text-white font-semibold rounded-lg px-6 py-3 no-underline text-center inline-block"
        >
          Start Your Onboarding
        </Button>
      </Section>

      <Text className="text-base text-slate-700 leading-relaxed m-0">
        If you have any questions, feel free to reach out to the HR team.
      </Text>
    </BaseTemplate>
  );
};

WelcomeEmail.PreviewProps = {
  fullName: 'Jane Doe',
  onboardingLink: 'http://localhost:5173/onboarding'
};

export default WelcomeEmail;
