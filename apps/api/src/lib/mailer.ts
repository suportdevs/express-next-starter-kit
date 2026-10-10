import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../config/env';
import { logger } from './logger';

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!env.SMTP_HOST) return null;
  transporter ??= nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
  });
  return transporter;
}

/**
 * Sends an email. Without SMTP configured, the message is logged instead so
 * local development works with zero setup. Failures are logged, never thrown,
 * so a mail outage can't break sign-up or login flows.
 */
export async function sendMail(message: MailMessage): Promise<void> {
  const t = getTransporter();
  if (!t) {
    logger.info({ to: message.to, subject: message.subject, text: message.text }, '📧 Email (SMTP not configured)');
    return;
  }
  try {
    await t.sendMail({ from: env.MAIL_FROM, ...message });
  } catch (err) {
    logger.error({ err, to: message.to, subject: message.subject }, 'Failed to send email');
  }
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Minimal, client-safe transactional email layout with an optional call-to-action. */
export function renderEmail(opts: {
  heading: string;
  body: string[];
  action?: { label: string; url: string };
  footer?: string;
}): { html: string; text: string } {
  const paragraphs = opts.body
    .map((p) => `<p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:24px">${escapeHtml(p)}</p>`)
    .join('');
  const button = opts.action
    ? `<p style="margin:24px 0"><a href="${escapeHtml(opts.action.url)}" style="background:#4f46e5;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;display:inline-block">${escapeHtml(opts.action.label)}</a></p>
       <p style="margin:0 0 16px;color:#64748b;font-size:13px">Or paste this link into your browser:<br><span style="word-break:break-all">${escapeHtml(opts.action.url)}</span></p>`
    : '';
  const footer = escapeHtml(opts.footer ?? `You received this email from ${env.APP_NAME}.`);

  const html = `<!doctype html><html><body style="margin:0;background:#f1f5f9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:12px;padding:32px">
      <tr><td>
        <p style="margin:0 0 24px;font-weight:700;font-size:18px;color:#0f172a">${escapeHtml(env.APP_NAME)}</p>
        <h1 style="margin:0 0 16px;font-size:22px;color:#0f172a">${escapeHtml(opts.heading)}</h1>
        ${paragraphs}${button}
      </td></tr>
    </table>
    <p style="color:#94a3b8;font-size:12px;margin-top:16px">${footer}</p>
  </td></tr></table></body></html>`;

  const text = [opts.heading, '', ...opts.body, ...(opts.action ? ['', `${opts.action.label}: ${opts.action.url}`] : [])].join('\n');
  return { html, text };
}
