import nodemailer from 'nodemailer';
import { render } from '@react-email/render';

let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  // Use configured SMTP if available
  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Fallback to Ethereal for local development / testing
    console.log('[EmailService] No SMTP_HOST found, generating Ethereal test account...');
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    });
    console.log(`[EmailService] Ethereal account ready. Emails will be logged with preview URLs.`);
  }

  return transporter;
}

const getFromAddress = () => process.env.EMAIL_FROM || '"TradeVu HR" <onboarding@tradevu.co>';

/**
 * Send a transactional email using Nodemailer.
 *
 * @param {object} opts
 * @param {string|string[]} opts.to - Recipient email address(es)
 * @param {string} opts.subject - Email subject line
 * @param {React.ReactElement} opts.template - A React Email JSX element
 * @param {string} [opts.replyTo] - Optional reply-to address
 * @returns {Promise<void>}
 */
export async function sendEmail({ to, subject, template, replyTo }) {
  try {
    const t = await getTransporter();

    const html = await render(template);
    
    const mailOptions = {
      from: getFromAddress(),
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
      ...(replyTo ? { replyTo } : {}),
    };

    const info = await t.sendMail(mailOptions);
    
    console.log(`[EmailService] Sent "${subject}" to ${mailOptions.to}`);
    console.log(`[EmailService] Message ID: ${info.messageId}`);
    
    // Preview only available when sending through an Ethereal account
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[EmailService] Preview URL: ${previewUrl}`);
    }
  } catch (err) {
    // Log but don't crash the resolver — email failure should never block a
    // business operation (e.g. approving leave should still work even if
    // the notification email fails).
    console.error('[EmailService] Failed to send email:', err);
  }
}
