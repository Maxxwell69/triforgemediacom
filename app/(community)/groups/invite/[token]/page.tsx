import Link from "next/link";
import { requireProfile } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AcceptGroupInviteButton from "@/components/groups/AcceptGroupInviteButton";

export const dynamic = "force-dynamic";

export default async function GroupInvitePage({
  params,
}: {
  params: { token: string };
}) {
  await requireProfile();

  const invite = await prisma.groupInvite.findUnique({
    where: { token: params.token },
    include: {
      group: { select: { id: true, name: true, description: true, color: true, isHome: true } },
    },
  });

  const expired =
    !!invite?.expiresAt && invite.expiresAt.getTime() <= Date.now();
  const invalid = !invite || invite.acceptedAt || expired || invite.group.isHome;

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="glass w-full max-w-md rounded-2xl p-8 text-center">
        {invalid ? (
          <>
            <h1 className="font-display text-3xl tracking-wide text-off-white">
              Invite unavailable
            </h1>
            <p className="mt-3 font-body text-sm text-off-white/60">
              This invite link is invalid, expired, or already used.
            </p>
            <Link
              href="/groups"
              className="mt-6 inline-block font-body text-sm text-cyan hover:underline"
            >
              Back to Groups
            </Link>
          </>
        ) : (
          <>
            <div className="mx-auto mb-4 h-5 w-5 rounded-full border border-off-white/20"
              style={{ backgroundColor: invite.group.color }}
            />
            <h1 className="font-display text-3xl tracking-wide text-gradient">
              {invite.group.name}
            </h1>
            {invite.group.description && (
              <p className="mt-2 font-body text-sm text-off-white/60">
                {invite.group.description}
              </p>
            )}
            <p className="mt-4 font-body text-sm text-off-white/50">
              You&apos;ve been invited to join this space.
            </p>
            <div className="mt-6">
              <AcceptGroupInviteButton token={params.token} />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
