import { env } from '../../config/env';
import { renderEmail, sendMail } from '../../lib/mailer';

export function sendVerificationEmail(to: string, name: string, token: string) {
  const url = `${env.WEB_URL}/verify-email?token=${encodeURIComponent(token)}`;
  return sendMail({
    to,
    subject: `Verify your email for ${env.APP_NAME}`,
    ...renderEmail({
      heading: 'Confirm your email address',
      body: [`Hi ${name},`, 'Thanks for signing up! Please confirm your email address to activate your account.', 'This link expires in 24 hours.'],
      action: { label: 'Verify email', url },
    }),
  });
}

export function sendPasswordResetEmail(to: string, name: string, token: string) {
  const url = `${env.WEB_URL}/reset-password?token=${encodeURIComponent(token)}`;
  return sendMail({
    to,
    subject: `Reset your ${env.APP_NAME} password`,
    ...renderEmail({
      heading: 'Reset your password',
      body: [
        `Hi ${name},`,
        'We received a request to reset your password. This link expires in 1 hour.',
        "If you didn't request this, you can safely ignore this email.",
      ],
      action: { label: 'Reset password', url },
    }),
  });
}

export function sendPasswordChangedEmail(to: string, name: string) {
  return sendMail({
    to,
    subject: `Your ${env.APP_NAME} password was changed`,
    ...renderEmail({
      heading: 'Your password was changed',
      body: [
        `Hi ${name},`,
        'The password for your account was just changed and all other sessions were signed out.',
        'If this wasn\'t you, reset your password immediately and contact support.',
      ],
    }),
  });
}

export function sendEmailChangeConfirmation(to: string, name: string, token: string) {
  const url = `${env.WEB_URL}/confirm-email?token=${encodeURIComponent(token)}`;
  return sendMail({
    to,
    subject: `Confirm your new email for ${env.APP_NAME}`,
    ...renderEmail({
      heading: 'Confirm your new email address',
      body: [
        `Hi ${name},`,
        `You asked to use this address for your ${env.APP_NAME} account. Confirm it to finish the change.`,
        'This link expires in 1 hour. If you didn\'t request this, you can ignore this email.',
      ],
      action: { label: 'Confirm email', url },
    }),
  });
}

export function sendEmailChangeNotice(to: string, name: string, newEmail: string) {
  return sendMail({
    to,
    subject: `Your ${env.APP_NAME} email is being changed`,
    ...renderEmail({
      heading: 'Email change requested',
      body: [
        `Hi ${name},`,
        `Someone (hopefully you) asked to change the email for your account to ${newEmail}.`,
        'The change only happens once the new address is confirmed. If this wasn\'t you, change your password right away.',
      ],
    }),
  });
}

export function sendAccountSuspendedEmail(to: string, name: string, reason?: string | null) {
  return sendMail({
    to,
    subject: `Your ${env.APP_NAME} account was suspended`,
    ...renderEmail({
      heading: 'Your account was suspended',
      body: [
        `Hi ${name},`,
        'An administrator suspended your account and signed you out of all devices.',
        ...(reason ? [`Reason: ${reason}`] : []),
        'Reply to this email if you think this is a mistake.',
      ],
    }),
  });
}
