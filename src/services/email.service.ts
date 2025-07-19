// src/services/emailService.ts
import nodemailer from 'nodemailer';
// import sgMail from '@sendgrid/mail'; // For SendGrid
// import { ServerClient } from 'postmark'; // For Postmark

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Nodemailer setup
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// SendGrid setup (if you choose SendGrid)
// if (process.env.SENDGRID_API_KEY) {
//   sgMail.setApiKey(process.env.SENDGRID_API_KEY);
// }

// Postmark setup (if you choose Postmark)
// const postmarkClient = process.env.POSTMARK_API_TOKEN
//   ? new ServerClient(process.env.POSTMARK_API_TOKEN)
//   : null;


export const sendEmail = async (options: EmailOptions): Promise<void> => {
  const senderEmail = process.env.SENDER_EMAIL;

  if (!senderEmail) {
    console.error('SENDER_EMAIL environment variable is not set. Cannot send email.');
    return;
  }

  // Choose your email service based on env var
  switch (process.env.EMAIL_SERVICE_PROVIDER) {
    case 'nodemailer':
      try {
        await transporter.sendMail({
          from: senderEmail,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text || options.html.replace(/<[^>]*>?/gm, ''), // Basic text fallback
        });
        console.log(`Email sent to ${options.to}`);
      } catch (error) {
        console.error('Error sending email with Nodemailer:', error);
        throw new Error('Failed to send email.');
      }
      break;

    // case 'sendgrid':
    //   if (!sgMail) {
    //     console.error('SendGrid API key not configured.');
    //     throw new Error('Email service not configured.');
    //   }
    //   try {
    //     await sgMail.send({
    //       to: options.to,
    //       from: senderEmail,
    //       subject: options.subject,
    //       html: options.html,
    //       text: options.text || options.html.replace(/<[^>]*>?/gm, ''),
    //     });
    //     console.log(`Email sent to ${options.to} via SendGrid`);
    //   } catch (error) {
    //     console.error('Error sending email with SendGrid:', error.response?.body || error);
    //     throw new Error('Failed to send email.');
    //   }
    //   break;

    // case 'postmark':
    //   if (!postmarkClient) {
    //     console.error('Postmark API token not configured.');
    //     throw new Error('Email service not configured.');
    //   }
    //   try {
    //     await postmarkClient.sendEmail({
    //       From: senderEmail,
    //       To: options.to,
    //       Subject: options.subject,
    //       HtmlBody: options.html,
    //       TextBody: options.text || options.html.replace(/<[^>]*>?/gm, ''),
    //     });
    //     console.log(`Email sent to ${options.to} via Postmark`);
    //   } catch (error) {
    //     console.error('Error sending email with Postmark:', error);
    //     throw new Error('Failed to send email.');
    //   }
    //   break;

    default:
      console.warn('No email service provider configured or unknown provider. Email not sent.');
      // For development, you might log the email content instead of sending
      console.log('--- MOCK EMAIL ---');
      console.log('To:', options.to);
      console.log('Subject:', options.subject);
      console.log('HTML:', options.html);
      console.log('------------------');
      break;
  }
};


export const sendPasswordSetupEmail = async (email: string, name: string, token: string) => {
  const frontendUrl = process.env.FRONTEND_URL;
  if (!frontendUrl) {
    console.error('FRONTEND_URL environment variable is not set.');
    return;
  }
  const setupLink = `${frontendUrl}/set-password?token=${token}`; // Frontend route for password setup

  const subject = 'Set Up Your GymFitness Trainer Account Password';
  const html = `
    <p>Hello ${name},</p>
    <p>Your trainer account for the Gym Admin portal has been created. Please click the link below to set up your password:</p>
    <p><a href="${setupLink}">Set Your Password Now</a></p>
    <p>This link will expire in 1 hour.</p>
    <p>If you did not expect this email, please ignore it.</p>
    <p>Thank you,</p>
    <p>GymFitness Team</p>
  `;

  await sendEmail({ to: email, subject, html });
};