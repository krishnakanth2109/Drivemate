import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { auth } from '../config/firebase.js';

dotenv.config();

// Create reusable Nodemailer transporter
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.GMAIL_PASS;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    console.log(`📧 [Email Service] Initialized SMTP transporter for host: ${host}`);
  } else if (user && pass) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
    console.log(`📧 [Email Service] Initialized Gmail transporter for user: ${user}`);
  } else {
    // Development / fallback transporter that outputs email details cleanly to logs
    transporter = nodemailer.createTransport({
      jsonTransport: true,
    });
    console.log(`📧 [Email Service] Initialized dev/fallback transporter (Full delivery logging enabled)`);
  }

  return transporter;
}

export const emailService = {
  /**
   * Send connection invite email to recipient
   */
  async sendConnectionInviteEmail({ toEmail, recipientName, senderName, senderTag }) {
    if (!toEmail) return { success: false, reason: 'No recipient email' };

    const subject = `🚗 New Connection Invite on Drivemate from ${senderName || 'a Driver'}`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e4e4e7; border-radius: 16px; background-color: #ffffff;">
        <div style="background-color: #09090b; padding: 12px 18px; border-radius: 10px; display: inline-block; margin-bottom: 20px;">
          <span style="color: #ffffff; font-weight: 800; font-size: 16px; letter-spacing: 1px;">DRIVEMATE</span>
        </div>
        <h2 style="color: #09090b; font-size: 22px; margin-top: 0; font-weight: 800;">New Connection Invite</h2>
        <p style="color: #3f3f46; font-size: 15px; line-height: 24px;">
          Hi <strong>${recipientName || 'Driver'}</strong>,
        </p>
        <p style="color: #3f3f46; font-size: 15px; line-height: 24px;">
          <strong>${senderName}</strong> (${senderTag || '@driver'}) has invited you to connect on Drivemate!
        </p>
        <div style="background-color: #f4f4f5; padding: 16px; border-radius: 12px; margin: 20px 0;">
          <p style="margin: 0; color: #18181b; font-size: 14px; font-weight: 600;">
            Accept this request in Drivemate to start direct messaging, sharing live road waypoints, and coordinating journeys.
          </p>
        </div>
        <p style="color: #71717a; font-size: 13px; line-height: 20px; margin-top: 24px; border-top: 1px solid #f4f4f5; padding-top: 16px;">
          Open the Drivemate app > Messages > Requests tab to accept or decline.
        </p>
      </div>
    `;

    try {
      const mailer = getTransporter();
      const fromAddress = process.env.EMAIL_FROM || '"Drivemate" <notifications@drivemate.com>';
      const info = await mailer.sendMail({
        from: fromAddress,
        to: toEmail,
        subject,
        html,
        text: `Hi ${recipientName || 'Driver'}, ${senderName} (${senderTag}) sent you a connection invite on Drivemate. Open Drivemate to accept!`,
      });

      console.log(`📨 [Email Service] Connection Invite email sent to: ${toEmail}`, {
        messageId: info.messageId,
      });

      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`❌ [Email Service] Failed to send invite email to ${toEmail}:`, err.message);
      return { success: false, error: err.message };
    }
  },

  /**
   * Send connection accepted email to original sender
   */
  async sendConnectionAcceptedEmail({ toEmail, senderName, acceptorName, acceptorTag }) {
    if (!toEmail) return { success: false, reason: 'No recipient email' };

    const subject = `🎉 Connection Accepted! You and ${acceptorName || 'Driver'} are now connected`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e4e4e7; border-radius: 16px; background-color: #ffffff;">
        <div style="background-color: #09090b; padding: 12px 18px; border-radius: 10px; display: inline-block; margin-bottom: 20px;">
          <span style="color: #ffffff; font-weight: 800; font-size: 16px; letter-spacing: 1px;">DRIVEMATE</span>
        </div>
        <h2 style="color: #09090b; font-size: 22px; margin-top: 0; font-weight: 800;">Connection Accepted!</h2>
        <p style="color: #3f3f46; font-size: 15px; line-height: 24px;">
          Hi <strong>${senderName || 'Driver'}</strong>,
        </p>
        <p style="color: #3f3f46; font-size: 15px; line-height: 24px;">
          Great news! <strong>${acceptorName}</strong> (${acceptorTag || '@driver'}) has accepted your connection request on Drivemate.
        </p>
        <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 16px; border-radius: 12px; margin: 20px 0;">
          <p style="margin: 0; color: #065f46; font-size: 14px; font-weight: 600;">
            ✓ Your private conversation room is now open! You can send direct messages, photos, live waypoints, and documents.
          </p>
        </div>
        <p style="color: #71717a; font-size: 13px; line-height: 20px; margin-top: 24px; border-top: 1px solid #f4f4f5; padding-top: 16px;">
          Open the Drivemate app > Messages to start chatting.
        </p>
      </div>
    `;

    try {
      const mailer = getTransporter();
      const fromAddress = process.env.EMAIL_FROM || '"Drivemate" <notifications@drivemate.com>';
      const info = await mailer.sendMail({
        from: fromAddress,
        to: toEmail,
        subject,
        html,
        text: `Hi ${senderName || 'Driver'}, ${acceptorName} accepted your connection request on Drivemate. Open Drivemate to chat!`,
      });

      console.log(`📨 [Email Service] Connection Accepted email sent to: ${toEmail}`, {
        messageId: info.messageId,
      });

      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`❌ [Email Service] Failed to send accepted email to ${toEmail}:`, err.message);
      return { success: false, error: err.message };
    }
  },

  /**
   * Send 6-digit verification OTP code
   */
  async sendVerificationOtpEmail({ toEmail, otpCode, recipientName }) {
    if (!toEmail) return { success: false, reason: 'No email' };

    const subject = `🔐 Your Drivemate Verification Code: ${otpCode}`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e4e4e7; border-radius: 16px; background-color: #ffffff;">
        <div style="background-color: #09090b; padding: 12px 18px; border-radius: 10px; display: inline-block; margin-bottom: 20px;">
          <span style="color: #ffffff; font-weight: 800; font-size: 16px; letter-spacing: 1px;">DRIVEMATE</span>
        </div>
        <h2 style="color: #09090b; font-size: 22px; margin-top: 0; font-weight: 800;">Driver Verification Code</h2>
        <p style="color: #3f3f46; font-size: 15px; line-height: 24px;">
          Hi <strong>${recipientName || 'Driver'}</strong>,
        </p>
        <p style="color: #3f3f46; font-size: 15px; line-height: 24px;">
          Use the 6-digit verification code below to verify your Drivemate driver account:
        </p>
        <div style="background-color: #f4f4f5; text-align: center; padding: 20px; border-radius: 12px; margin: 24px 0;">
          <span style="font-family: monospace; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #09090b;">${otpCode}</span>
        </div>
        <p style="color: #71717a; font-size: 13px; line-height: 20px;">
          This code is valid for 10 minutes. If you did not request this verification, please ignore this email.
        </p>
      </div>
    `;

    try {
      const mailer = getTransporter();
      const fromAddress = process.env.EMAIL_FROM || '"Drivemate Security" <auth@drivemate.com>';
      const info = await mailer.sendMail({
        from: fromAddress,
        to: toEmail,
        subject,
        html,
        text: `Your Drivemate verification code is: ${otpCode}. Valid for 10 minutes.`,
      });

      console.log(`📨 [Email Service] OTP Verification email sent to: ${toEmail}`, {
        messageId: info.messageId,
      });

      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`❌ [Email Service] Failed to send OTP email to ${toEmail}:`, err.message);
      return { success: false, error: err.message };
    }
  },
};

export default emailService;

