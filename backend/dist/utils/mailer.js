"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
exports.passwordResetEmail = passwordResetEmail;
exports.lowStockAlertEmail = lowStockAlertEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = require("../config/env");
const logger_1 = require("../config/logger");
let transporter = null;
function getTransporter() {
    if (!transporter) {
        transporter = nodemailer_1.default.createTransport({
            host: env_1.env.SMTP_HOST,
            port: env_1.env.SMTP_PORT,
            secure: env_1.env.SMTP_SECURE,
            auth: env_1.env.SMTP_USER
                ? {
                    user: env_1.env.SMTP_USER,
                    pass: env_1.env.SMTP_PASS,
                }
                : undefined,
        });
    }
    return transporter;
}
async function sendEmail(options) {
    try {
        if (!env_1.env.SMTP_USER) {
            logger_1.logger.warn('SMTP not configured – skipping email send', { to: options.to, subject: options.subject });
            return;
        }
        const info = await getTransporter().sendMail({
            from: env_1.env.EMAIL_FROM,
            to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
            subject: options.subject,
            html: options.html,
            text: options.text,
        });
        logger_1.logger.info('Email sent', { messageId: info.messageId, to: options.to });
    }
    catch (err) {
        logger_1.logger.error('Failed to send email', { err, to: options.to });
        // Don't throw – email failure shouldn't break app flow
    }
}
function passwordResetEmail(resetUrl, firstName) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Inter, Arial, sans-serif; background: #0A0F1E; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #131929; border-radius: 16px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #4F46E5, #7C3AED); padding: 40px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; }
        .body { padding: 40px; color: #CBD5E1; line-height: 1.6; }
        .body h2 { color: #F1F5F9; }
        .btn { display: inline-block; background: linear-gradient(135deg, #4F46E5, #7C3AED); color: white !important; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 24px 0; }
        .footer { padding: 20px 40px; border-top: 1px solid #1E2D45; color: #64748B; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⛽ FuelCore</h1>
        </div>
        <div class="body">
          <h2>Password Reset Request</h2>
          <p>Hi ${firstName},</p>
          <p>You requested a password reset for your FuelCore account. Click the button below to set a new password:</p>
          <a href="${resetUrl}" class="btn">Reset Password</a>
          <p>This link will expire in <strong>1 hour</strong>. If you didn't request this, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>FuelCore Enterprise Fuel Management &copy; ${new Date().getFullYear()}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
function lowStockAlertEmail(tankName, currentLiters, stationName) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Inter, Arial, sans-serif; background: #0A0F1E; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #131929; border-radius: 16px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #D97706, #EF4444); padding: 40px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .body { padding: 40px; color: #CBD5E1; line-height: 1.6; }
        .alert-box { background: rgba(239, 68, 68, 0.1); border: 1px solid #EF4444; border-radius: 8px; padding: 20px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>⚠️ Low Stock Alert</h1></div>
        <div class="body">
          <div class="alert-box">
            <p><strong>Station:</strong> ${stationName}</p>
            <p><strong>Tank:</strong> ${tankName}</p>
            <p><strong>Current Level:</strong> ${currentLiters.toLocaleString()} L</p>
          </div>
          <p>Please arrange a fuel refill as soon as possible to avoid service disruption.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
//# sourceMappingURL=mailer.js.map