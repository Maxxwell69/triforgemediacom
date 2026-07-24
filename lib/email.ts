import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL || "TriForge <noreply@triforgemedia.com>";
const resend = apiKey ? new Resend(apiKey) : null;

async function send(to: string, subject: string, html: string) {
  if (!resend) {
    // Dev-friendly stub: no RESEND_API_KEY configured yet, so just log it.
    console.log(`[email:stub] To: ${to}\nSubject: ${subject}\n\n${html}\n`);
    return;
  }

  await resend.emails.send({ from: fromEmail, to, subject, html });
}

export async function sendInviteEmail(to: string, name: string, url: string) {
  await send(
    to,
    "You're in — set up your TriForge Community account",
    `<div style="font-family:sans-serif;background:#0A0A0A;color:#F5F5F5;padding:32px;">
      <h1 style="color:#FD4802;">Welcome to TriForge Community, ${name}!</h1>
      <p>Your application has been approved. Click below to set your password and get in.</p>
      <p><a href="${url}" style="background:#FD4802;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Set up your account</a></p>
      <p style="color:#999;font-size:12px;">If the button doesn't work, copy this link: ${url}</p>
    </div>`
  );
}

export async function sendRejectionEmail(to: string, name: string, notes?: string | null) {
  await send(
    to,
    "Update on your TriForge Community application",
    `<div style="font-family:sans-serif;background:#0A0A0A;color:#F5F5F5;padding:32px;">
      <h1 style="color:#0E1A3D;background:#00D4FF;display:inline-block;padding:4px 12px;border-radius:4px;">TriForge Community</h1>
      <p>Hi ${name}, thanks for applying to TriForge Community.</p>
      <p>We're not able to offer you access at this time.${notes ? ` Note from our team: "${notes}"` : ""}</p>
      <p>You're welcome to reapply in the future as things change.</p>
    </div>`
  );
}
