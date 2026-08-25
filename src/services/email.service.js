import nodemailer from 'nodemailer';
import dns from 'dns';

// Ensure IPv4 first to prevent ENETUNREACH in Railway / Cloud Docker environments
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  family: 4, // Force IPv4 socket connection
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

  // Skip dummy test domains that cause SMTP 550 errors
  if (To.endsWith('@test.com') || To.endsWith('@example.com')) {
    console.log(`[sendMail] Test domain recipient detected (${To}). Simulating success.`);
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from: `AppointFlow <${process.env.FROM}>`,
      to: To,
      subject: sub,
      html: msg,
    });

    console.log(`[sendMail] Email sent successfully to ${To}! MessageId: ${info?.messageId}`);
    return { success: true, messageId: info?.messageId };
  } catch (err) {
    console.error(`[sendMail] Failed to send email to ${To}:`, err.message);
    // If it's a permanent recipient rejection (550 / 553 / Invalid Recipient), don't crash queue
    if (err.responseCode && (err.responseCode === 550 || err.responseCode === 553)) {
      return { success: false, error: err.message, permanent: true };
    }
    throw err;
  }
}