import { requireProfile } from "@/lib/session";
import { getUserPointsTotal } from "@/lib/points";
import { hasTikTaskAccess } from "@/lib/groups";
import { isAdminRole } from "@/lib/rbac";
import AccountFeatureLink from "@/components/account/AccountFeatureLink";
import AccountPageShell from "@/components/account/AccountPageShell";

export default async function AccountPage() {
  const { user, profile } = await requireProfile();
  const isStaff = isAdminRole(user.role);
  const [points, tikTaskAccess] = await Promise.all([
    getUserPointsTotal(user.id),
    hasTikTaskAccess(user.id),
  ]);

  return (
    <AccountPageShell
      title={
        <>
          YOUR <span className="text-gradient">ACCOUNT</span>
        </>
      }
      description="Open a section below to manage tools, security, or your creator profile."
    >
      <div className="flex gap-4">
        <div className="glass flex-1 rounded-xl p-4 text-center">
          <p className="font-display text-3xl text-gradient">{points}</p>
          <p className="mt-1 font-body text-xs uppercase tracking-wide text-off-white/50">
            Points
          </p>
        </div>
        <div className="glass flex-1 rounded-xl p-4 text-center">
          <p className="font-display text-3xl">🔥 {profile.streakCount}</p>
          <p className="mt-1 font-body text-xs uppercase tracking-wide text-off-white/50">
            Day streak
          </p>
        </div>
      </div>

      <h2 className="mt-10 font-display text-2xl tracking-wide text-off-white/80">
        Features
      </h2>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {tikTaskAccess && (
          <AccountFeatureLink
            href="/apps/tiktask"
            title="TikTask"
            description="Your daily creator tasks, streak, and XP."
            accent="cyan"
          />
        )}
        <AccountFeatureLink
          href="/calendar"
          title="Calendar"
          description="See scheduled hub meetings, events, and webinars."
          accent="cyan"
        />
        {isStaff && (
          <AccountFeatureLink
            href="/account/booking"
            title="Booking"
            description="Set weekly availability and share your booking link."
            accent="orange"
          />
        )}
        <AccountFeatureLink
          href="/account/insights"
          title="Creator Insights"
          description="Private TikTok stats and live status for your account."
          accent="orange"
        />
        <AccountFeatureLink
          href="/account/profile"
          title="Profile"
          description="Name, socials, tags, badges, and display preferences."
          accent="cyan"
        />
        <AccountFeatureLink
          href="/account/security"
          title="Security"
          description="Email, password, and announcement preferences."
          accent="cyan"
        />
        {isStaff && (
          <AccountFeatureLink
            href="/admin/calendar"
            title="Hub Events"
            description="Schedule meetings and events for the member calendar."
            accent="orange"
          />
        )}
      </div>
    </AccountPageShell>
  );
}
