import { requireProfile } from "@/lib/session";
import { getHomeGroup } from "@/lib/groups";
import { prisma } from "@/lib/prisma";
import ModuleScaffold from "@/components/ModuleScaffold";

export const dynamic = "force-dynamic";

export default async function GroupsPage() {
  await requireProfile();
  const home = await getHomeGroup();
  const groupCount = await prisma.group.count();

  return (
    <main className="flex-1 px-6 py-10">
      <ModuleScaffold
        title="GROUPS"
        accent="& SPACES"
        summary="Spaces with their own channels, roles, invites, and applications. The Home group is the main hub."
        phaseNote="Phase A scaffold — schema and Home group are live; member join flows come next."
        bullets={[
          home
            ? `Home group ready: “${home.name}” (${home.id}).`
            : "Home group will appear after the migration runs on this environment.",
          `${groupCount} group${groupCount === 1 ? "" : "s"} in the database (including access-control groups).`,
          "Coming next: invites, apply/approve, group roles (manager / mod / member), and per-group channels.",
        ]}
      />
    </main>
  );
}
