import 'server-only';

import { Resend } from 'resend';
import { z } from 'zod';
import { consumeEmailBudget } from './limits';

const emailAddressSchema = z.string().email().max(320);
const otpSchema = z.string().regex(/^\d{6}$/);

type EmailContent = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type KycStatusEmail = {
  to: string;
  recipientName: string;
  status: 'approved' | 'rejected';
  reason?: string;
};

export type TrialExpiryEmail = {
  to: string;
  recipientName: string;
  trialDay: 60 | 75 | 85;
};

export type ShopEnquiryEmail = {
  to: string;
  supplierName: string;
  shopName: string;
  medicine: string;
  quantity: string;
  message?: string;
};

let resendClient: Resend | undefined;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getEmailSender(): string {
  const sender = process.env.EMAIL_FROM;
  if (!sender) throw new Error('EMAIL_FROM must be configured.');
  return sender;
}

function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY must be configured.');
  resendClient ??= new Resend(apiKey);
  return resendClient;
}

function emailLayout(title: string, content: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;background:#f4f7fa;color:#16324a;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(title)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fa;padding:32px 12px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #dce5ed;border-radius:16px;overflow:hidden;">
          <tr><td style="height:6px;background:#16a34a;font-size:0;">&nbsp;</td></tr>
          <tr><td style="padding:32px 28px;">
            <p style="margin:0 0 24px;color:#0b3b60;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">The Connect Pharma</p>
            <h1 style="margin:0 0 16px;color:#0b3b60;font-size:24px;line-height:1.3;">${escapeHtml(title)}</h1>
            ${content}
            <p style="margin:28px 0 0;color:#64748b;font-size:12px;line-height:1.6;">This is a transactional message from The Connect Pharma. If you did not expect it, you can ignore this email.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

async function sendEmail(content: EmailContent): Promise<void> {
  const to = emailAddressSchema.parse(content.to);
  const from = getEmailSender();
  const client = getResend();
  await consumeEmailBudget();
  const { error } = await client.emails.send({
    from,
    to,
    subject: content.subject,
    html: content.html,
    text: content.text
  });

  if (error) throw new Error(`Resend email delivery failed: ${error.message}`);
}

export async function sendOtpEmail(input: {
  to: string;
  code: string;
  expiresInMinutes?: number;
}): Promise<void> {
  const code = otpSchema.parse(input.code);
  const expiresInMinutes = input.expiresInMinutes ?? 10;
  if (!Number.isInteger(expiresInMinutes) || expiresInMinutes < 1 || expiresInMinutes > 30) {
    throw new Error('OTP expiry must be between 1 and 30 minutes.');
  }

  const title = 'Your sign-in code';
  const html = emailLayout(
    title,
    `<p style="margin:0 0 20px;font-size:15px;line-height:1.6;">Enter this one-time code to sign in:</p>
     <p style="margin:0;padding:16px;background:#f1f5f9;border:1px solid #dce5ed;border-radius:12px;color:#0b3b60;font-family:'JetBrains Mono','SFMono-Regular',Consolas,monospace;font-size:30px;font-weight:700;letter-spacing:8px;text-align:center;">${code}</p>
     <p style="margin:18px 0 0;color:#475569;font-size:14px;line-height:1.6;">This code expires in ${expiresInMinutes} minutes. Do not share it with anyone.</p>`
  );
  await sendEmail({
    to: input.to,
    subject: 'Your Connect Pharma sign-in code',
    html,
    text: `Your Connect Pharma sign-in code is ${code}. It expires in ${expiresInMinutes} minutes. Do not share it with anyone.`
  });
}

export async function sendKycStatusEmail(input: KycStatusEmail): Promise<void> {
  const recipientName = escapeHtml(input.recipientName);
  const approved = input.status === 'approved';
  const title = approved ? 'Your account has been verified' : 'Your verification needs attention';
  const detail = approved
    ? 'Your Drug Licence has been verified. You can now sign in and use your approved account.'
    : `Your Drug Licence could not be approved.${input.reason ? ` Reason: ${escapeHtml(input.reason)}` : ''} Please review your documents and contact support if you need help.`;
  await sendEmail({
    to: input.to,
    subject: `Connect Pharma account ${approved ? 'approved' : 'verification update'}`,
    html: emailLayout(
      title,
      `<p style="margin:0;font-size:15px;line-height:1.7;">Hello ${recipientName}, ${detail}</p>`
    ),
    text: `Hello ${input.recipientName}, ${approved
      ? 'Your Drug Licence has been verified. You can now sign in and use your approved account.'
      : `Your Drug Licence could not be approved.${input.reason ? ` Reason: ${input.reason}` : ''} Please review your documents and contact support if you need help.`}`
  });
}

export async function sendTrialExpiryEmail(input: TrialExpiryEmail): Promise<void> {
  const daysUntilExpiry = 90 - input.trialDay;
  const recipientName = escapeHtml(input.recipientName);
  const title = `Your free trial expires in ${daysUntilExpiry} days`;
  await sendEmail({
    to: input.to,
    subject: `Connect Pharma free trial: ${daysUntilExpiry} days remaining`,
    html: emailLayout(
      title,
      `<p style="margin:0;font-size:15px;line-height:1.7;">Hello ${recipientName}, your 3-month free trial is approaching its end. Review your subscription options before it expires in ${daysUntilExpiry} days.</p>`
    ),
    text: `Hello ${input.recipientName}, your 3-month free trial expires in ${daysUntilExpiry} days. Review your subscription options before it expires.`
  });
}

export async function sendShopEnquiryEmail(input: ShopEnquiryEmail): Promise<void> {
  const supplierName = escapeHtml(input.supplierName);
  const shopName = escapeHtml(input.shopName);
  const medicine = escapeHtml(input.medicine);
  const quantity = escapeHtml(input.quantity);
  const message = input.message ? escapeHtml(input.message) : '';
  await sendEmail({
    to: input.to,
    subject: 'New medical shop enquiry on Connect Pharma',
    html: emailLayout(
      'You have a new enquiry',
      `<p style="margin:0;font-size:15px;line-height:1.7;">Hello ${supplierName}, <strong>${shopName}</strong> requested a quote for <strong>${medicine}</strong> (quantity: ${quantity}).</p>
       ${message ? `<p style="margin:16px 0 0;padding:14px;background:#f1f5f9;border-radius:10px;font-size:14px;line-height:1.6;">${message}</p>` : ''}
       <p style="margin:20px 0 0;color:#475569;font-size:14px;">Sign in to Connect Pharma to review the enquiry.</p>`
    ),
    text: `Hello ${input.supplierName}, ${input.shopName} requested a quote for ${input.medicine} (quantity: ${input.quantity}).${input.message ? ` Message: ${input.message}` : ''} Sign in to Connect Pharma to review the enquiry.`
  });
}
