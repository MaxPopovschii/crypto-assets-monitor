import nodemailer, { Transporter } from 'nodemailer';
import { EmailConfig } from './config';
import { logger } from './logger';

export class EmailProvider {
  private transporter: Transporter;
  private fromAddress: string;

  constructor(config: EmailConfig) {
    this.fromAddress = config.from;
    
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.password
      }
    });

    // Verify connection
    this.transporter.verify((error) => {
      if (error) {
        logger.error({ error }, 'Email provider connection failed');
      } else {
        logger.info('Email provider ready to send messages');
      }
    });
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject,
        html
      });

      logger.info({ messageId: info.messageId, to }, 'Email sent successfully');
    } catch (error) {
      logger.error({ error, to, subject }, 'Failed to send email');
      throw error;
    }
  }

  async sendAlertNotification(
    email: string,
    symbol: string,
    condition: string,
    targetValue: number,
    currentPrice: number
  ): Promise<void> {
    const subject = `🚨 Alert Triggered: ${symbol}`;
    
    const html = `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Price Alert Triggered!</h1>
          </div>
          
          <div style="background: #f7fafc; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #2d3748;">
              Your alert for <strong>${symbol}</strong> has been triggered.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #718096;">Condition:</td>
                  <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${condition}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #718096;">Target Value:</td>
                  <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">$${targetValue.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; color: #718096;">Current Price:</td>
                  <td style="padding: 10px; font-weight: bold; color: #48bb78; font-size: 18px;">$${currentPrice.toLocaleString()}</td>
                </tr>
              </table>
            </div>
            
            <p style="font-size: 14px; color: #718096; margin-top: 20px;">
              This is an automated notification from Crypto Assets Monitor.
            </p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail(email, subject, html);
  }
}
