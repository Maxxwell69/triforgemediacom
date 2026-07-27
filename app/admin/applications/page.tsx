import { prisma } from "@/lib/prisma";
import { approveApplication, rejectApplication } from "./actions";
import { PLATFORM_LABELS as platformLabels } from "@/lib/platforms";

export const dynamic = "force-dynamic";

type ApplicationAnswers = {
  platform?: string;
  handle?: string;
  phone?: string;
  smsConsent?: boolean;
  socialLink?: string | null;
  goals?: string;
  whyJoin?: string;
  hasAgency?: string;
};

export default async function AdminApplicationsPage() {
  const applications = await prisma.application.findMany({
    where: { status: "PENDING" },
    include: { user: true },
    orderBy: { submittedAt: "asc" },
  });

  const recentlyReviewed = await prisma.application.findMany({
    where: { status: { in: ["APPROVED", "REJECTED"] } },
    include: { user: true, reviewedBy: true },
    orderBy: { reviewedAt: "desc" },
    take: 10,
  });

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-wide">
        APPLICATION <span className="text-gradient">QUEUE</span>
      </h1>
      <p className="mt-2 font-body text-off-white/60">
        {applications.length} pending application{applications.length === 1 ? "" : "s"}
      </p>

      <div className="mt-10 flex flex-col gap-6">
        {applications.length === 0 && (
          <p className="glass rounded-2xl p-8 text-center font-body text-off-white/50">
            No pending applications. Nice and caught up.
          </p>
        )}

        {applications.map((app) => {
          const answers = app.answers as ApplicationAnswers;
          return (
            <div key={app.id} className="glass rounded-2xl p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-2xl tracking-wide">
                    {app.user.name || "Unnamed"}
                  </h2>
                  {answers.hasAgency === "yes" ? (
                    <span className="rounded-full border border-cyan/40 bg-cyan/10 px-2.5 py-0.5 font-body text-xs font-semibold text-cyan">
                      MN &middot; has agency
                    </span>
                  ) : (
                    <span className="rounded-full border border-orange/40 bg-orange/10 px-2.5 py-0.5 font-body text-xs font-semibold text-orange">
                      CN track &middot; no agency
                    </span>
                  )}
                </div>
                <span className="font-body text-sm text-off-white/50">{app.user.email}</span>
              </div>

              <dl className="mt-4 grid grid-cols-1 gap-3 font-body text-sm sm:grid-cols-2">
                <Detail
                  label="Platform"
                  value={
                    (platformLabels as Record<string, string>)[answers.platform || ""] || "—"
                  }
                />
                <Detail label="Handle" value={answers.handle || "—"} />
                <Detail
                  label="Phone"
                  value={
                    answers.phone ? (
                      <a href={`tel:${answers.phone}`} className="text-cyan hover:underline">
                        {answers.phone}
                      </a>
                    ) : (
                      "—"
                    )
                  }
                />
                <Detail
                  label="SMS consent"
                  value={
                    answers.smsConsent ? (
                      <span className="text-cyan">Yes, opted in</span>
                    ) : (
                      <span className="text-off-white/40">Not given</span>
                    )
                  }
                />
                {answers.socialLink && (
                  <Detail
                    label="Link"
                    value={
                      <a
                        href={answers.socialLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan hover:underline"
                      >
                        {answers.socialLink}
                      </a>
                    }
                  />
                )}
                <Detail label="Submitted" value={new Date(app.submittedAt).toLocaleString()} />
              </dl>

              <div className="mt-4 grid grid-cols-1 gap-3 font-body text-sm sm:grid-cols-2">
                <div>
                  <p className="mb-1 font-medium text-off-white/70">Goals</p>
                  <p className="text-off-white/60">{answers.goals}</p>
                </div>
                <div>
                  <p className="mb-1 font-medium text-off-white/70">Why join</p>
                  <p className="text-off-white/60">{answers.whyJoin}</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <form action={approveApplication} className="flex flex-col gap-2">
                  <input type="hidden" name="applicationId" value={app.id} />
                  <textarea
                    name="notes"
                    rows={2}
                    placeholder="Optional note (visible to the applicant)"
                    className="w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none focus:border-cyan/60"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-cyan/90 px-4 py-2 font-body font-semibold text-charcoal transition hover:brightness-110"
                  >
                    Approve &amp; send invite
                  </button>
                </form>

                <form action={rejectApplication} className="flex flex-col gap-2">
                  <input type="hidden" name="applicationId" value={app.id} />
                  <textarea
                    name="notes"
                    rows={2}
                    placeholder="Optional note (visible to the applicant)"
                    className="w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none focus:border-cyan/60"
                  />
                  <button
                    type="submit"
                    className="rounded-lg border border-orange/40 px-4 py-2 font-body font-semibold text-orange transition hover:bg-orange/10"
                  >
                    Reject
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </div>

      {recentlyReviewed.length > 0 && (
        <div className="mt-16">
          <h2 className="font-display text-3xl tracking-wide text-off-white/70">
            RECENTLY REVIEWED
          </h2>
          <div className="mt-4 flex flex-col gap-2">
            {recentlyReviewed.map((app) => (
              <div
                key={app.id}
                className="flex items-center justify-between rounded-lg border border-off-white/10 px-4 py-3 font-body text-sm"
              >
                <span>{app.user.name || app.user.email}</span>
                <span
                  className={
                    app.status === "APPROVED" ? "text-cyan" : "text-orange"
                  }
                >
                  {app.status}
                </span>
                <span className="text-off-white/40">
                  {app.reviewedBy?.name || "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="font-medium text-off-white/70">{label}</dt>
      <dd className="text-off-white/60">{value}</dd>
    </div>
  );
}
