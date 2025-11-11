require('dotenv').config();
const fetch = require('node-fetch');
const nodemailer = require('nodemailer');

const BIRD_API_URL = 'https://api.bird.com/v1/email/send';

async function sendViaBird(to, subject, htmlContent) {
  const apiKey = process.env.BIRD_API_KEY;
  const senderEmail = process.env.BIRD_SENDER_EMAIL;

  if (!apiKey || !senderEmail) {
    throw new Error('Bird.com email service not configured');
  }

  const response = await fetch(BIRD_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      from: senderEmail,
      to,
      subject,
      html: htmlContent
    })
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Bird API error: ${error}`);
  }
  return await response.json();
}

async function sendViaSmtp(to, subject, htmlContent) {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;

  if (!host || !user || !pass) {
    throw new Error('SMTP not configured');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });

  const info = await transporter.sendMail({ from, to, subject, html: htmlContent });
  return { success: true, messageId: info.messageId };
}

module.exports = {
  sendEmail: async (to, subject, htmlContent) => {
    // Prefer Bird if configured; otherwise fall back to SMTP (e.g., Gmail App Password)
    try {
      if (process.env.BIRD_API_KEY && process.env.BIRD_SENDER_EMAIL) {
        return await sendViaBird(to, subject, htmlContent);
      }
    } catch (err) {
      console.warn('Bird.com send failed, attempting SMTP fallback:', err.message);
    }

    try {
      return await sendViaSmtp(to, subject, htmlContent);
    } catch (err) {
      console.error('SMTP email send failed:', err.message);
      throw new Error('Email service not configured');
    }
  }
};

