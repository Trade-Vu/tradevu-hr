import { Resend } from 'resend';
import { render } from '@react-email/render';

let resendClient = null;

function getResendClient() {
  if (!resendClient) {
    if (!process.env.RESEND_API_KEY) {
      console.warn('[EmailService] RESEND_API_KEY is not set. Emails will not be sent.');
    } else {
      resendClient = new Resend(process.env.RESEND_API_KEY);
    }
  }
  return resendClient;
}

const getFromAddress = () => process.env.EMAIL_FROM || 'TradeVu HR <onboarding@resend.dev>';

/**
 * Send a transactional email using Resend.
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
    const client = getResendClient();
    if (!client) return;

    const html = await render(template);
    const result = await client.emails.send({
      from: getFromAddress(),
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      ...(replyTo ? { replyTo } : {}),
    });

    if (result.error) {
      console.error('[EmailService] Resend error:', result.error);
      throw new Error(`Failed to send email: ${result.error.message}`);
    }

    console.log(`[EmailService] Sent "${subject}" to ${Array.isArray(to) ? to.join(', ') : to}`);
  } catch (err) {
    // Log but don't crash the resolver — email failure should never block a
    // business operation (e.g. approving leave should still work even if
    // the notification email fails).
    console.error('[EmailService] Failed to send email:', err);
  }
}
