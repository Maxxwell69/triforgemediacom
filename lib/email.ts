import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL || "TriForge <noreply@triforgemedia.com>";
const resend = apiKey ? new Resend(apiKey) : null;

/**
 * Every value below that ultimately comes from user input (names, notes,
 * social links, etc.) MUST be passed through this before being interpolated
 * into an HTML email template — otherwise a member could set their display
 * name to a `<script>`/`<img onerror>` payload and have it execute in an
 * admin's or another member's mail client.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Escapes a URL for safe use inside an href="..." attribute AND rejects
 * anything that isn't a plain http(s) link (blocks `javascript:`, `data:`,
 * and attribute-breakout payloads like `" onclick="...`).
 */
function safeHref(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return escapeHtml(parsed.toString());
  } catch {
    return null;
  }
}

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
  return `<p style="margin:24px 0;"><a href="${safeHref(url) || "#"}" style="background:#FD4802;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;">${escapeHtml(label)}</a></p>`;
}

export async function sendInviteEmail(to: string, name: string, url: string) {
  const safeName = escapeHtml(name);
  await send(
    to,
    "You're in — set up your TriForge Community account",
    `<div style="font-family:sans-serif;background:#0A0A0A;color:#F5F5F5;padding:32px;">
      <h1 style="color:#FD4802;">Welcome to TriForge Community, ${safeName}!</h1>
      <p>Your application has been approved. Click below to set your password and get in.</p>
      <p><a href="${safeHref(url) || "#"}" style="background:#FD4802;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Set up your account</a></p>
      <p style="color:#999;font-size:12px;">If the button doesn't work, copy this link: ${escapeHtml(url)}</p>
    </div>`
  );
}

export async function sendRejectionEmail(to: string, name: string, notes?: string | null) {
  const safeName = escapeHtml(name);
  await send(
    to,
    "Update on your TriForge Community application",
    `<div style="font-family:sans-serif;background:#0A0A0A;color:#F5F5F5;padding:32px;">
      <h1 style="color:#0E1A3D;background:#00D4FF;display:inline-block;padding:4px 12px;border-radius:4px;">TriForge Community</h1>
      <p>Hi ${safeName}, thanks for applying to TriForge Community.</p>
      <p>We're not able to offer you access at this time.${notes ? ` Note from our team: "${escapeHtml(notes)}"` : ""}</p>
      <p>You're welcome to reapply in the future as things change.</p>
    </div>`
  );
}

export async function sendWelcomeEmail(to: string, name: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const safeName = escapeHtml(name);
  await send(
    to,
    "You're all set up — welcome to TriForge Community",
    layout(`
      <h1 style="color:#FD4802;font-size:24px;margin:0 0 12px;">You're in, ${safeName}! 🎉</h1>
      <p style="line-height:1.6;">Your profile is set up and TikTask is generating your first daily tasks now.</p>
      <p style="line-height:1.6;">Jump into the community, say hi in chat, and start building your streak.</p>
      ${button(`${appUrl}/home`, "Go to your dashboard")}
    `)
  );
}

export async function sendPasswordResetEmail(to: string, name: string, url: string) {
  const safeName = escapeHtml(name);
  await send(
    to,
    "Reset your TriForge Community password",
    layout(`
      <h1 style="color:#FD4802;font-size:22px;margin:0 0 12px;">Password reset</h1>
      <p style="line-height:1.6;">Hi ${safeName}, we got a request to reset your password. This link expires in 1 hour.</p>
      ${button(url, "Reset password")}
      <p style="color:rgba(245,245,245,0.5);font-size:12px;line-height:1.6;">
        If you didn't request this, you can safely ignore this email &mdash; your password won't change.
      </p>
      <p style="color:rgba(245,245,245,0.5);font-size:12px;">If the button doesn't work: ${escapeHtml(url)}</p>
    `)
  );
}

export async function sendStreakReminderEmail(to: string, name: string, streakCount: number) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const safeName = escapeHtml(name);
  await send(
    to,
    `Don't lose your ${streakCount}-day streak 🔥`,
    layout(`
      <h1 style="color:#FD4802;font-size:22px;margin:0 0 12px;">Your streak is on the line, ${safeName}</h1>
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
  const safeName = escapeHtml(name);
  const safeBadgeName = escapeHtml(badgeName);
  const safeIcon = badgeIcon ? escapeHtml(badgeIcon) : "🏆";
  await send(
    to,
    `You earned a badge: ${badgeName}`,
    layout(`
      <div style="text-align:center;font-size:40px;margin-bottom:8px;">${safeIcon}</div>
      <h1 style="color:#FD4802;font-size:22px;margin:0 0 12px;text-align:center;">New badge unlocked, ${safeName}!</h1>
      <p style="line-height:1.6;text-align:center;">You just earned <strong style="color:#00D4FF;">${safeBadgeName}</strong>.</p>
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
  const safeName = escapeHtml(name);
  const safeCourseTitle = escapeHtml(courseTitle);
  await send(
    to,
    `Certificate earned: ${courseTitle}`,
    layout(`
      <h1 style="color:#FD4802;font-size:22px;margin:0 0 12px;">Congrats, ${safeName}! 🎓</h1>
      <p style="line-height:1.6;">You completed <strong style="color:#00D4FF;">${safeCourseTitle}</strong> and earned a certificate.</p>
      ${button(`${appUrl}/learn/${courseId}`, "View your certificate")}
    `)
  );
}

export type NewApplicationAlertData = {
  name: string;
  email: string;
  platform: string;
  handle: string;
  phone: string;
  smsConsent: boolean;
  socialLink: string | null;
  goals: string;
  whyJoin: string;
  track: "MN" | "CN";
};

function row(label: string, value: string): string {
  return `<p style="line-height:1.5;margin:0 0 10px;"><strong style="color:rgba(245,245,245,0.5);display:block;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;">${label}</strong>${value}</p>`;
}

export async function sendNewApplicationAdminAlert(
  adminEmails: string[],
  application: NewApplicationAlertData
) {
  if (adminEmails.length === 0) return;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const trackBadge =
    application.track === "MN"
      ? `<span style="background:rgba(0,212,255,0.15);color:#00D4FF;border-radius:4px;padding:2px 10px;font-size:12px;font-weight:700;letter-spacing:0.5px;">MN &middot; has agency</span>`
      : `<span style="background:rgba(253,72,2,0.15);color:#FD4802;border-radius:4px;padding:2px 10px;font-size:12px;font-weight:700;letter-spacing:0.5px;">CN track &middot; no agency</span>`;

  await Promise.all(
    adminEmails.map((to) =>
      send(
        to,
        `New application (${application.track}): ${application.name}`,
        layout(`
          <h1 style="color:#FD4802;font-size:20px;margin:0 0 8px;">New membership application</h1>
          <div style="margin:0 0 20px;">${trackBadge}</div>
          ${row("Name", escapeHtml(application.name))}
          ${row("Email", escapeHtml(application.email))}
          ${row("Phone", escapeHtml(application.phone))}
          ${row(
            "SMS consent",
            application.smsConsent
              ? `<span style="color:#00D4FF;">Yes &mdash; opted in to texts</span>`
              : `<span style="color:rgba(245,245,245,0.5);">Not given</span>`
          )}
          ${row("Main platform", escapeHtml(application.platform))}
          ${row("Handle / username", escapeHtml(application.handle))}
          ${row(
            "Social link",
            application.socialLink
              ? safeHref(application.socialLink)
                ? `<a href="${safeHref(application.socialLink)}" style="color:#00D4FF;">${escapeHtml(application.socialLink)}</a>`
                : escapeHtml(application.socialLink)
              : "&mdash;"
          )}
          ${row("Goals", escapeHtml(application.goals).replace(/\n/g, "<br/>"))}
          ${row("Why they want in", escapeHtml(application.whyJoin).replace(/\n/g, "<br/>"))}
          ${button(`${appUrl}/admin/applications`, "Review applications")}
        `)
      )
    )
  );
}

export async function sendCreatorNetworkInfoEmail(to: string, name: string) {
  const safeName = escapeHtml(name);
  await send(
    to,
    "Your application + how to join the Creator Network",
    layout(`
      <h1 style="color:#FD4802;font-size:22px;margin:0 0 12px;">Thanks for applying, ${safeName}!</h1>
      <p style="line-height:1.6;">We've got your application and our team will review it soon.</p>
      <p style="line-height:1.6;">In the meantime &mdash; since you're not currently represented by an agency, you're
        eligible to work toward joining the <strong style="color:#00D4FF;">TriForge Creator Network (CN)</strong>,
        our official roster of managed talent. Once you're approved and in, keep an eye out for the
        <strong>&ldquo;Joining the Creator Network&rdquo;</strong> course in the Learning Center &mdash; it walks
        through exactly what we look for and how to apply.</p>
    `)
  );
}

export async function sendEmailChangedNotice(oldEmail: string, newEmail: string, name: string) {
  const safeName = escapeHtml(name);
  const safeOldEmail = escapeHtml(oldEmail);
  const safeNewEmail = escapeHtml(newEmail);
  await send(
    oldEmail,
    "Your TriForge Community login email was changed",
    layout(`
      <h1 style="color:#FD4802;font-size:22px;margin:0 0 12px;">Login email changed</h1>
      <p style="line-height:1.6;">Hi ${safeName}, the login email on your TriForge Community account was just changed
        from <strong>${safeOldEmail}</strong> to <strong style="color:#00D4FF;">${safeNewEmail}</strong>.</p>
      <p style="line-height:1.6;color:rgba(245,245,245,0.6);font-size:13px;">
        If you made this change, no action is needed. If you didn't, contact an admin right away.
      </p>
    `)
  );
}

export async function sendBroadcastEmail(to: string, subject: string, bodyHtml: string) {
  await send(to, subject, layout(bodyHtml));
}
