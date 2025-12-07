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

// Send stock alert email
export const sendStockAlertEmail = async (alertData: {
    alertType: string;
    severity: string;
    message: string;
    itemName: string;
    itemSku: string;
    warehouseName: string;
    currentQty: number;
    threshold: number;
    unitOfMeasure: string;
    recipients: string[];
}) => {
    const transporter = createTransporter();
    if (!transporter) {
        console.error('[EMAIL] Cannot send alert - transporter not available');
        return { success: false, message: 'Email service not configured' };
    }

    const severityColors: Record<string, string> = {
        CRITICAL: '#DC2626',
        HIGH: '#EA580C',
        MEDIUM: '#CA8A04',
        LOW: '#2563EB',
    };

    const typeLabels: Record<string, string> = {
        OUT_OF_STOCK: 'Out of Stock',
        LOW_STOCK: 'Low Stock',
        REORDER_POINT: 'Reorder Point Reached',
        OVERSTOCK: 'Overstock Alert',
    };

    const subject = `[${alertData.severity}] ${
        typeLabels[alertData.alertType] || alertData.alertType
    } - ${alertData.itemName}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, ${
            severityColors[alertData.severity]
        } 0%, ${
        severityColors[alertData.severity]
    }dd 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; }
        .alert-badge { display: inline-block; padding: 8px 16px; background: ${
            severityColors[alertData.severity]
        }20; color: ${
        severityColors[alertData.severity]
    }; border-radius: 20px; font-weight: bold; margin-bottom: 20px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
        .info-item { padding: 15px; background: #f9fafb; border-radius: 8px; }
        .info-label { font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: 600; }
        .info-value { font-size: 18px; color: #111827; font-weight: bold; margin-top: 5px; }
        .message-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .action-button { display: inline-block; padding: 12px 24px; background: ${
            severityColors[alertData.severity]
        }; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0;">⚠️ Stock Alert</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Inventory Threshold Notification</p>
        </div>
        <div class="content">
            <div class="alert-badge">${alertData.severity} PRIORITY</div>
            
            <h2 style="margin-top: 0; color: #111827;">${
                typeLabels[alertData.alertType] || alertData.alertType
            }</h2>
            
            <div class="message-box">
                <strong>Alert Message:</strong><br>
                ${alertData.message}
            </div>

            <h3 style="color: #111827; margin-top: 30px;">Item Details</h3>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Item Name</div>
                    <div class="info-value">${alertData.itemName}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">SKU</div>
                    <div class="info-value">${alertData.itemSku}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Warehouse</div>
                    <div class="info-value">${alertData.warehouseName}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Current Quantity</div>
                    <div class="info-value" style="color: ${
                        severityColors[alertData.severity]
                    };">${alertData.currentQty} ${alertData.unitOfMeasure}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Threshold</div>
                    <div class="info-value">${alertData.threshold} ${
        alertData.unitOfMeasure
    }</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Alert Type</div>
                    <div class="info-value">${
                        typeLabels[alertData.alertType]
                    }</div>
                </div>
            </div>

            <h3 style="color: #111827; margin-top: 30px;">Recommended Actions</h3>
            <ul style="line-height: 1.8;">
                ${
                    alertData.alertType === 'OUT_OF_STOCK'
                        ? `
                    <li>🔴 <strong>URGENT:</strong> Place emergency order immediately</li>
                    <li>📞 Contact supplier for expedited delivery</li>
                    <li>📧 Notify sales team about stock unavailability</li>
                `
                        : ''
                }
                ${
                    alertData.alertType === 'LOW_STOCK'
                        ? `
                    <li>🟠 Review and approve purchase requisition</li>
                    <li>📦 Check for pending inbound orders</li>
                    <li>📊 Verify consumption rate and forecast demand</li>
                `
                        : ''
                }
                ${
                    alertData.alertType === 'REORDER_POINT'
                        ? `
                    <li>🟡 Initiate reorder process</li>
                    <li>📋 Review supplier lead times</li>
                    <li>💰 Check budget availability</li>
                `
                        : ''
                }
                ${
                    alertData.alertType === 'OVERSTOCK'
                        ? `
                    <li>🔵 Consider promotional activities</li>
                    <li>📦 Review storage capacity</li>
                    <li>💵 Evaluate return-to-supplier options</li>
                `
                        : ''
                }
            </ul>

            <div style="text-align: center;">
                <a href="${
                    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3009'
                }/dashboard/alerts" class="action-button">
                    View Alert Dashboard
                </a>
            </div>
        </div>
        <div class="footer">
            <p>This is an automated notification from your Warehouse Management System.</p>
            <p>Please do not reply to this email.</p>
            <p style="margin-top: 10px;">© ${new Date().getFullYear()} WMS Portal. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;

    const text = `
STOCK ALERT - ${alertData.severity} PRIORITY

${typeLabels[alertData.alertType] || alertData.alertType}

${alertData.message}

Item Details:
- Item: ${alertData.itemName}
- SKU: ${alertData.itemSku}
- Warehouse: ${alertData.warehouseName}
- Current Quantity: ${alertData.currentQty} ${alertData.unitOfMeasure}
- Threshold: ${alertData.threshold} ${alertData.unitOfMeasure}

Please review this alert in the WMS Portal: ${
        process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3009'
    }/dashboard/alerts

---
This is an automated notification from your Warehouse Management System.
    `.trim();

    try {
        await transporter.sendMail({
            from: `"WMS Alerts" <${EMAIL_CONFIG.auth.user}>`,
            to: alertData.recipients.join(', '),
            subject,
            html,
            text,
        });
        return { success: true, message: 'Alert email sent successfully' };
    } catch (error) {
        console.error('[EMAIL] Failed to send alert email:', error);
        return {
            success: false,
            message:
                error instanceof Error ? error.message : 'Failed to send email',
        };
    }
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
