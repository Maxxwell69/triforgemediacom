import AccountFeatureLink from "@/components/account/AccountFeatureLink";
import { reopenMemberOnboarding } from "@/app/(community)/onboarding/actions";

export default function AccountOnboardingCard({
  moduleId,
  title,
  status,
}: {
  moduleId: string;
  title: string;
  status: "IN_PROGRESS" | "DISMISSED";
}) {
  if (status === "IN_PROGRESS") {
    return (
      <AccountFeatureLink
        href="/home"
        title={title}
        description="Continue this checklist on Home."
        accent="orange"
      />
    );
  }

  return (
    <form action={reopenMemberOnboarding}>
      <input type="hidden" name="moduleId" value={moduleId} />
      <button
        type="submit"
        className="group glass flex w-full flex-col rounded-xl p-4 text-left transition hover:border-orange/40 hover:bg-orange/5"
      >
        <span className="font-display text-lg tracking-wide text-off-white transition group-hover:text-orange">
          {title}
        </span>
        <span className="mt-1 font-body text-xs text-off-white/45">
          You dismissed this checklist. Reopen it on Home.
        </span>
        <span className="mt-3 font-body text-xs text-off-white/35 transition group-hover:text-off-white/60">
          Reopen →
        </span>
      </button>
    </form>
  );
}
