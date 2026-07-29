import { prisma } from "@/lib/prisma";
import { button, escapeHtml, layout, SAMPLE_APP_URL, type EmailContent } from "@/lib/emailLayout";

export type EmailTemplateKey =
  | "invite"
  | "rejection"
  | "welcome"
  | "password-reset"
  | "streak-reminder"
  | "badge-earned"
  | "certificate"
  | "creator-network-info"
  | "tiktok-request-expected"
  | "hub-migration-invite"
  | "email-changed";

export type TemplateVarDef = {
  key: string;
  label: string;
  /** html = already-safe markup (e.g. CTA button); text = escaped on insert */
  kind: "text" | "html";
};

export type EmailTemplateDef = {
  key: EmailTemplateKey;
  label: string;
  trigger: string;
  variables: TemplateVarDef[];
  wrapsInLayout: boolean;
  defaultSubject: string;
  /** Inner body when wrapsInLayout; otherwise full HTML document. */
  defaultBodyHtml: string;
};

/**
 * Editable member-facing templates. Complex admin-alert emails stay code-only
 * for now (dynamic tables). Use {{name}}, {{cta}}, etc. as placeholders.
 */
export const EMAIL_TEMPLATE_DEFS: EmailTemplateDef[] = [
  {
    key: "invite",
    label: "Invite email",
    trigger: "Sent when someone is approved / invited to set up their account.",
    variables: [
      { key: "name", label: "Member name", kind: "text" },
      { key: "url", label: "Signup URL (plain text)", kind: "text" },
      { key: "cta", label: "Primary button", kind: "html" },
    ],
    wrapsInLayout: true,
    defaultSubject: "You're in — set up your TriForge Community account",
    defaultBodyHtml: `<h1 style="color:#FD4802;font-size:24px;margin:0 0 12px;">Welcome to TriForge Community, {{name}}!</h1>
<p style="line-height:1.6;">Your application has been approved. Click below to set your password and get in.</p>
{{cta}}
<p style="color:rgba(245,245,245,0.5);font-size:12px;">If the button doesn't work, copy this link: {{url}}</p>`,
  },
  {
    key: "rejection",
    label: "Application rejected",
    trigger: "Sent when an admin rejects a pending application.",
    variables: [
      { key: "name", label: "Applicant name", kind: "text" },
      { key: "notes", label: "Optional notes block", kind: "html" },
    ],
    wrapsInLayout: true,
    defaultSubject: "Update on your TriForge Community application",
    defaultBodyHtml: `<h1 style="color:#FD4802;font-size:22px;margin:0 0 12px;">TriForge Community</h1>
<p style="line-height:1.6;">Hi {{name}}, thanks for applying to TriForge Community.</p>
<p style="line-height:1.6;">We're not able to offer you access at this time.{{notes}}</p>
<p style="line-height:1.6;">You're welcome to reapply in the future as things change.</p>`,
  },
  {
    key: "welcome",
    label: "Welcome email",
    trigger: "Sent after a new member finishes onboarding.",
    variables: [
      { key: "name", label: "Member name", kind: "text" },
      { key: "cta", label: "Dashboard button", kind: "html" },
    ],
    wrapsInLayout: true,
    defaultSubject: "You're all set up — welcome to TriForge Community",
    defaultBodyHtml: `<h1 style="color:#FD4802;font-size:24px;margin:0 0 12px;">You're in, {{name}}! 🎉</h1>
<p style="line-height:1.6;">Your profile is set up and TikTask is generating your first daily tasks now.</p>
<p style="line-height:1.6;">Jump into the community, say hi in chat, and start building your streak.</p>
{{cta}}`,
  },
  {
    key: "password-reset",
    label: "Password reset",
    trigger: "Sent from /forgot-password.",
    variables: [
      { key: "name", label: "Member name", kind: "text" },
      { key: "url", label: "Reset URL (plain text)", kind: "text" },
      { key: "cta", label: "Reset button", kind: "html" },
    ],
    wrapsInLayout: true,
    defaultSubject: "Reset your TriForge Community password",
    defaultBodyHtml: `<h1 style="color:#FD4802;font-size:22px;margin:0 0 12px;">Password reset</h1>
<p style="line-height:1.6;">Hi {{name}}, we got a request to reset your password. This link expires in 1 hour.</p>
{{cta}}
<p style="color:rgba(245,245,245,0.5);font-size:12px;line-height:1.6;">If you didn't request this, you can safely ignore this email — your password won't change.</p>
<p style="color:rgba(245,245,245,0.5);font-size:12px;">If the button doesn't work: {{url}}</p>`,
  },
  {
    key: "streak-reminder",
    label: "Streak reminder",
    trigger: "Sent by the streak-reminders cron when a streak is at risk.",
    variables: [
      { key: "name", label: "Member name", kind: "text" },
      { key: "streakCount", label: "Streak days", kind: "text" },
      { key: "cta", label: "TikTask button", kind: "html" },
    ],
    wrapsInLayout: true,
    defaultSubject: "Don't lose your {{streakCount}}-day streak 🔥",
    defaultBodyHtml: `<h1 style="color:#FD4802;font-size:22px;margin:0 0 12px;">Your streak is on the line, {{name}}</h1>
<p style="line-height:1.6;">You're on a <strong style="color:#00D4FF;">{{streakCount}}-day streak</strong> and haven't completed today's TikTask yet.</p>
<p style="line-height:1.6;">A couple minutes now keeps it alive.</p>
{{cta}}`,
  },
  {
    key: "badge-earned",
    label: "Badge earned",
    trigger: "Sent when a member earns a badge.",
    variables: [
      { key: "name", label: "Member name", kind: "text" },
      { key: "badgeName", label: "Badge name", kind: "text" },
      { key: "badgeIcon", label: "Badge emoji/icon", kind: "text" },
      { key: "cta", label: "Account button", kind: "html" },
    ],
    wrapsInLayout: true,
    defaultSubject: "You earned a badge: {{badgeName}}",
    defaultBodyHtml: `<div style="text-align:center;font-size:40px;margin-bottom:8px;">{{badgeIcon}}</div>
<h1 style="color:#FD4802;font-size:22px;margin:0 0 12px;text-align:center;">New badge unlocked, {{name}}!</h1>
<p style="line-height:1.6;text-align:center;">You just earned <strong style="color:#00D4FF;">{{badgeName}}</strong>.</p>
<div style="text-align:center;">{{cta}}</div>`,
  },
  {
    key: "certificate",
    label: "Certificate earned",
    trigger: "Sent when a member completes a certificate-eligible course.",
    variables: [
      { key: "name", label: "Member name", kind: "text" },
      { key: "courseTitle", label: "Course title", kind: "text" },
      { key: "cta", label: "Certificate button", kind: "html" },
    ],
    wrapsInLayout: true,
    defaultSubject: "Certificate earned: {{courseTitle}}",
    defaultBodyHtml: `<h1 style="color:#FD4802;font-size:22px;margin:0 0 12px;">Congrats, {{name}}! 🎓</h1>
<p style="line-height:1.6;">You completed <strong style="color:#00D4FF;">{{courseTitle}}</strong> and earned a certificate.</p>
{{cta}}`,
  },
  {
    key: "creator-network-info",
    label: "Creator Network info (CN track)",
    trigger: "Sent when a no-agency applicant submits /apply.",
    variables: [
      { key: "name", label: "Applicant name", kind: "text" },
      { key: "cta", label: "Apply CTA button", kind: "html" },
    ],
    wrapsInLayout: true,
    defaultSubject: "Your application + how to join the Creator Network",
    defaultBodyHtml: `<h1 style="color:#FD4802;font-size:22px;margin:0 0 12px;">Thanks for applying, {{name}}!</h1>
<p style="line-height:1.6;">We've got your application — since you're not currently represented by an agency, you're eligible to join the <strong style="color:#00D4FF;">TriForge Creator Network (CN)</strong>, TikTok's official program for LIVE hosts and creators backed by an agency.</p>
<p style="line-height:1.6;"><strong>Here's exactly what happens:</strong></p>
<p style="line-height:1.6;margin:0 0 6px;">1. Tap the button below — it opens TikTok and starts your application to join our network there.</p>
<p style="line-height:1.6;margin:0 0 6px;">2. Submit it in the TikTok app — our team gets notified the moment it comes in.</p>
<p style="line-height:1.6;margin:0 0 16px;">3. We'll send you a contract right there in TikTok. Once you accept it, you're officially part of the TikTok Creator Network.</p>
<p style="line-height:1.6;">Tapping the button also gets you into the <strong style="color:#00D4FF;">TriForge Hub</strong> so you can start learning while TikTok processes.</p>
{{cta}}`,
  },
  {
    key: "tiktok-request-expected",
    label: "TikTok request heads-up (CN track)",
    trigger: "Sent alongside Creator Network info on CN apply.",
    variables: [
      { key: "name", label: "Applicant name", kind: "text" },
      { key: "guideImage", label: "Guide image HTML", kind: "html" },
    ],
    wrapsInLayout: true,
    defaultSubject: "Heads up: you'll get a request from us inside TikTok",
    defaultBodyHtml: `<h1 style="color:#FD4802;font-size:22px;margin:0 0 12px;">Watch for a request in TikTok, {{name}}</h1>
<p style="line-height:1.6;">Once you've submitted your application to join the <strong style="color:#00D4FF;">Forge Creator Network</strong> on TikTok, our team will send you a request (a contract) inside the TikTok app.</p>
<p style="line-height:1.6;">When it arrives:</p>
<p style="line-height:1.6;margin:0 0 4px;">1. Open TikTok and go to your <strong>Profile</strong>.</p>
<p style="line-height:1.6;margin:0 0 4px;">2. Tap the menu icon, then <strong>Creator tools</strong>.</p>
<p style="line-height:1.6;margin:0 0 4px;">3. Tap <strong>LIVE Center</strong>, then <strong>Creator Network Center</strong>.</p>
<p style="line-height:1.6;margin:0 0 16px;">4. Open and accept the request under <strong>“Forge Creator Network”</strong>.</p>
{{guideImage}}`,
  },
  {
    key: "hub-migration-invite",
    label: "Hub migration invite (GHL import)",
    trigger: "Sent when importing contacts / resending invites.",
    variables: [
      { key: "name", label: "Member name", kind: "text" },
      { key: "url", label: "Signup URL (plain text)", kind: "text" },
      { key: "cta", label: "Signup button", kind: "html" },
    ],
    wrapsInLayout: true,
    defaultSubject: "Your TriForge Hub account is ready",
    defaultBodyHtml: `<h1 style="color:#FD4802;font-size:22px;margin:0 0 12px;">Welcome to the new Hub, {{name}}</h1>
<p style="line-height:1.6;">We've moved the TriForge community into a new home. Click below to set your password and jump in.</p>
{{cta}}
<p style="color:rgba(245,245,245,0.5);font-size:12px;">If the button doesn't work: {{url}}</p>`,
  },
  {
    key: "email-changed",
    label: "Login email changed",
    trigger: "Sent to the old address when a member changes email.",
    variables: [
      { key: "name", label: "Member name", kind: "text" },
      { key: "oldEmail", label: "Previous email", kind: "text" },
      { key: "newEmail", label: "New email", kind: "text" },
    ],
    wrapsInLayout: true,
    defaultSubject: "Your TriForge login email was changed",
    defaultBodyHtml: `<h1 style="color:#FD4802;font-size:22px;margin:0 0 12px;">Email updated</h1>
<p style="line-height:1.6;">Hi {{name}}, your login email was changed from <strong>{{oldEmail}}</strong> to <strong>{{newEmail}}</strong>.</p>
<p style="line-height:1.6;">If you didn't make this change, contact TriForge support right away.</p>`,
  },
];

export function getTemplateDef(key: string): EmailTemplateDef | undefined {
  return EMAIL_TEMPLATE_DEFS.find((t) => t.key === key);
}

export type TemplateVars = {
  text?: Record<string, string>;
  html?: Record<string, string>;
};

function interpolate(template: string, vars: TemplateVars): string {
  const text = vars.text ?? {};
  const html = vars.html ?? {};
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    if (Object.prototype.hasOwnProperty.call(html, key)) return html[key] ?? "";
    if (Object.prototype.hasOwnProperty.call(text, key)) return escapeHtml(text[key] ?? "");
    return "";
  });
}

export function renderTemplateContent(
  def: EmailTemplateDef,
  subjectSrc: string,
  bodySrc: string,
  wrapsInLayout: boolean,
  vars: TemplateVars
): EmailContent {
  const subject = interpolate(subjectSrc, vars);
  const body = interpolate(bodySrc, vars);
  return {
    subject,
    html: wrapsInLayout ? layout(body) : body,
  };
}

export async function resolveEditableEmail(
  key: EmailTemplateKey,
  vars: TemplateVars,
  fallback: () => EmailContent
): Promise<EmailContent> {
  const def = getTemplateDef(key);
  if (!def) return fallback();

  const row = await prisma.emailTemplate.findUnique({ where: { key } });
  if (!row) return fallback();

  return renderTemplateContent(def, row.subject, row.bodyHtml, row.wrapsInLayout, vars);
}

/** Sample vars for admin preview of a template. */
export function sampleVarsFor(key: EmailTemplateKey): TemplateVars {
  const name = "Jane Creator";
  const url = `${SAMPLE_APP_URL}/signup?token=sample-token`;
  switch (key) {
    case "invite":
      return {
        text: { name, url },
        html: { cta: button(url, "Set up your account") },
      };
    case "rejection":
      return {
        text: { name },
        html: {
          notes: ` Note from our team: &quot;Thanks for applying — we&#39;re looking for more LIVE-focused hosts right now.&quot;`,
        },
      };
    case "welcome":
      return {
        text: { name },
        html: { cta: button(`${SAMPLE_APP_URL}/home`, "Go to your dashboard") },
      };
    case "password-reset":
      return {
        text: { name, url: `${SAMPLE_APP_URL}/reset-password?token=sample` },
        html: { cta: button(`${SAMPLE_APP_URL}/reset-password?token=sample`, "Reset password") },
      };
    case "streak-reminder":
      return {
        text: { name, streakCount: "12" },
        html: { cta: button(`${SAMPLE_APP_URL}/apps/tiktask`, "Complete today's tasks") },
      };
    case "badge-earned":
      return {
        text: { name, badgeName: "7-Day Streak", badgeIcon: "🔥" },
        html: { cta: button(`${SAMPLE_APP_URL}/account`, "View your badges") },
      };
    case "certificate":
      return {
        text: { name, courseTitle: "TikTok LIVE Fundamentals" },
        html: {
          cta: button(`${SAMPLE_APP_URL}/learn/sample-course-id`, "View your certificate"),
        },
      };
    case "creator-network-info":
      return {
        text: { name },
        html: {
          cta: button(
            `${SAMPLE_APP_URL}/apply/thank-you?track=cn&aid=sample`,
            "Apply to the TriForge Creator Network"
          ),
        },
      };
    case "tiktok-request-expected":
      return {
        text: { name },
        html: {
          guideImage: `<img src="${SAMPLE_APP_URL}/guides/tiktok-creator-network-steps.png" alt="Guide" style="width:100%;max-width:456px;border-radius:12px;border:1px solid rgba(245,245,245,0.12);" />`,
        },
      };
    case "hub-migration-invite":
      return {
        text: { name, url },
        html: { cta: button(url, "Set up your Hub account") },
      };
    case "email-changed":
      return {
        text: {
          name,
          oldEmail: "jane.old@example.com",
          newEmail: "jane.new@example.com",
        },
      };
    default:
      return { text: { name } };
  }
}
