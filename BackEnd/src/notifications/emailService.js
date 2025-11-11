const birdService = require('../../config/bird');
const { Notification } = require('../models');

/**
 * Send Email via Bird.com
 * @param {string} to - Email address
 * @param {string} subject - Email subject
 * @param {string} htmlContent - HTML email content
 * @param {number} userId - User ID for notification log
 * @param {string} type - Notification type
 */
const sendEmail = async (to, subject, htmlContent, userId = null, type = 'email') => {
  try {
    await birdService.sendEmail(to, subject, htmlContent);

    // Log notification on success
    if (userId) {
      await Notification.create({
        userId,
        type,
        channel: 'email',
        title: subject || 'Email Notification',
        recipient: to,
        content: htmlContent || subject,
        status: 'sent'
      });
    }

    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    // If service not configured, log but don't fail the main operation
    if (error.message && error.message.includes('not configured')) {
      console.warn(`⚠️  Email not sent to ${to}: ${error.message}`);
      if (userId) {
        await Notification.create({
          userId,
          type,
          channel: 'email',
          title: subject || 'Email Notification',
          recipient: to,
          content: htmlContent || subject,
          status: 'failed',
          error: error.message
        });
      }
      return { success: false, message: 'Email service not configured' };
    }

    // Log failed notification for other errors
    console.error('Email sending error:', error);
    
    if (userId) {
      await Notification.create({
        userId,
        type,
        channel: 'email',
        title: subject || 'Email Notification',
        recipient: to,
        content: htmlContent || subject,
        status: 'failed',
        error: error.message
      });
    }

    // Don't throw - return error response instead
    return { success: false, message: error.message || 'Failed to send email' };
  }
};

/**
 * Send welcome email
 */
const sendWelcomeEmail = async (email, userName) => {
  const subject = 'Welcome to UMURENGE WALLET';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #1e40af;">Welcome to UMURENGE WALLET!</h1>
      <p>Dear ${userName},</p>
      <p>Your account has been successfully registered. Welcome to Rwanda's digital microfinance platform for saving groups.</p>
      <p>You can now:</p>
      <ul>
        <li>Make contributions to your group</li>
        <li>Apply for loans</li>
        <li>Track your savings</li>
        <li>Participate in group activities</li>
      </ul>
      <p>Best regards,<br>UMURENGE WALLET Team</p>
    </div>
  `;
  return await sendEmail(email, subject, html, null, 'registration');
};

/**
 * Send loan approval email
 */
const sendLoanApprovalEmail = async (email, memberName, loanAmount, monthlyPayment, duration) => {
  const subject = 'Loan Approved - UMURENGE WALLET';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #059669;">Loan Approved!</h1>
      <p>Dear ${memberName},</p>
      <p>Congratulations! Your loan request has been approved.</p>
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Loan Amount:</strong> RWF ${loanAmount.toLocaleString()}</p>
        <p><strong>Monthly Payment:</strong> RWF ${monthlyPayment.toLocaleString()}</p>
        <p><strong>Duration:</strong> ${duration} months</p>
      </div>
      <p>Please log in to your account to view full details.</p>
      <p>Best regards,<br>UMURENGE WALLET Team</p>
    </div>
  `;
  return await sendEmail(email, subject, html, null, 'loan_approval');
};

/**
 * Send loan rejection email
 */
const sendLoanRejectionEmail = async (email, memberName, reason) => {
  const subject = 'Loan Request Update - UMURENGE WALLET';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #dc2626;">Loan Request Update</h1>
      <p>Dear ${memberName},</p>
      <p>We regret to inform you that your loan request has been declined.</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p>Please contact your group administrator for more information or to discuss alternative options.</p>
      <p>Best regards,<br>UMURENGE WALLET Team</p>
    </div>
  `;
  return await sendEmail(email, subject, html, null, 'loan_rejection');
};

/**
 * Send contribution summary email
 */
const sendContributionSummary = async (email, memberName, amount, balance) => {
  const subject = 'Contribution Confirmed - UMURENGE WALLET';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #1e40af;">Contribution Received</h1>
      <p>Dear ${memberName},</p>
      <p>Your contribution has been successfully processed.</p>
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Amount:</strong> RWF ${amount.toLocaleString()}</p>
        <p><strong>New Balance:</strong> RWF ${balance.toLocaleString()}</p>
      </div>
      <p>Thank you for your continued participation.</p>
      <p>Best regards,<br>UMURENGE WALLET Team</p>
    </div>
  `;
  return await sendEmail(email, subject, html, null, 'contribution_confirmation');
};

/**
 * Send Learn & Grow content update email
 */
const sendLearnGrowUpdate = async (email, memberName, contentTitle) => {
  const subject = 'New Learning Content Available - UMURENGE WALLET';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #1e40af;">New Learning Content</h1>
      <p>Dear ${memberName},</p>
      <p>New educational content is available in your "Learn & Grow" section:</p>
      <p><strong>${contentTitle}</strong></p>
      <p>Log in to access this content and enhance your financial literacy.</p>
      <p>Best regards,<br>UMURENGE WALLET Team</p>
    </div>
  `;
  return await sendEmail(email, subject, html, null, 'learn_grow_update');
};

/**
 * Send OTP email
 */
const sendOtpEmail = async (email, memberName, otp) => {
  const subject = 'Your UMURENGE WALLET OTP Code';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #1e40af;">OTP Verification</h1>
      <p>Dear ${memberName || 'Member'},</p>
      <p>Your one-time password (OTP) is:</p>
      <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:12px 0;font-size:20px;letter-spacing:4px;font-weight:bold;">${otp}</div>
      <p>This code is valid for 10 minutes. Do not share it with anyone.</p>
      <p>Best regards,<br>UMURENGE WALLET Team</p>
    </div>
  `;
  return await sendEmail(email, subject, html, null, 'otp');
};

/**
 * Send approval email
 */
const sendApprovalEmail = async (email, memberName) => {
  const subject = 'Account Approved - UMURENGE WALLET';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #059669;">Account Approved</h1>
      <p>Dear ${memberName || 'Member'},</p>
      <p>Your account has been approved by your Group Admin. You can now log in and start using the platform.</p>
      <p>Best regards,<br>UMURENGE WALLET Team</p>
    </div>
  `;
  return await sendEmail(email, subject, html, null, 'approval');
};

/**
 * Send loan request notification email to Group Admin
 */
const sendLoanRequestEmail = async (email, subject, htmlContent, userId) => {
  return await sendEmail(email, subject, htmlContent, userId, 'loan_request');
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendLoanApprovalEmail,
  sendLoanRejectionEmail,
  sendContributionSummary,
  sendLearnGrowUpdate,
  sendOtpEmail,
  sendApprovalEmail,
  sendLoanRequestEmail
};
