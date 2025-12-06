import nodemailer from 'nodemailer';

// Email configuration
const EMAIL_CONFIG = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
    },
};

// Create reusable transporter
const createTransporter = () => {
    try {
        return nodemailer.createTransport(EMAIL_CONFIG);
    } catch (error) {
        console.error('[EMAIL] Failed to create transporter:', error);
        return null;
    }
};

// Email templates
const templates = {
    userRegistration: (data: {
        fullName: string;
        email: string;
        username: string;
        role: string;
        temporaryPassword?: string;
    }) => ({
        subject: 'Welcome to WMS - Your Account Has Been Created',
        html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
          .content { background: #f9fafb; padding: 30px; }
          .credentials { background: white; padding: 20px; border-left: 4px solid #1e40af; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .button { display: inline-block; padding: 12px 24px; background: #1e40af; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to WMS</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.fullName},</h2>
            <p>Your account has been successfully created in the Warehouse Management System.</p>
            
            <div class="credentials">
              <h3>Your Login Credentials:</h3>
              <p><strong>Email:</strong> ${data.email}</p>
              <p><strong>Username:</strong> ${data.username}</p>
              <p><strong>Role:</strong> ${data.role}</p>
              ${
                  data.temporaryPassword
                      ? `<p><strong>Temporary Password:</strong> ${data.temporaryPassword}</p>`
                      : ''
              }
            </div>
            
            <p>You can now log in to the system using your email and password.</p>
            
            <a href="${
                process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
            }/login" class="button">
              Login to WMS
            </a>
            
            <p style="margin-top: 20px; color: #666;">
              <strong>Security Note:</strong> Please change your password after your first login for security purposes.
            </p>
          </div>
          <div class="footer">
            <p>This is an automated message from WMS. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} Warehouse Management System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
        text: `
Welcome to WMS, ${data.fullName}!

Your account has been successfully created.

Login Credentials:
- Email: ${data.email}
- Username: ${data.username}
- Role: ${data.role}
${
    data.temporaryPassword
        ? `- Temporary Password: ${data.temporaryPassword}`
        : ''
}

You can log in at: ${
            process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
        }/login

Please change your password after your first login for security purposes.

---
This is an automated message from WMS.
    `.trim(),
    }),
};

// Send email function
export const sendEmail = async (options: {
    to: string;
    subject: string;
    html: string;
    text: string;
}) => {
    // Check if email is configured
    if (!EMAIL_CONFIG.auth.user || !EMAIL_CONFIG.auth.pass) {
        console.log(
            '[EMAIL] SMTP not configured, email would be sent to:',
            options.to
        );
        console.log('[EMAIL] Subject:', options.subject);
        console.log('[EMAIL] Content (text):', options.text);
        return {
            success: false,
            message: 'SMTP not configured - email logged to console',
            preview: options,
        };
    }

    const transporter = createTransporter();
    if (!transporter) {
        return {
            success: false,
            message: 'Failed to create email transporter',
        };
    }

    try {
        const info = await transporter.sendMail({
            from: `"WMS System" <${EMAIL_CONFIG.auth.user}>`,
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html,
        });

        console.log('[EMAIL] Message sent successfully:', info.messageId);
        return {
            success: true,
            messageId: info.messageId,
        };
    } catch (error) {
        console.error('[EMAIL] Failed to send email:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
            error,
        };
    }
};

// Send user registration email
export const sendUserRegistrationEmail = async (userData: {
    fullName: string;
    email: string;
    username: string;
    role: string;
    temporaryPassword?: string;
}) => {
    const template = templates.userRegistration(userData);
    return sendEmail({
        to: userData.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
    });
};

// Test email configuration
export const testEmailConfig = async () => {
    const transporter = createTransporter();
    if (!transporter) {
        return { success: false, message: 'Failed to create transporter' };
    }

    try {
        await transporter.verify();
        return { success: true, message: 'Email configuration is valid' };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
        };
    }
};
