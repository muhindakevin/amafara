const { Newsletter } = require('../models');

// Subscribe to newsletter
const subscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    // Check if email already exists
    const existing = await Newsletter.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'This email is already subscribed to our newsletter'
      });
    }

    // Create newsletter subscription
    const subscription = await Newsletter.create({
      email,
      subscribed: true
    });

    res.status(201).json({
      success: true,
      message: 'Successfully subscribed to newsletter!',
      data: subscription
    });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to subscribe to newsletter',
      error: error.message
    });
  }
};

// Unsubscribe from newsletter
const unsubscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const subscription = await Newsletter.findOne({ where: { email } });
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Email not found in newsletter subscriptions'
      });
    }

    await subscription.update({ subscribed: false });

    res.json({
      success: true,
      message: 'Successfully unsubscribed from newsletter'
    });
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unsubscribe from newsletter',
      error: error.message
    });
  }
};

// Get all newsletter subscriptions (admin only)
const getNewsletterSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Newsletter.findAll({
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: subscriptions
    });
  } catch (error) {
    console.error('Get newsletter subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch newsletter subscriptions',
      error: error.message
    });
  }
};

module.exports = {
  subscribeNewsletter,
  unsubscribeNewsletter,
  getNewsletterSubscriptions
};
