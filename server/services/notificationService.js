const nodemailer = require('nodemailer');

// Configure Email Transporter
// Supports custom SMTP settings via process.env. SMTP fallback uses mock console logger if no host config.
const createTransporter = () => {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  // Return mock nodemailer instance
  return {
    sendMail: async (options) => {
      console.log(`[MOCK EMAIL SENT]
To: ${options.to}
Subject: ${options.subject}
Body: ${options.text || options.html}
==========================================`);
      return { messageId: 'mock-id-' + Math.random().toString(36).substring(7) };
    },
  };
};

const transporter = createTransporter();

/**
 * Send SMS notification (stubbed service layer)
 */
const sendSMS = async (phoneNumber, message) => {
  console.log(`[MOCK SMS SENT]
To: ${phoneNumber}
Message: ${message}
==========================================`);
  return { success: true, messageId: 'sms-mock-id-' + Math.random().toString(36).substring(7) };
};

/**
 * Notify customer of order status change
 * @param {Object} order order object with populated customer details
 * @param {string} status target status
 * @param {string} remarks optional status remarks
 */
const notifyOrderStatusChange = async (order, status, remarks = '') => {
  if (!order || !order.customer) {
    console.warn('Cannot send notification: order.customer not populated or order is null');
    return;
  }

  const { name, email, phone } = order.customer;
  const orderId = order.orderId;
  const remarksText = remarks ? ` Remarks: "${remarks}"` : '';

  let subject = '';
  let body = '';
  let smsMessage = '';

  switch (status) {
    case 'Created':
      subject = `Order Confirmed - ${orderId}`;
      body = `Hi ${name},\n\nYour delivery order ${orderId} has been successfully created. The total delivery charge is Rs. ${order.deliveryCharge.toFixed(2)}. We will assign a delivery agent shortly.\n\nThank you for choosing Last-Mile Delivery Tracker!`;
      smsMessage = `Hi ${name}, your order ${orderId} is confirmed. Charge: Rs. ${order.deliveryCharge.toFixed(2)}. We will assign an agent soon.`;
      break;
    case 'Picked Up':
      subject = `Order Picked Up - ${orderId}`;
      body = `Hi ${name},\n\nYour order ${orderId} has been picked up from the sender location.${remarksText}\n\nYou can track its progress on your dashboard.`;
      smsMessage = `Hi ${name}, your order ${orderId} has been picked up.${remarksText}`;
      break;
    case 'In Transit':
      subject = `Order In Transit - ${orderId}`;
      body = `Hi ${name},\n\nYour order ${orderId} is currently in transit.${remarksText}`;
      smsMessage = `Order ${orderId} is now in transit.${remarksText}`;
      break;
    case 'Out for Delivery':
      subject = `Out for Delivery - ${orderId}`;
      body = `Hi ${name},\n\nGreat news! Your order ${orderId} is out for delivery. Our delivery agent will arrive shortly.${remarksText}`;
      smsMessage = `Hi ${name}, order ${orderId} is out for delivery. Keep your phone handy!`;
      break;
    case 'Delivered':
      subject = `Order Delivered - ${orderId}`;
      body = `Hi ${name},\n\nYour order ${orderId} has been successfully delivered.${remarksText}\n\nWe value your feedback. Thank you!`;
      smsMessage = `Hi ${name}, order ${orderId} has been delivered successfully. Thank you!`;
      break;
    case 'Failed':
      subject = `Delivery Attempt Failed - ${orderId}`;
      body = `Hi ${name},\n\nWe were unable to deliver your order ${orderId}.${remarksText}\n\nPlease log in to your dashboard to reschedule the delivery to a convenient date.`;
      smsMessage = `Hi ${name}, delivery attempt for ${orderId} failed.${remarksText} Reschedule details are on your dashboard.`;
      break;
    case 'Rescheduled':
      subject = `Delivery Rescheduled - ${orderId}`;
      const rDate = order.rescheduleDate ? new Date(order.rescheduleDate).toLocaleDateString() : 'N/A';
      body = `Hi ${name},\n\nYour delivery attempt for order ${orderId} has been rescheduled to ${rDate}.${remarksText}\n\nWe will update you when the agent departs.`;
      smsMessage = `Hi ${name}, order ${orderId} is rescheduled for delivery on ${rDate}.`;
      break;
    default:
      subject = `Order Status Update - ${orderId}`;
      body = `Hi ${name},\n\nYour order ${orderId} status has changed to: ${status}.${remarksText}`;
      smsMessage = `Order ${orderId} status updated to ${status}.${remarksText}`;
      break;
  }

  try {
    // Dispatch Email
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Last-Mile Delivery" <noreply@lastmile.com>',
      to: email,
      subject,
      text: body,
    });

    // Dispatch SMS
    if (phone) {
      await sendSMS(phone, smsMessage);
    }
  } catch (error) {
    console.error('Error dispatching notifications:', error);
  }
};

module.exports = {
  notifyOrderStatusChange,
  sendSMS,
};
