import React from 'react';
import { BaseTemplate } from './BaseTemplate.jsx';
import { Text, Button, Section } from '@react-email/components';

export const EmployeeCreationEmail = ({ fullName, loginLink, temporaryPassword, buttonText }) => {
  return (
    <BaseTemplate previewText="Your TradeVu HR Account has been created">
      <Text className="text-2xl font-bold text-slate-900 mb-4 mt-0">
        Account Created
      </Text>
      
      <Text className="text-base text-slate-700 leading-relaxed mb-4">
        Hi {fullName},
      </Text>

      <Text className="text-base text-slate-700 leading-relaxed mb-4">
        Your employee profile on TradeVu HR has just been drafted by the HR team. 
        {temporaryPassword 
          ? " You can now log in to complete your profile information." 
          : " You can now set your password to complete your profile."}
      </Text>

      {temporaryPassword && (
        <Section className="bg-slate-100 rounded p-4 mb-6 text-center border border-slate-200">
          <Text className="text-sm text-slate-500 m-0 mb-1">Temporary Password</Text>
          <Text className="text-lg font-mono font-bold text-slate-900 m-0">{temporaryPassword}</Text>
        </Section>
      )}

      {loginLink && (
        <Section className="text-center mb-6">
          <Button 
            href={loginLink}
            className="bg-purple-600 text-white font-semibold rounded-lg px-6 py-3 no-underline text-center inline-block"
          >
            {buttonText || "Log In Now"}
          </Button>
        </Section>
      )}
    </BaseTemplate>
  );
};

EmployeeCreationEmail.PreviewProps = {
  fullName: 'Jane Doe',
  loginLink: 'http://localhost:5173/resetpassword?token=XYZ',
  buttonText: 'Set Your Password'
};

export default EmployeeCreationEmail;
