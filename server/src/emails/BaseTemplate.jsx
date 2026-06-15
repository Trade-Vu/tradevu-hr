import React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Img,
  Tailwind,
  Hr,
} from '@react-email/components';

export const BaseTemplate = ({ children, previewText, headerTitle = "TradeVu HR" }) => {
  return (
    <Html>
      <Head />
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                brand: '#4f46e5',
              },
            },
          },
        }}
      >
        <Body className="bg-slate-50 font-sans">
          <Container className="mx-auto py-10 px-4 max-w-[600px]">
            <Section className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
              {/* Header Section */}
              <Section className="bg-purple-700 p-8 text-center" style={{ backgroundColor: '#4f46e5' }}>
                <Img 
                  src={`${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo-icon-white.png`} 
                  alt="TradeVu HR" 
                  width="48" 
                  height="48" 
                  style={{ margin: '0 auto', marginBottom: '8px' }}
                />
                <Text className="text-white text-2xl font-bold tracking-tight m-0" style={{ color: '#ffffff' }}>{headerTitle}</Text>
              </Section>

              {/* Main Content */}
              <Section className="p-8">
                {children}
              </Section>

              {/* Footer */}
              <Hr className="border-slate-200 my-0 mx-8" />
              <Section className="p-8 bg-slate-50/50 text-center">
                <Text className="text-slate-500 text-sm m-0">
                  TradeVu HR Portal • Lagos, Nigeria
                </Text>
                <Text className="text-slate-400 text-xs mt-2 mb-0">
                  This is an automated message, please do not reply.
                </Text>
              </Section>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default BaseTemplate;
