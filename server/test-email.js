import dotenv from 'dotenv';
dotenv.config();

import { sendEmail } from './src/services/EmailService.js';
import WelcomeEmail from './src/emails/WelcomeEmail.jsx';
import React from 'react';

async function test() {
  console.log("Sending test email using key starting with:", process.env.RESEND_API_KEY?.substring(0, 8));
  try {
    await sendEmail({
      to: 'ichizanum@gmail.com',
      subject: 'Test Email from TradeVu HR',
      template: React.createElement(WelcomeEmail, { 
        fullName: 'Chiza', 
        onboardingLink: 'https://staging.hr.tradevu.co' 
      })
    });
    console.log("Test email dispatched successfully.");
  } catch (err) {
    console.error("Test failed:", err);
  }
}

test();
