import { Resend } from 'resend';

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';

interface EmailInput {
  to: string;
  subject: string;
  heading: string;
  body: string;
  cta?: { label: string; url: string };
}

function renderEmail({ heading, body, cta }: EmailInput): string {
  const button = cta
    ? `<p style="margin:28px 0"><a href="${cta.url}" style="background:#0ea5e9;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600">${cta.label}</a></p>
       <p style="color:#6b7280;font-size:13px">Or paste this link into your browser:<br><span style="word-break:break-all">${cta.url}</span></p>`
    : '';
  return `<!doctype html><html><body style="margin:0;background:#f3f4f6;font-family:-apple-system,Segoe UI,Roboto,sans-serif">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:12px;padding:32px">
    <div style="font-size:20px;font-weight:700;color:#0369a1;margin-bottom:24px">LocalVibe</div>
    <h1 style="font-size:20px;color:#111827;margin:0 0 12px">${heading}</h1>
    <div style="color:#374151;font-size:15px;line-height:1.6">${body}</div>
    ${button}
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0">
    <p style="color:#9ca3af;font-size:12px">You received this email because you have a LocalVibe account. <a href="${appUrl()}/settings" style="color:#9ca3af">Manage email preferences</a></p>
  </div></body></html>`;
}

/** Sends a transactional email. Returns false (and logs) when email is not configured or fails. */
export async function sendEmail(input: EmailInput): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.info(`[email] RESEND_API_KEY not set. Would send "${input.subject}" to ${input.to}`, input.cta?.url ?? '');
    return false;
  }
  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'LocalVibe <onboarding@resend.dev>',
      to: input.to,
      subject: input.subject,
      html: renderEmail(input),
    });
    if (error) {
      console.error('[email] Resend error:', error);
      if (process.env.NODE_ENV !== 'production' && input.cta) console.info('[email] Link:', input.cta.url);
      return false;
    }
    return true;
  } catch (error) {
    console.error('[email] Failed to send:', error);
    return false;
  }
}

export { appUrl };
