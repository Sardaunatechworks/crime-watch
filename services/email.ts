import nodemailer from 'nodemailer';
import { Incident } from '../types';

// Email configuration from environment variables
const SMTP_HOST = import.meta.env.VITE_SMTP_HOST || '';
const SMTP_PORT = parseInt(import.meta.env.VITE_SMTP_PORT || '587');
const SMTP_USER = import.meta.env.VITE_SMTP_USER || '';
const SMTP_PASSWORD = import.meta.env.VITE_SMTP_PASSWORD || '';
const SMTP_FROM = import.meta.env.VITE_SMTP_FROM || '';
const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').filter((email: string) => email.trim());

// Create transporter
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // true for 465, false for other ports
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASSWORD,
  },
});

// Email template for crime report
const getEmailTemplate = (incident: Incident): string => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 5px; }
          .content { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .alert { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; }
          .detail { margin: 15px 0; }
          .label { font-weight: bold; color: #667eea; }
          .value { margin-top: 5px; padding: 10px; background: #f5f5f5; border-radius: 3px; }
          .footer { font-size: 12px; color: #999; text-align: center; margin-top: 20px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 New Crime Report Alert</h1>
            <p>A new incident has been reported and requires your attention.</p>
          </div>
          
          <div class="alert">
            <strong>Priority:</strong> This incident requires immediate review and action from your team.
          </div>

          <div class="content">
            <h2>Incident Details</h2>
            
            <div class="detail">
              <div class="label">📌 Incident Title:</div>
              <div class="value">${incident.title}</div>
            </div>

            <div class="detail">
              <div class="label">🏷️ Category:</div>
              <div class="value">${incident.category}</div>
            </div>

            <div class="detail">
              <div class="label">📍 Location:</div>
              <div class="value">${incident.location}</div>
            </div>

            <div class="detail">
              <div class="label">👤 Reported By:</div>
              <div class="value">${incident.reporter_email || 'Anonymous User'}</div>
            </div>

            <div class="detail">
              <div class="label">⏰ Report Time:</div>
              <div class="value">${new Date(incident.created_at).toLocaleString()}</div>
            </div>

            <div class="detail">
              <div class="label">📝 Description:</div>
              <div class="value">${incident.description}</div>
            </div>

            <div class="detail">
              <div class="label">🆔 Case Reference:</div>
              <div class="value">#${incident.id.slice(0, 8).toUpperCase()}</div>
            </div>

            <div class="detail">
              <div class="label">Status:</div>
              <div class="value">
                <span style="background: #fff3cd; padding: 5px 10px; border-radius: 3px;">
                  ${incident.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          <div class="content">
            <h3>📊 Next Steps:</h3>
            <ul>
              <li>Login to your Crime Watch dashboard to view full details</li>
              <li>Assign the case to an investigator if needed</li>
              <li>Update the incident status as you progress</li>
              <li>Keep the reporter informed of any updates</li>
            </ul>
          </div>

          <center>
            <a href="${import.meta.env.VITE_APP_URL || 'https://crime-watch.app'}" class="button">
              View in Dashboard →
            </a>
          </center>

          <div class="footer">
            <p>Crime Watch - Community Safety Platform</p>
            <p>This is an automated notification. Do not reply to this email.</p>
            <p>${new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

export const emailService = {
  // Send crime report notification to admins
  sendCrimeReportAlert: async (incident: Incident): Promise<boolean> => {
    try {
      // Validate configuration
      if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD || !SMTP_FROM || ADMIN_EMAILS.length === 0) {
        console.warn('Email service not configured. Skipping notification.');
        return false;
      }

      // Send email to all admins
      const mailOptions = {
        from: SMTP_FROM,
        to: ADMIN_EMAILS.join(','),
        subject: `🚨 URGENT: New Crime Report - ${incident.title}`,
        html: getEmailTemplate(incident),
        replyTo: incident.reporter_email || SMTP_FROM,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Crime report email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('Error sending crime report email:', error);
      return false;
    }
  },

  // Send status update notification to reporter
  sendStatusUpdateEmail: async (incident: Incident, newStatus: string): Promise<boolean> => {
    try {
      if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD || !SMTP_FROM || !incident.reporter_email) {
        return false;
      }

      const mailOptions = {
        from: SMTP_FROM,
        to: incident.reporter_email,
        subject: `📋 Status Update: Your Crime Report #${incident.id.slice(0, 8).toUpperCase()}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; color: #333; }
                .container { max-width: 600px; margin: 20px auto; padding: 20px; background: #f9f9f9; }
                .content { background: white; padding: 20px; border-radius: 5px; }
                .status { display: inline-block; padding: 10px 15px; border-radius: 5px; background: #667eea; color: white; font-weight: bold; }
              </style>
            </head>
            <body>
              <div class="container">
                <h2>Hello,</h2>
                <p>We wanted to inform you about an update to your crime report.</p>
                
                <div class="content">
                  <p><strong>Case Reference:</strong> #${incident.id.slice(0, 8).toUpperCase()}</p>
                  <p><strong>Original Report:</strong> ${incident.title}</p>
                  <p><strong>Location:</strong> ${incident.location}</p>
                  
                  <p><strong>Current Status:</strong></p>
                  <p><span class="status">${newStatus.replace('_', ' ')}</span></p>
                  
                  <p>Our investigation team is actively working on this case. You will be notified of any significant developments.</p>
                </div>

                <p>Thank you for helping us keep the community safe.</p>
                <p style="font-size: 12px; color: #999;">Crime Watch - Community Safety Platform</p>
              </div>
            </body>
          </html>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Status update email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('Error sending status update email:', error);
      return false;
    }
  },

  // Test email configuration
  testConnection: async (): Promise<boolean> => {
    try {
      await transporter.verify();
      console.log('✅ Email configuration is valid');
      return true;
    } catch (error) {
      console.error('❌ Email configuration error:', error);
      return false;
    }
  },
};
