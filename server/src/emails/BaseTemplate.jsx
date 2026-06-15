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

export const BaseTemplate = ({ children, previewText }) => {
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
              {/* Header with Purple Gradient */}
              <div className="bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-600 p-8 text-center">
                {/* Fallback to TradeVu logo or text */}
                <Text className="text-white text-2xl font-bold tracking-tight m-0">TradeVu HR</Text>
              </div>

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
