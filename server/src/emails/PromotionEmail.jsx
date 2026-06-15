import React from 'react';
import { BaseTemplate } from './BaseTemplate.jsx';
import { Text, Button, Section } from '@react-email/components';

export const PromotionEmail = ({ fullName, newTitle, newGrade, newClass, deepLink }) => {
  return (
    <BaseTemplate previewText="Congratulations on your promotion!">
      <Text className="text-2xl font-bold text-slate-900 mb-4 mt-0">
        Congratulations, {fullName}! 🌟
      </Text>
      
      <Text className="text-base text-slate-700 leading-relaxed mb-4">
        We are thrilled to announce your recent promotion. Your hard work and dedication have truly paid off.
      </Text>

      <Section className="bg-purple-50 rounded-lg p-6 mb-6 border border-purple-100">
        {newTitle && (
          <Text className="text-base text-slate-700 my-1">
            <strong className="text-purple-900">New Role:</strong> {newTitle}
          </Text>
        )}
        {newGrade && (
          <Text className="text-base text-slate-700 my-1">
            <strong className="text-purple-900">New Grade:</strong> {newGrade}
          </Text>
        )}
        {newClass && (
          <Text className="text-base text-slate-700 my-1">
            <strong className="text-purple-900">New Class:</strong> {newClass}
          </Text>
        )}
      </Section>

      {deepLink && (
        <Section className="text-center mb-6">
          <Button 
            href={deepLink}
            className="bg-purple-600 text-white font-semibold rounded-lg px-6 py-3 no-underline text-center inline-block"
          >
            View Your Profile
          </Button>
        </Section>
      )}
    </BaseTemplate>
  );
};

PromotionEmail.PreviewProps = {
  fullName: 'Jane Doe',
  newTitle: 'Senior Software Engineer',
  newGrade: 'Level 4',
  newClass: 'Engineering',
  deepLink: 'http://localhost:5173/profile'
};

export default PromotionEmail;
