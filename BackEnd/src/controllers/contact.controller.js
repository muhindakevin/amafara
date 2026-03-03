const { sendEmail } = require('../notifications/emailService');

/**
 * Send contact form message
 */
const sendContactMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Create email content
    const emailSubject = subject || `Contact Form Message from ${name}`;
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">IKIMINA WALLET</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">New Contact Form Submission</p>
        </div>
        
        <div style="padding: 30px; background-color: #ffffff; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
            <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 20px;">Contact Information</h2>
            <p style="margin: 8px 0; color: #374151;"><strong>Name:</strong> <span style="color: #1f2937;">${name}</span></p>
            <p style="margin: 8px 0; color: #374151;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #f59e0b; text-decoration: underline;">${email}</a></p>
            ${subject ? `<p style="margin: 8px 0; color: #374151;"><strong>Subject:</strong> <span style="color: #1f2937;">${subject}</span></p>` : ''}
            <p style="margin: 8px 0; color: #374151;"><strong>Date:</strong> <span style="color: #1f2937;">${new Date().toLocaleString()}</span></p>
          </div>
          
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
            <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 18px;">Message</h3>
            <p style="color: #451a03; line-height: 1.6; margin: 0; white-space: pre-wrap;">${message}</p>
          </div>
          
          <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              This message was sent from the IKIMINA WALLET contact form. You can reply directly to the sender's email address.
            </p>
          </div>
        </div>
      </div>
    `;

    // Send email to the support email
    const result = await sendEmail(
      'kevinmuhinda8@gmail.com', // Your email from the contact section
      emailSubject,
      emailContent
    );

    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Message sent successfully! We will get back to you within 24 hours.'
      });
    } else {
      throw new Error(result.message || 'Failed to send email');
    }

  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again or contact us directly.'
    });
  }
};

module.exports = {
  sendContactMessage
};
