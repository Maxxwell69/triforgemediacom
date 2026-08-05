import { Resend } from "resend";
import { resolveEditableEmail } from "@/lib/emailTemplates";
import {
  button,
  escapeHtml,
  layout,
  safeHref,
  SAMPLE_APP_URL,
  type EmailContent,
} from "@/lib/emailLayout";

export type { EmailContent };
export { button, escapeHtml, layout, safeHref, SAMPLE_APP_URL };

const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL || "TriForge <noreply@triforgemedia.com>";
const resend = apiKey ? new Resend(apiKey) : null;

/**
 * Every value below that ultimately comes from user input (names, notes,
 * social links, etc.) MUST be passed through escapeHtml before being interpolated
 * into an HTML email template — otherwise a member could set their display
 * name to a `<script>`/`<img onerror>` payload and have it execute in an
 * admin's or another member's mail client.
 */

async function send(to: string, subject: string, html: string) {
  if (!resend) {
    // Dev-friendly stub: no RESEND_API_KEY configured yet, so just log it.
    console.log(`[email:stub] To: ${to}\nSubject: ${subject}\n\n${html}\n`);
    return;
  }

  await resend.emails.send({ from: fromEmail, to, subject, html });
}

// ---------- Invite ----------

export function buildInviteEmail(name: string, url: string): EmailContent {
  const safeName = escapeHtml(name);
  return {
    subject: "You're in — set up your TriForge Community account",
    html: `<div style="font-family:sans-serif;background:#0A0A0A;color:#F5F5F5;padding:32px;">
      <h1 style="color:#FD4802;">Welcome to TriForge Community, ${safeName}!</h1>
      <p>Your application has been approved. Click below to set your password and get in.</p>
      <p><a href="${safeHref(url) || "#"}" style="background:#FD4802;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Set up your account</a></p>
      <p style="color:#999;font-size:12px;">If the button doesn't work, copy this link: ${escapeHtml(url)}</p>
    </div>`,
  };
}

export async function sendInviteEmail(to: string, name: string, url: string) {
  const { subject, html } = await resolveEditableEmail(
    "invite",
    {
      text: { name, url },
      html: { cta: button(url, "Set up your account") },
    },
    () => buildInviteEmail(name, url)
  );
  await send(to, subject, html);
}

// ---------- Rejection ----------

export function buildRejectionEmail(name: string, notes?: string | null): EmailContent {
  const safeName = escapeHtml(name);
  return {
    subject: "Update on your TriForge Community application",
    html: `<div style="font-family:sans-serif;background:#0A0A0A;color:#F5F5F5;padding:32px;">
      <h1 style="color:#0E1A3D;background:#00D4FF;display:inline-block;padding:4px 12px;border-radius:4px;">TriForge Community</h1>
      <p>Hi ${safeName}, thanks for applying to TriForge Community.</p>
      <p>We're not able to offer you access at this time.${notes ? ` Note from our team: "${escapeHtml(notes)}"` : ""}</p>
      <p>You're welcome to reapply in the future as things change.</p>
    </div>`,
  };
}

export async function sendRejectionEmail(to: string, name: string, notes?: string | null) {
  const notesHtml = notes
    ? ` Note from our team: &quot;${escapeHtml(notes)}&quot;`
    : "";
  const { subject, html } = await resolveEditableEmail(
    "rejection",
    { text: { name }, html: { notes: notesHtml } },
    () => buildRejectionEmail(name, notes)
  );
  await send(to, subject, html);
}

// ---------- Welcome ----------

export function buildWelcomeEmail(name: string): EmailContent {
  const safeName = escapeHtml(name);
  return {
    subject: "You're all set up — welcome to TriForge Community",
    html: layout(`
      <h1 style="color:#FD4802;font-size:24px;margin:0 0 12px;">You're in, ${safeName}! 🎉</h1>
      <p style="line-height:1.6;">Your profile is set up and TikTask is generating your first daily tasks now.</p>
      <p style="line-height:1.6;">Jump into the community, say hi in chat, and start building your streak.</p>
      ${button(`${SAMPLE_APP_URL}/home`, "Go to your dashboard")}
    `),
  };
}

export async function sendWelcomeEmail(to: string, name: string) {
  const { subject, html } = await resolveEditableEmail(
    "welcome",
    {
      text: { name },
      html: { cta: button(`${SAMPLE_APP_URL}/home`, "Go to your dashboard") },
    },
    () => buildWelcomeEmail(name)
  );
  await send(to, subject, html);
}

// ---------- Password reset ----------

export function buildPasswordResetEmail(name: string, url: string): EmailContent {
  const safeName = escapeHtml(name);
  return {
    subject: "Reset your TriForge Community password",
    html: layout(`
      <h1 style="color:#FD4802;font-size:22px;margin:0 0 12px;">Password reset</h1>
      <p style="line-height:1.6;">Hi ${safeName}, we got a request to reset your password. This link expires in 1 hour.</p>
      ${button(url, "Reset password")}
      <p style="color:rgba(245,245,245,0.5);font-size:12px;line-height:1.6;">
        If you didn't request this, you can safely ignore this email &mdash; your password won't change.
      </p>
      <p style="color:rgba(245,245,245,0.5);font-size:12px;">If the button doesn't work: ${escapeHtml(url)}</p>
    `),
  };
}

export async function sendPasswordResetEmail(to: string, name: string, url: string) {
  const { subject, html } = await resolveEditableEmail(
    "password-reset",
    {
      text: { name, url },
      html: { cta: button(url, "Reset password") },
    },
    () => buildPasswordResetEmail(name, url)
  );
  await send(to, subject, html);
}

// ---------- Streak reminder ----------

export function buildStreakReminderEmail(name: string, streakCount: number): EmailContent {
  const safeName = escapeHtml(name);
  return {
    subject: `Don't lose your ${streakCount}-day streak 🔥`,
    html: layout(`
      <h1 style="color:#FD4802;font-size:22px;margin:0 0 12px;">Your streak is on the line, ${safeName}</h1>
      <p style="line-height:1.6;">You're on a <strong style="color:#00D4FF;">${streakCount}-day streak</strong> and haven't completed today's TikTask yet.</p>
      <p style="line-height:1.6;">A couple minutes now keeps it alive.</p>
      ${button(`${SAMPLE_APP_URL}/apps/tiktask`, "Complete today's tasks")}
    `),
  };
}

export async function sendStreakReminderEmail(to: string, name: string, streakCount: number) {
  const { subject, html } = await resolveEditableEmail(
    "streak-reminder",
    {
      text: { name, streakCount: String(streakCount) },
      html: { cta: button(`${SAMPLE_APP_URL}/apps/tiktask`, "Complete today's tasks") },
    },
    () => buildStreakReminderEmail(name, streakCount)
  );
  await send(to, subject, html);
}

// ---------- Badge earned ----------

export function buildBadgeEarnedEmail(
  name: string,
  badgeName: string,
  badgeIcon?: string | null
): EmailContent {
  const safeName = escapeHtml(name);
  const safeBadgeName = escapeHtml(badgeName);
  const safeIcon = badgeIcon ? escapeHtml(badgeIcon) : "🏆";
  return {
    subject: `You earned a badge: ${badgeName}`,
    html: layout(`
      <div style="text-align:center;font-size:40px;margin-bottom:8px;">${safeIcon}</div>
      <h1 style="color:#FD4802;font-size:22px;margin:0 0 12px;text-align:center;">New badge unlocked, ${safeName}!</h1>
      <p style="line-height:1.6;text-align:center;">You just earned <strong style="color:#00D4FF;">${safeBadgeName}</strong>.</p>
      <div style="text-align:center;">${button(`${SAMPLE_APP_URL}/account`, "View your badges")}</div>
    `),
  };
}

export async function sendBadgeEarnedEmail(
  to: string,
  name: string,
  badgeName: string,
  badgeIcon?: string | null
) {
  const { subject, html } = await resolveEditableEmail(
    "badge-earned",
    {
      text: { name, badgeName, badgeIcon: badgeIcon || "🏆" },
      html: { cta: button(`${SAMPLE_APP_URL}/account`, "View your badges") },
    },
    () => buildBadgeEarnedEmail(name, badgeName, badgeIcon)
  );
  await send(to, subject, html);
}

// ---------- Certificate ----------

export function buildCertificateEmail(
  name: string,
  courseTitle: string,
  courseId: string
): EmailContent {
  const safeName = escapeHtml(name);
  const safeCourseTitle = escapeHtml(courseTitle);
  return {
    subject: `Certificate earned: ${courseTitle}`,
    html: layout(`
      <h1 style="color:#FD4802;font-size:22px;margin:0 0 12px;">Congrats, ${safeName}! 🎓</h1>
      <p style="line-height:1.6;">You completed <strong style="color:#00D4FF;">${safeCourseTitle}</strong> and earned a certificate.</p>
      ${button(`${SAMPLE_APP_URL}/learn/${courseId}`, "View your certificate")}
    `),
  };
}

export async function sendCertificateEmail(
  to: string,
  name: string,
  courseTitle: string,
  courseId: string
) {
  const { subject, html } = await resolveEditableEmail(
    "certificate",
    {
      text: { name, courseTitle },
      html: { cta: button(`${SAMPLE_APP_URL}/learn/${courseId}`, "View your certificate") },
    },
    () => buildCertificateEmail(name, courseTitle, courseId)
  );
  await send(to, subject, html);
}

// ---------- New application admin alert ----------

export type NewApplicationAlertData = {
  name: string;
  email: string;
  platform: string;
  handle: string;
  phone: string;
  smsConsent: boolean;
  socialLink: string | null;
  country: string;
  goals: string;
  whyJoin: string;
  track: "MN" | "CN";
  mnReason: "agency" | "country" | null;
  hasAgency: boolean;
};

function row(label: string, value: string): string {
  return `<p style="line-height:1.5;margin:0 0 10px;"><strong style="color:rgba(245,245,245,0.5);display:block;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;">${label}</strong>${value}</p>`;
}

export function buildNewApplicationAdminAlert(application: NewApplicationAlertData): EmailContent {
  const trackBadge =
    application.track === "CN"
      ? `<span style="background:rgba(253,72,2,0.15);color:#FD4802;border-radius:4px;padding:2px 10px;font-size:12px;font-weight:700;letter-spacing:0.5px;">CN track &middot; US/CA &middot; no agency</span>`
      : application.mnReason === "country"
        ? `<span style="background:rgba(0,212,255,0.15);color:#00D4FF;border-radius:4px;padding:2px 10px;font-size:12px;font-weight:700;letter-spacing:0.5px;">MN &middot; outside US/CA &middot; auto-approved into Hub</span>`
        : `<span style="background:rgba(0,212,255,0.15);color:#00D4FF;border-radius:4px;padding:2px 10px;font-size:12px;font-weight:700;letter-spacing:0.5px;">MN &middot; has agency &middot; auto-approved into Hub</span>`;

  return {
    subject: `New application (${application.track}): ${application.name}`,
    html: layout(`
      <h1 style="color:#FD4802;font-size:20px;margin:0 0 8px;">New membership application</h1>
      <div style="margin:0 0 20px;">${trackBadge}</div>
      ${row("Name", escapeHtml(application.name))}
      ${row("Email", escapeHtml(application.email))}
      ${row("Phone", escapeHtml(application.phone))}
      ${row("Country", escapeHtml(application.country))}
      ${row("Has agency", application.hasAgency ? "Yes" : "No")}
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
      ${button(`${SAMPLE_APP_URL}/admin/applications`, "Review applications")}
    `),
  };
}

export async function sendNewApplicationAdminAlert(
  adminEmails: string[],
  application: NewApplicationAlertData
) {
  if (adminEmails.length === 0) return;
  const { subject, html } = buildNewApplicationAdminAlert(application);
  await Promise.all(adminEmails.map((to) => send(to, subject, html)));
}

// ---------- Creator Network info (sent immediately on CN-track application) ----------

export function buildCreatorNetworkInfoEmail(name: string, applicationId: string): EmailContent {
  const safeName = escapeHtml(name);
  // Routes back through our own thank-you page (rather than straight to
  // TikTok) so the real "Apply" button — the one wired to mark the request,
  // alert admins, and auto-approve them into the Hub — is what they actually
  // click. A plain link in an email can't fire that JS on its own.
  const thankYouUrl = `${SAMPLE_APP_URL}/apply/thank-you?track=cn&aid=${applicationId}`;
  return {
    subject: "Your application + how to join the Creator Network",
    html: layout(`
      <h1 style="color:#FD4802;font-size:22px;margin:0 0 12px;">Thanks for applying, ${safeName}!</h1>
      <p style="line-height:1.6;">We've got your application &mdash; since you're not currently represented by an
        agency, you're eligible to join the <strong style="color:#00D4FF;">TriForge Creator Network (CN)</strong>,
        TikTok's official program for LIVE hosts and creators backed by an agency. It unlocks LIVE perks, priority
        support, and better monetization.</p>
      <p style="line-height:1.6;"><strong>Here's exactly what happens:</strong></p>
      <p style="line-height:1.6;margin:0 0 6px;">1. Tap the button below &mdash; it opens TikTok and starts your
        application to join our network there (you may see us listed as
        <strong>&ldquo;Forge Creator Network&rdquo;</strong>).</p>
      <p style="line-height:1.6;margin:0 0 6px;">2. Submit it in the TikTok app &mdash; our team gets notified the
        moment it comes in.</p>
      <p style="line-height:1.6;margin:0 0 16px;">3. We'll send you a contract right there in TikTok. Once you
        accept it, you're officially part of the TikTok Creator Network.</p>
      <p style="line-height:1.6;">Good news: you don't have to wait on any of that for us. Tapping the button below
        also gets you straight into the <strong style="color:#00D4FF;">TriForge Hub</strong> right now, so you can
        start the <strong>&ldquo;Joining the Creator Network&rdquo;</strong> course while the TikTok side plays
        out.</p>
      ${button(thankYouUrl, "Apply to the TriForge Creator Network")}
    `),
  };
}

export async function sendCreatorNetworkInfoEmail(to: string, name: string, applicationId: string) {
  const thankYouUrl = `${SAMPLE_APP_URL}/apply/thank-you?track=cn&aid=${applicationId}`;
  const { subject, html } = await resolveEditableEmail(
    "creator-network-info",
    {
      text: { name },
      html: { cta: button(thankYouUrl, "Apply to the TriForge Creator Network") },
    },
    () => buildCreatorNetworkInfoEmail(name, applicationId)
  );
  await send(to, subject, html);
}

// ---------- Media Network (outside US/Canada) ----------

export function buildMediaNetworkInfoEmail(name: string): EmailContent {
  const safeName = escapeHtml(name);
  return {
    subject: "You're in the TriForge Media Network",
    html: layout(`
      <h1 style="color:#FD4802;font-size:22px;margin:0 0 12px;">Welcome to the Media Network, ${safeName}</h1>
      <p style="line-height:1.6;">Thanks for applying to TriForge Community.</p>
      <p style="line-height:1.6;">The <strong style="color:#00D4FF;">Forge Creator Network</strong> on TikTok is
        currently available for creators based in the <strong>United States and Canada</strong>. Because you're
        applying from outside those countries, we've placed you in the
        <strong style="color:#00D4FF;">TriForge Media Network</strong> instead.</p>
      <p style="line-height:1.6;">You're still fully part of the community &mdash; we've approved you into the
        Hub. Check your email for a separate invite to set up your login and get started.</p>
      ${button(`${SAMPLE_APP_URL}/login`, "Go to the Hub")}
    `),
  };
}

export async function sendMediaNetworkInfoEmail(to: string, name: string) {
  const { subject, html } = await resolveEditableEmail(
    "media-network-info",
    {
      text: { name },
      html: { cta: button(`${SAMPLE_APP_URL}/login`, "Go to the Hub") },
    },
    () => buildMediaNetworkInfoEmail(name)
  );
  await send(to, subject, html);
}

// ---------- TikTok request heads-up (sent alongside the CN info email) ----------

/**
 * Separate, dedicated email so this doesn't get lost inside the main
 * application-confirmation email — walks them through what to expect once
 * our team sends their Forge Creator Network request/contract inside TikTok,
 * and exactly where to find it.
 */
export function buildTikTokRequestExpectedEmail(name: string): EmailContent {
  const safeName = escapeHtml(name);
  const guideImageUrl = `${SAMPLE_APP_URL}/guides/tiktok-creator-network-steps.png`;
  return {
    subject: "Heads up: you'll get a request from us inside TikTok",
    html: layout(`
      <h1 style="color:#FD4802;font-size:22px;margin:0 0 12px;">Watch for a request in TikTok, ${safeName}</h1>
      <p style="line-height:1.6;">Once you've submitted your application to join the
        <strong style="color:#00D4FF;">Forge Creator Network</strong> on TikTok, our team will review it and send
        you a request (a contract) directly inside the TikTok app. You don't need to do anything until then &mdash;
        we just wanted you to know what to expect and where to find it.</p>
      <p style="line-height:1.6;">When it arrives, here's how to find and accept it inside TikTok:</p>
      <p style="line-height:1.6;margin:0 0 4px;">1. Open TikTok and go to your <strong>Profile</strong>.</p>
      <p style="line-height:1.6;margin:0 0 4px;">2. Tap the menu icon (&#9776;) in the top right, then
        <strong>Creator tools</strong>.</p>
      <p style="line-height:1.6;margin:0 0 4px;">3. Tap <strong>LIVE Center</strong>, then
        <strong>Creator Network Center</strong>.</p>
      <p style="line-height:1.6;margin:0 0 16px;">4. You'll see our request there under
        <strong>&ldquo;Forge Creator Network&rdquo;</strong> &mdash; open it and accept to complete joining.</p>
      <img src="${guideImageUrl}" alt="Step-by-step screenshots showing how to find and accept the Forge Creator Network request in TikTok" style="width:100%;max-width:456px;border-radius:12px;border:1px solid rgba(245,245,245,0.12);" />
    `),
  };
}

export async function sendTikTokRequestExpectedEmail(to: string, name: string) {
  const guideImageUrl = `${SAMPLE_APP_URL}/guides/tiktok-creator-network-steps.png`;
  const { subject, html } = await resolveEditableEmail(
    "tiktok-request-expected",
    {
      text: { name },
      html: {
        guideImage: `<img src="${guideImageUrl}" alt="Step-by-step screenshots showing how to find and accept the Forge Creator Network request in TikTok" style="width:100%;max-width:456px;border-radius:12px;border:1px solid rgba(245,245,245,0.12);" />`,
      },
    },
    () => buildTikTokRequestExpectedEmail(name)
  );
  await send(to, subject, html);
}

// ---------- TikTok Creator Network request admin alert ----------

export type TikTokNetworkRequestAlertData = {
  name: string;
  email: string;
  handle: string;
  /** @deprecated No longer collected — the invite code is entered on TikTok's side, not ours. */
  code?: string | null;
};

export function buildTikTokNetworkRequestAlert(data: TikTokNetworkRequestAlertData): EmailContent {
  const safeName = escapeHtml(data.name);
  return {
    subject: `TikTok Creator Network request: ${data.name}`,
    html: layout(`
      <h1 style="color:#FD4802;font-size:20px;margin:0 0 8px;">New TikTok Creator Network application</h1>
      <p style="line-height:1.6;">${safeName} started an application to join the Forge Creator Network on
        TikTok, and has been auto-approved into the Hub so they can start onboarding.</p>
      ${row("Name", safeName)}
      ${row("Email", escapeHtml(data.email))}
      ${row("TikTok handle", escapeHtml(data.handle))}
      <p style="line-height:1.6;color:rgba(245,245,245,0.6);font-size:13px;">
        Look them up by handle in TikTok's Creator Network Manager tools and send them a contract to bring
        them fully into the network &mdash; no code needed from them on our end.
      </p>
      ${button(`${SAMPLE_APP_URL}/admin/applications`, "View application")}
    `),
  };
}

export async function sendTikTokNetworkRequestAlert(
  adminEmails: string[],
  data: TikTokNetworkRequestAlertData
) {
  if (adminEmails.length === 0) return;
  const { subject, html } = buildTikTokNetworkRequestAlert(data);
  await Promise.all(adminEmails.map((to) => send(to, subject, html)));
}

// ---------- Email changed notice ----------

export function buildEmailChangedNotice(
  oldEmail: string,
  newEmail: string,
  name: string
): EmailContent {
  const safeName = escapeHtml(name);
  const safeOldEmail = escapeHtml(oldEmail);
  const safeNewEmail = escapeHtml(newEmail);
  return {
    subject: "Your TriForge Community login email was changed",
    html: layout(`
      <h1 style="color:#FD4802;font-size:22px;margin:0 0 12px;">Login email changed</h1>
      <p style="line-height:1.6;">Hi ${safeName}, the login email on your TriForge Community account was just changed
        from <strong>${safeOldEmail}</strong> to <strong style="color:#00D4FF;">${safeNewEmail}</strong>.</p>
      <p style="line-height:1.6;color:rgba(245,245,245,0.6);font-size:13px;">
        If you made this change, no action is needed. If you didn't, contact an admin right away.
      </p>
    `),
  };
}

export async function sendEmailChangedNotice(oldEmail: string, newEmail: string, name: string) {
  const { subject, html } = await resolveEditableEmail(
    "email-changed",
    { text: { name, oldEmail, newEmail } },
    () => buildEmailChangedNotice(oldEmail, newEmail, name)
  );
  await send(oldEmail, subject, html);
}

// ---------- Bug report admin alerts ----------

export type BugReportAlertData = {
  title: string;
  description: string;
  reporterName: string;
  statusLabel: string;
  reportId: string;
  reportedAtLabel: string;
  fixedAtLabel?: string | null;
  durationLabel?: string | null;
  platformLabel?: string | null;
  pageUrl?: string | null;
  screenshotUrl?: string | null;
};

export function buildBugReportedAdminAlert(data: BugReportAlertData): EmailContent {
  const screenshotLink = data.screenshotUrl
    ? row(
        "Screenshot",
        `<a href="${safeHref(data.screenshotUrl) || "#"}" style="color:#00D4FF;">View image</a>`
      )
    : "";
  return {
    subject: `Bug reported: ${data.title}`,
    html: layout(`
      <h1 style="color:#FD4802;font-size:20px;margin:0 0 8px;">New bug report</h1>
      <p style="line-height:1.6;margin:0 0 16px;">A member filed a bug on the hub.</p>
      ${row("Title", escapeHtml(data.title))}
      ${row("Reported by", escapeHtml(data.reporterName))}
      ${row("Where", escapeHtml(data.platformLabel || "—"))}
      ${data.pageUrl ? row("Page URL", escapeHtml(data.pageUrl)) : ""}
      ${screenshotLink}
      ${row("Status", escapeHtml(data.statusLabel))}
      ${row("Entered", escapeHtml(data.reportedAtLabel))}
      ${row("Details", escapeHtml(data.description).replace(/\n/g, "<br/>"))}
      ${button(`${SAMPLE_APP_URL}/admin/bugs`, "Open bug reports")}
    `),
  };
}

export function buildBugFixedAdminAlert(data: BugReportAlertData): EmailContent {
  return {
    subject: `Bug fixed: ${data.title}`,
    html: layout(`
      <h1 style="color:#00D4FF;font-size:20px;margin:0 0 8px;">Bug marked fixed</h1>
      <p style="line-height:1.6;margin:0 0 16px;">Credit to <strong>${escapeHtml(data.reporterName)}</strong> for finding it.</p>
      ${row("Title", escapeHtml(data.title))}
      ${row("Found by", escapeHtml(data.reporterName))}
      ${row("Entered", escapeHtml(data.reportedAtLabel))}
      ${row("Fixed", escapeHtml(data.fixedAtLabel || "—"))}
      ${data.durationLabel ? row("Time to fix", escapeHtml(data.durationLabel)) : ""}
      ${button(`${SAMPLE_APP_URL}/bugs`, "View on the board")}
    `),
  };
}

export async function sendBugReportedAdminAlert(
  adminEmails: string[],
  data: BugReportAlertData
) {
  if (adminEmails.length === 0) return;
  const { subject, html } = buildBugReportedAdminAlert(data);
  await Promise.all(adminEmails.map((to) => send(to, subject, html)));
}

export async function sendBugFixedAdminAlert(
  adminEmails: string[],
  data: BugReportAlertData
) {
  if (adminEmails.length === 0) return;
  const { subject, html } = buildBugFixedAdminAlert(data);
  await Promise.all(adminEmails.map((to) => send(to, subject, html)));
}

// ---------- Hub migration invite (GHL import) ----------

/**
 * Sent to people imported from GoHighLevel (existing Media/Creator Network
 * contacts) to bring them over as real Hub accounts. Uses the same
 * invite/signup link as every other invite — clicking it and setting a
 * password is what moves them out of the "holding pattern" and into an
 * active account (see GhlImportStatus in prisma/schema.prisma).
 */
export function buildHubMigrationInviteEmail(name: string, url: string): EmailContent {
  const safeName = escapeHtml(name);
  return {
    subject: "We built you a new home — welcome to the TriForge Hub",
    html: layout(`
      <h1 style="color:#FD4802;font-size:22px;margin:0 0 12px;">You're invited to the TriForge Hub, ${safeName}!</h1>
      <p style="line-height:1.6;">We've built a new home base for TriForge Media and the Creator Network &mdash;
        real-time community chat, a Learning Center with courses, daily task tracking with streaks and XP, and a
        rewards program, all in one place.</p>
      <p style="line-height:1.6;">Click below to set your password and jump in &mdash; it only takes a minute.</p>
      ${button(url, "Set up your Hub account")}
      <p style="color:rgba(245,245,245,0.5);font-size:12px;">If the button doesn't work, copy this link: ${escapeHtml(url)}</p>
    `),
  };
}

export async function sendHubMigrationInviteEmail(to: string, name: string, url: string) {
  const { subject, html } = await resolveEditableEmail(
    "hub-migration-invite",
    {
      text: { name, url },
      html: { cta: button(url, "Set up your Hub account") },
    },
    () => buildHubMigrationInviteEmail(name, url)
  );
  await send(to, subject, html);
}

// ---------- Broadcast (admin-authored, not a fixed template) ----------

export async function sendBroadcastEmail(to: string, subject: string, bodyHtml: string) {
  await send(to, subject, layout(bodyHtml));
}
