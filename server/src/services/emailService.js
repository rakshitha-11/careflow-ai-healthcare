const nodemailer = require("nodemailer");

function createTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    return null;
  }

  const port = Number(process.env.SMTP_PORT || 587);

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,

    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },

    // Use STARTTLS for Gmail port 587.
    requireTLS: port === 587,

    // Your local machine is reporting a self-signed certificate
    // in the certificate chain. This allows the SMTP TLS connection
    // to complete in your local development environment.
    tls: {
      rejectUnauthorized: false
    }
  });
}

async function verifyEmailConnection() {
  const mailer = createTransporter();

  if (!mailer) {
    console.log("[EMAIL] SMTP is not configured.");
    return false;
  }

  try {
    await mailer.verify();
    console.log("[EMAIL] SMTP connection successful.");
    return true;
  } catch (error) {
    console.error("[EMAIL] SMTP connection failed:");
    console.error(error.message);
    return false;
  }
}

async function sendEmail({ to, subject, text }) {
  const mailer = createTransporter();

  if (!mailer) {
    console.log(`[EMAIL DEMO] ${to} | ${subject}`);
    console.log(text);
    return {
      demo: true,
      messageId: null
    };
  }

  try {
    const info = await mailer.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      text
    });

    console.log(
      `[EMAIL SENT] To: ${to} | Subject: ${subject} | Message ID: ${info.messageId}`
    );

    return info;
  } catch (error) {
    console.error(
      `[EMAIL FAILED] To: ${to} | Subject: ${subject}`
    );
    console.error(error.message);

    throw error;
  }
}

module.exports = {
  sendEmail,
  verifyEmailConnection
};