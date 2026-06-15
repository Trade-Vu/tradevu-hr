import React from 'react';
import { BaseTemplate } from './BaseTemplate.jsx';
import { Text, Button, Section } from '@react-email/components';

export const LeaveUpdateEmail = ({ fullName, status, leaveType, startDate, endDate, deepLink }) => {
  const isApproved = status?.toLowerCase() === 'approved';
  
  return (
    <BaseTemplate previewText={`Leave Request ${status}`}>
      <Text className="text-2xl font-bold text-slate-900 mb-4 mt-0">
        Leave Request {status}
      </Text>
      
      <Text className="text-base text-slate-700 leading-relaxed mb-4">
        Hi {fullName},
      </Text>

      <Text className="text-base text-slate-700 leading-relaxed mb-6">
        Your {leaveType} request for the period between <strong className="text-slate-900">{startDate}</strong> and <strong className="text-slate-900">{endDate}</strong> has been {isApproved ? 'approved' : 'rejected'}.
      </Text>

      {deepLink && (
        <Section className="text-center mb-6">
          <Button 
            href={deepLink}
            className="bg-purple-600 text-white font-semibold rounded-lg px-6 py-3 no-underline text-center inline-block"
          >
            View Leave Details
          </Button>
        </Section>
      )}
    </BaseTemplate>
  );
};

LeaveUpdateEmail.PreviewProps = {
  fullName: 'Jane Doe',
  status: 'Approved',
  leaveType: 'Annual Leave',
  startDate: 'July 1, 2026',
  endDate: 'July 15, 2026',
  deepLink: 'http://localhost:5173/LeaveManagement'
};

export default LeaveUpdateEmail;
