import {
  buildInviteEmail,
  buildRejectionEmail,
  buildWelcomeEmail,
  buildPasswordResetEmail,
  buildStreakReminderEmail,
  buildBadgeEarnedEmail,
  buildCertificateEmail,
  buildNewApplicationAdminAlert,
  buildCreatorNetworkInfoEmail,
  buildTikTokRequestExpectedEmail,
  buildTikTokNetworkRequestAlert,
  buildEmailChangedNotice,
  type EmailContent,
} from "@/lib/email";

export const dynamic = "force-dynamic";

const SAMPLE_NAME = "Jane Creator";
const SAMPLE_EMAIL = "jane@example.com";

type Template = {
  key: string;
  label: string;
  trigger: string;
  content: EmailContent;
};

function getTemplates(): Template[] {
  return [
    {
      key: "invite",
      label: "Invite email",
      trigger:
        "Sent when an admin approves an application, when an admin adds a member directly, immediately when an MN (has agency) applicant submits /apply, or when a CN applicant clicks through on the TikTok Creator Network CTA.",
      content: buildInviteEmail(
        SAMPLE_NAME,
        "https://hub.triforgemedia.com/signup?token=sample-token-abc123"
      ),
    },
    {
      key: "rejection",
      label: "Application rejected",
      trigger: "Sent when an admin rejects a pending application.",
      content: buildRejectionEmail(
        SAMPLE_NAME,
        "Thanks for applying — we're looking for more LIVE-focused hosts right now."
      ),
    },
    {
      key: "welcome",
      label: "Welcome email",
      trigger: "Sent right after a new member finishes onboarding (sets their platform + goals).",
      content: buildWelcomeEmail(SAMPLE_NAME),
    },
    {
      key: "password-reset",
      label: "Password reset",
      trigger: "Sent when a member requests a password reset from /forgot-password.",
      content: buildPasswordResetEmail(
        SAMPLE_NAME,
        "https://hub.triforgemedia.com/reset-password?token=sample-token-abc123"
      ),
    },
    {
      key: "streak-reminder",
      label: "Streak reminder",
      trigger: "Sent by the streak-reminders cron job to members about to lose a TikTask streak.",
      content: buildStreakReminderEmail(SAMPLE_NAME, 12),
    },
    {
      key: "badge-earned",
      label: "Badge earned",
      trigger: "Sent when an admin awards a badge, or a member auto-earns one from a course.",
      content: buildBadgeEarnedEmail(SAMPLE_NAME, "7-Day Streak", "🔥"),
    },
    {
      key: "certificate",
      label: "Certificate earned",
      trigger: "Sent when a member completes every lesson in a course.",
      content: buildCertificateEmail(SAMPLE_NAME, "TikTok LIVE Fundamentals", "sample-course-id"),
    },
    {
      key: "new-application-alert",
      label: "Admin alert: new application",
      trigger: "Sent to alertable admins the moment someone submits /apply.",
      content: buildNewApplicationAdminAlert({
        name: SAMPLE_NAME,
        email: SAMPLE_EMAIL,
        platform: "TIKTOK",
        handle: "@janecreator",
        phone: "(555) 555-5555",
        smsConsent: true,
        socialLink: "https://tiktok.com/@janecreator",
        goals: "Grow to 50k followers and go LIVE 5x/week.",
        whyJoin: "I want structure, accountability, and a team behind me.",
        track: "CN",
      }),
    },
    {
      key: "creator-network-info",
      label: "Creator Network info (CN track)",
      trigger: "Sent immediately when a \"no agency\" applicant submits /apply.",
      content: buildCreatorNetworkInfoEmail(SAMPLE_NAME, "sample-application-id"),
    },
    {
      key: "tiktok-request-expected",
      label: "TikTok request heads-up (CN track)",
      trigger:
        "Sent immediately when a \"no agency\" applicant submits /apply, alongside the Creator Network info email.",
      content: buildTikTokRequestExpectedEmail(SAMPLE_NAME),
    },
    {
      key: "tiktok-network-alert",
      label: "Admin alert: TikTok Creator Network request",
      trigger:
        "Sent to alertable admins the first time a CN applicant clicks through on the /apply/thank-you page (which also auto-approves them into the Hub).",
      content: buildTikTokNetworkRequestAlert({
        name: SAMPLE_NAME,
        email: SAMPLE_EMAIL,
        handle: "@janecreator",
      }),
    },
    {
      key: "email-changed",
      label: "Login email changed",
      trigger: "Sent to the old address when a member changes their login email from /account.",
      content: buildEmailChangedNotice("jane.old@example.com", "jane.new@example.com", SAMPLE_NAME),
    },
  ];
}

export default function AdminEmailsPage() {
  const templates = getTemplates();

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-wide">
        EMAIL <span className="text-gradient">TEMPLATES</span>
      </h1>
      <p className="mt-2 font-body text-off-white/60">
        Live previews of every system email, rendered with sample data. Nothing here sends —
        it&apos;s just for reviewing copy and design. The broadcast tool has its own live preview
        on the compose screen.
      </p>

      <div className="mt-10 flex flex-col gap-8">
        {templates.map((t) => (
          <div key={t.key} className="glass rounded-2xl p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-2xl tracking-wide">{t.label}</h2>
            </div>
            <p className="mt-1 font-body text-xs text-off-white/50">{t.trigger}</p>
            <p className="mt-3 font-body text-sm text-off-white/70">
              <span className="text-off-white/40">Subject:</span> {t.content.subject}
            </p>
            <div className="mt-4 overflow-hidden rounded-xl border border-off-white/10 bg-charcoal">
              <iframe
                title={t.label}
                srcDoc={t.content.html}
                sandbox=""
                className="h-[520px] w-full"
              />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
