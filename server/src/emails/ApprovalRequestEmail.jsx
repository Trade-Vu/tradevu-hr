import React from 'react';
import { BaseTemplate } from './BaseTemplate.jsx';
import { Text, Button, Section } from '@react-email/components';

export const ApprovalRequestEmail = ({ fullName, message, deepLink }) => {
  return (
    <BaseTemplate previewText="Action Required: Approval Request">
      <Text className="text-2xl font-bold text-slate-900 mb-4 mt-0">
        Action Required
      </Text>
      
      <Text className="text-base text-slate-700 leading-relaxed mb-4">
        Hi {fullName},
      </Text>

      <Text className="text-base text-slate-700 leading-relaxed mb-6">
        {message || "An item requires your review and approval."}
      </Text>

      {deepLink && (
        <Section className="text-center mb-6">
          <Button 
            href={deepLink}
            className="bg-purple-600 text-white font-semibold rounded-lg px-6 py-3 no-underline text-center inline-block"
          >
            Review Request
          </Button>
        </Section>
      )}
    </BaseTemplate>
  );
};

ApprovalRequestEmail.PreviewProps = {
  fullName: 'Admin',
  message: 'John Doe has completed their profile setup and is awaiting review.',
  deepLink: 'http://localhost:5173/PendingApprovals'
};

export default ApprovalRequestEmail;
