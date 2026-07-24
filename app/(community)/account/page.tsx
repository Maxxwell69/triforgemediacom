import { requireProfile } from "@/lib/session";
import { getUserPointsTotal } from "@/lib/points";
import { activeGoalKeys } from "@/lib/goals";
import ProfileEditForm from "./ProfileEditForm";
import ChangePasswordForm from "./ChangePasswordForm";

export default async function AccountPage() {
  const { user, profile } = await requireProfile();
  const points = await getUserPointsTotal(user.id);
  const socialLinks = (profile.socialLinks as Record<string, string> | null) ?? {};

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-5xl tracking-wide">
          YOUR <span className="text-gradient">ACCOUNT</span>
        </h1>
        <p className="mt-2 font-body text-off-white/60">
          Update your creator profile and account settings.
        </p>

        <div className="mt-6 flex gap-4">
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

        <h2 className="mt-10 font-display text-2xl tracking-wide text-off-white/80">Profile</h2>
        <div className="mt-4">
          <ProfileEditForm
            defaultValues={{
              platform: profile.platform,
              goals: activeGoalKeys(profile.goals),
              bio: profile.bio ?? "",
              tiktokUrl: socialLinks.tiktok ?? "",
              twitchUrl: socialLinks.twitch ?? "",
              youtubeUrl: socialLinks.youtube ?? "",
            }}
          />
        </div>

        <h2 className="mt-10 font-display text-2xl tracking-wide text-off-white/80">
          Change password
        </h2>
        <div className="mt-4">
          <ChangePasswordForm />
        </div>
      </div>
    </main>
  );
}
