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

/**
 * Shared branded wrapper used by every email in the app so a new template is
 * just "write the middle section" — colors/spacing/footer stay consistent.
 */
function layout(bodyHtml: string): string {
  return `<div style="font-family:'Segoe UI',Arial,sans-serif;background:#0A0A0A;padding:32px 16px;">
    <div style="max-width:520px;margin:0 auto;">
      <p style="font-family:Arial,sans-serif;letter-spacing:2px;color:#FD4802;font-weight:700;font-size:13px;margin:0 0 24px;">
        TRIFORGE COMMUNITY
      </p>
      <div style="background:#12121A;border:1px solid rgba(245,245,245,0.08);border-radius:16px;padding:32px;color:#F5F5F5;">
        ${bodyHtml}
      </div>
      <p style="color:rgba(245,245,245,0.35);font-size:12px;margin:20px 4px 0;">
        TriForge Media &middot; hub.triforgemedia.com
      </p>
    </div>
  </div>`;
}

function button(url: string, label: string): string {
  return `<p style="margin:24px 0;"><a href="${url}" style="background:#FD4802;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;">${label}</a></p>`;
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

export async function sendWelcomeEmail(to: string, name: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  await send(
    to,
    "You're all set up — welcome to TriForge Community",
    layout(`
      <h1 style="color:#FD4802;font-size:24px;margin:0 0 12px;">You're in, ${name}! 🎉</h1>
      <p style="line-height:1.6;">Your profile is set up and TikTask is generating your first daily tasks now.</p>
      <p style="line-height:1.6;">Jump into the community, say hi in chat, and start building your streak.</p>
      ${button(`${appUrl}/home`, "Go to your dashboard")}
    `)
  );
}

export async function sendPasswordResetEmail(to: string, name: string, url: string) {
  await send(
    to,
    "Reset your TriForge Community password",
    layout(`
      <h1 style="color:#FD4802;font-size:22px;margin:0 0 12px;">Password reset</h1>
      <p style="line-height:1.6;">Hi ${name}, we got a request to reset your password. This link expires in 1 hour.</p>
      ${button(url, "Reset password")}
      <p style="color:rgba(245,245,245,0.5);font-size:12px;line-height:1.6;">
        If you didn't request this, you can safely ignore this email &mdash; your password won't change.
      </p>
      <p style="color:rgba(245,245,245,0.5);font-size:12px;">If the button doesn't work: ${url}</p>
    `)
  );
}

export async function sendStreakReminderEmail(to: string, name: string, streakCount: number) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  await send(
    to,
    `Don't lose your ${streakCount}-day streak 🔥`,
    layout(`
      <h1 style="color:#FD4802;font-size:22px;margin:0 0 12px;">Your streak is on the line, ${name}</h1>
      <p style="line-height:1.6;">You're on a <strong style="color:#00D4FF;">${streakCount}-day streak</strong> and haven't completed today's TikTask yet.</p>
      <p style="line-height:1.6;">A couple minutes now keeps it alive.</p>
      ${button(`${appUrl}/apps/tiktask`, "Complete today's tasks")}
    `)
  );
}

export async function sendBadgeEarnedEmail(
  to: string,
  name: string,
  badgeName: string,
  badgeIcon?: string | null
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  await send(
    to,
    `You earned a badge: ${badgeName}`,
    layout(`
      <div style="text-align:center;font-size:40px;margin-bottom:8px;">${badgeIcon || "🏆"}</div>
      <h1 style="color:#FD4802;font-size:22px;margin:0 0 12px;text-align:center;">New badge unlocked, ${name}!</h1>
      <p style="line-height:1.6;text-align:center;">You just earned <strong style="color:#00D4FF;">${badgeName}</strong>.</p>
      <div style="text-align:center;">${button(`${appUrl}/account`, "View your badges")}</div>
    `)
  );
}

export async function sendCertificateEmail(
  to: string,
  name: string,
  courseTitle: string,
  courseId: string
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  await send(
    to,
    `Certificate earned: ${courseTitle}`,
    layout(`
      <h1 style="color:#FD4802;font-size:22px;margin:0 0 12px;">Congrats, ${name}! 🎓</h1>
      <p style="line-height:1.6;">You completed <strong style="color:#00D4FF;">${courseTitle}</strong> and earned a certificate.</p>
      ${button(`${appUrl}/learn/${courseId}`, "View your certificate")}
    `)
  );
}

export async function sendNewApplicationAdminAlert(
  adminEmails: string[],
  applicantName: string,
  applicantEmail: string,
  platform: string
) {
  if (adminEmails.length === 0) return;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  await Promise.all(
    adminEmails.map((to) =>
      send(
        to,
        `New application: ${applicantName}`,
        layout(`
          <h1 style="color:#FD4802;font-size:20px;margin:0 0 12px;">New membership application</h1>
          <p style="line-height:1.6;margin:4px 0;"><strong>Name:</strong> ${applicantName}</p>
          <p style="line-height:1.6;margin:4px 0;"><strong>Email:</strong> ${applicantEmail}</p>
          <p style="line-height:1.6;margin:4px 0;"><strong>Platform:</strong> ${platform}</p>
          ${button(`${appUrl}/admin/applications`, "Review applications")}
        `)
      )
    )
  );
}

export async function sendCreatorNetworkInfoEmail(to: string, name: string) {
  await send(
    to,
    "Your application + how to join the Creator Network",
    layout(`
      <h1 style="color:#FD4802;font-size:22px;margin:0 0 12px;">Thanks for applying, ${name}!</h1>
      <p style="line-height:1.6;">We've got your application and our team will review it soon.</p>
      <p style="line-height:1.6;">In the meantime &mdash; since you're not currently represented by an agency, you're
        eligible to work toward joining the <strong style="color:#00D4FF;">TriForge Creator Network (CN)</strong>,
        our official roster of managed talent. Once you're approved and in, keep an eye out for the
        <strong>&ldquo;Joining the Creator Network&rdquo;</strong> course in the Learning Center &mdash; it walks
        through exactly what we look for and how to apply.</p>
    `)
  );
}

export async function sendBroadcastEmail(to: string, subject: string, bodyHtml: string) {
  await send(to, subject, layout(bodyHtml));
}
