import nodemailer from 'nodemailer';

// SMTP delivery for the satisfaction questionnaire (Story 24). Locally, Docker Compose
// points SMTP_HOST at Mailpit, which captures every email instead of delivering it.
export function createMailer(env = process.env) {
  if (!env.SMTP_HOST) {
    return { async send() { throw new Error('SMTP_HOST is not configured.'); } };
  }
  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT || 1025),
    secure: env.SMTP_SECURE === 'true',
    ...(env.SMTP_USER ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } } : {})
  });
  const from = env.MAIL_FROM || 'Hotel Kong Arthur <no-reply@kongarthur.local>';
  return { send: message => transport.sendMail({ from, ...message }) };
}

export function questionnaireEmail({ to, firstName, link }) {
  const greeting = firstName ? `Dear ${firstName},` : 'Dear guest,';
  return {
    to,
    subject: 'How was your stay at Hotel Kong Arthur?',
    text: `${greeting}\n\nThank you for staying with us. We would be grateful if you rated your room(s) from 1 to 5. It takes less than a minute:\n\n${link}\n\nKind regards,\nHotel Kong Arthur`,
    html: `<p>${escapeHtml(greeting)}</p><p>Thank you for staying with us. We would be grateful if you rated your room(s) from 1 to 5. It takes less than a minute.</p><p><a href="${escapeHtml(link)}">Rate your stay</a></p><p>Kind regards,<br>Hotel Kong Arthur</p>`
  };
}

const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
