import { requireProfile } from "@/lib/session";
import { listVisibleProjectsForUser } from "@/lib/projects";
import ModuleScaffold from "@/components/ModuleScaffold";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const { user } = await requireProfile();
  const projects = await listVisibleProjectsForUser(user.id);

  return (
    <main className="flex-1 px-6 py-10">
      <ModuleScaffold
        title="MY"
        accent="PROJECTS"
        summary="Hub projects and tasks assigned to you by admins. Separate from TikTask daily habits."
        phaseNote="Phase A scaffold — you only see work you’re added to or assigned."
        bullets={[
          projects.length === 0
            ? "No projects assigned to you yet."
            : `${projects.length} project${projects.length === 1 ? "" : "s"} visible to you (detail UI next).`,
          "Admins manage projects under Admin → Projects.",
        ]}
      />
    </main>
  );
}
