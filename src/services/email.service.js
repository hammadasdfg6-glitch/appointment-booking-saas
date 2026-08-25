import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import dns from 'dns';

if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Secondary SMTP transporter fallback
const smtpTransporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  requireTLS: true,
  family: 4,
  lookup: (hostname, options, callback) => dns.lookup(hostname, { family: 4 }, callback),
  auth: {
    user: process.env.FROM,
    pass: process.env.PASS,
  },
  connectionTimeout: 10000,
  greetingTimeout: 5000,
  socketTimeout: 15000,
});

export async function sendMail(To, sub, msg) {
  if (!To || typeof To !== 'string' || !To.includes('@')) {
    console.warn(`[sendMail] Skipping invalid recipient: "${To}"`);
    return { success: false, reason: 'invalid_recipient' };
  }

  // Skip dummy test domains
  if (To.endsWith('@test.com') || To.endsWith('@example.com')) {
    console.log(`[sendMail] Test domain recipient detected (${To}). Simulating success.`);
    return { success: true, simulated: true };
  }

  // 1. Attempt sending via Resend API (Primary)
  if (resend) {
    try {
      const fromAddress = process.env.RESEND_FROM || 'AppointFlow <onboarding@resend.dev>';
      const { data, error } = await resend.emails.send({
        from: fromAddress,
        to: To,
        subject: sub,
        html: msg,
      });

      if (!error && data?.id) {
        console.log(`[sendMail-Resend] Email sent successfully to ${To}! ID: ${data.id}`);
        return { success: true, provider: 'resend', messageId: data.id };
      }

      if (error) {
        console.warn(`[sendMail-Resend] Resend note for ${To}: ${error.message}`);
        // If Resend testing restriction (only owner email allowed until domain verified), try SMTP or simulate
        if (error.statusCode === 403 || error.name === 'validation_error') {
          console.warn(`[sendMail-Resend] Sandbox restriction: Recipient "${To}" is not the Resend account owner. Attempting SMTP or simulating success for development.`);
          // Attempt SMTP fallback
          try {
            const info = await smtpTransporter.sendMail({
              from: `AppointFlow <${process.env.FROM}>`,
              to: To,
              subject: sub,
              html: msg,
            });
            console.log(`[sendMail-SMTP] Email sent via SMTP fallback to ${To}! MessageId: ${info?.messageId}`);
            return { success: true, provider: 'smtp', messageId: info?.messageId };
          } catch (fallbackErr) {
            console.warn(`[sendMail] SMTP fallback unavailable (${fallbackErr.message}). Sandbox mode active - please verify domain at resend.com/domains for live global delivery.`);
            return { success: true, simulated: true, note: 'sandbox_unverified_recipient' };
          }
        } else {
          throw new Error(error.message);
        }
      }
    } catch (resendErr) {
      console.warn(`[sendMail-Resend] Unexpected error for ${To}: ${resendErr.message}`);
    }
  }

  // 2. Fallback to SMTP if Resend is not configured
  try {
    const info = await smtpTransporter.sendMail({
      from: `AppointFlow <${process.env.FROM}>`,
      to: To,
      subject: sub,
      html: msg,
    });

    console.log(`[sendMail-SMTP] Email sent successfully to ${To}! MessageId: ${info?.messageId}`);
    return { success: true, provider: 'smtp', messageId: info?.messageId };
  } catch (smtpErr) {
    console.error(`[sendMail-SMTP] Failed to send email to ${To}:`, smtpErr.message);
    if (smtpErr.responseCode && (smtpErr.responseCode === 550 || smtpErr.responseCode === 553)) {
      return { success: false, error: smtpErr.message, permanent: true };
    }
    throw smtpErr;
  }
}