import { EmailVerificationToken } from '@prisma/client';
import nodemailer, { SendMailOptions, SentMessageInfo } from 'nodemailer';

// do some checks for environment variables and functionality of the transporter on initial loading of this module

// Check for mandatory env variables
if (!process.env.SMTP_HOST) throw new Error('SMTP_HOST is not set');
if (!process.env.SMTP_FROM_NAME) throw new Error('SMTP_FROM_NAME is not set');
if (!process.env.SMTP_FROM_ADDRESS) throw new Error('SMTP_FROM_ADDRESS is not set');
if (!process.env.SERVER_FQDN) throw new Error('SERVER_FQDN is not set');

// Check for SMTP Port and parse it to a number
const SMTP_PORT: number = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 25;

// Check for SMTP_USE_SSL and parse it to a boolean
const SMTP_USE_SSL: boolean = process.env.SMTP_USE_SSL
  ? process.env.SMTP_USE_SSL.toLowerCase() === 'true'
  : false;

// Check for SMTP authentication parameters
const auth =
  process.env.SMTP_USERNAME && process.env.SMTP_PASSWORD
    ? {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
      }
    : undefined;

// compose transporter object
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_USE_SSL,
  auth,
});

// verify the transporter
transporter.verify((error) => {
  if (error) {
    throw new Error('SMTP transporter verification failed:', error);
  }
});

/**
 * Send a generic email with the given options. But set the from address and name explicitly to the configured values.
 *
 * @param {SendMailOptions} options - The options for the email to send.
 * @returns {Promise<SentMessageInfo>} - The result of the email sending operation.
 */
export const sendGenericMail = async (options: SendMailOptions): Promise<SentMessageInfo> => {
  // always set the from address and name explicitly
  return transporter.sendMail({
    from: `\"${process.env.SMTP_FROM_NAME}\" <${process.env.SMTP_FROM_ADDRESS}>`,
    ...options,
  });
};

/**
 * Sends an email with a verification link to the given email address.
 *
 * @param {string} email - email address to send the verification mail to
 * @param {EmailVerificationToken} tokenObject - token object to include in the mail
 * @returns {Promise<SentMessageInfo>} - The result of the email sending operation.
 */
export const sendTokenVerificationMail = async (
  email: string,
  tokenObject: EmailVerificationToken,
): Promise<SentMessageInfo> => {
  const link = `https://${process.env.SERVER_FQDN}/auth/verify?token=${tokenObject.token}`;
  return sendGenericMail({
    to: email,
    subject: 'Verifikation des SECInsiderMonitor-Kontos',
    html: `<h2>Verifiziere dein SECInsiderMonitor-Konto</h2>
    <p>Um dein Konto zu verifizieren, klicke bitte auf den folgenden Link:</p>
    <p><a href="${link}">${link}</a></p>   
    <p>(Der Link ist bis ${new Date(tokenObject.expires).toLocaleString('de-CH')} gültig.)</p>`,
  });
};

/**
 * Sends an email with a password reset link to the given email address.
 *
 * @param {string} email - email address to send the password reset mail to
 * @param {EmailVerificationToken} tokenObject - token object to include in the mail
 * @returns {Promise<SentMessageInfo>} - The result of the email sending operation.
 */
export const sendPasswordResetMail = async (
  email: string,
  tokenObject: EmailVerificationToken,
): Promise<SentMessageInfo> => {
  const link = `https://${process.env.SERVER_FQDN}/auth/reset-password?token=${tokenObject.token}`;
  return sendGenericMail({
    to: email,
    subject: 'Passwort-Reset für SECInsiderMonitor-Konto',
    html: `<h2>Passwort-Reset für dein SECInsiderMonitor-Konto</h2>
    <p>Für dein Konto wurde ein Passwort-Reset angefragt. Klicke auf den folgenden Link um das Passwort zurückzusetzen:</p>
    <p><a href="${link}">${link}</a></p>   
    <p>(Der Link ist bis ${new Date(tokenObject.expires).toLocaleString('de-CH')} gültig.)</p>
    <p>Falls du den Passwort-Reset nicht angefragt hast, kannst du diese Nachricht ignorieren.</p>`,
  });
};
