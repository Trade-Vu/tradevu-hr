import nodemailer from 'nodemailer';
import { render } from '@react-email/render';

let transporter = null;

function getTransporter() {
  if (!transporter) {
    if (!process.env.SMTP_HOST) {
      console.warn('[EmailService] SMTP_HOST is not set. Emails will not be sent.');
    } else {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '465', 10),
        secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }
  return transporter;
}

const getFromAddress = () => process.env.EMAIL_FROM || 'TradeVu HR <onboarding@resend.dev>';

/**
 * Send a transactional email using Resend SMTP.
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
    const transporter = getTransporter();
    if (!transporter) return;

    const html = await render(template);
    const result = await transporter.sendMail({
      from: getFromAddress(),
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
      ...(replyTo ? { replyTo } : {}),
    });

    console.log(`[EmailService] Sent "${subject}" to ${Array.isArray(to) ? to.join(', ') : to} - MessageId: ${result.messageId}`);
  } catch (err) {
    // Log but don't crash the resolver — email failure should never block a
    // business operation (e.g. approving leave should still work even if
    // the notification email fails).
    console.error('[EmailService] Failed to send email:', err);
  }
}
