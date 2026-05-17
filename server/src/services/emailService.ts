import nodemailer from 'nodemailer';
import logger from '../utils/logger';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async (options: { to: string; subject: string; html: string }) => {
  const mailOptions = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent: ${info.messageId}`);
  } catch (error) {
    logger.error(`Error sending email to ${options.to}:`, error);
  }
};

const getBaseTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #334155; }
    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .header { background-color: #0ea5e9; padding: 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
    .content { padding: 32px; line-height: 1.6; }
    .footer { background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 14px; color: #64748b; }
    .btn { display: inline-block; background-color: #0ea5e9; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: 600; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Ecommerce</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Ecommerce. All rights reserved.
    </div>
  </div>
</body>
</html>
`;

export const sendVerificationEmail = async (to: string, token: string) => {
  const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
  
  const content = `
    <h2>Verify your email address</h2>
    <p>Thank you for registering. Please confirm your email address by clicking the button below:</p>
    <a href="${verifyUrl}" class="btn">Verify Email</a>
    <p>If you did not create an account, please ignore this email.</p>
  `;

  await sendEmail({
    to,
    subject: 'Verify your email address',
    html: getBaseTemplate(content),
  });
};

export const sendPasswordResetEmail = async (to: string, token: string) => {
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
  
  const content = `
    <h2>Password Reset Request</h2>
    <p>You requested a password reset. Click the button below to set a new password:</p>
    <a href="${resetUrl}" class="btn">Reset Password</a>
    <p>This link will expire in 1 hour.</p>
    <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
  `;

  await sendEmail({
    to,
    subject: 'Password Reset Request',
    html: getBaseTemplate(content),
  });
};

export const sendOrderConfirmation = async (to: string, order: any) => {
  const content = `
    <h2>Order Confirmation</h2>
    <p>Thank you for your order! Your order <strong>#${order.orderNumber}</strong> has been received and is now being processed.</p>
    <p>Total: $${order.total.toFixed(2)}</p>
    <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/orders/${order._id}" class="btn">View Order</a>
  `;

  await sendEmail({
    to,
    subject: `Order Confirmation #${order.orderNumber}`,
    html: getBaseTemplate(content),
  });
};

export const sendOrderStatusUpdate = async (to: string, order: any, newStatus: string) => {
  const content = `
    <h2>Order Status Update</h2>
    <p>Your order <strong>#${order.orderNumber}</strong> has been updated to: <strong style="text-transform: capitalize;">${newStatus}</strong>.</p>
    <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/orders/${order._id}" class="btn">View Order</a>
  `;

  await sendEmail({
    to,
    subject: `Order Status Update #${order.orderNumber}`,
    html: getBaseTemplate(content),
  });
};
