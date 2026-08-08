import ModuleScaffold from "@/components/ModuleScaffold";

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <ModuleScaffold
        title="PROJECTS"
        accent="& TASKS"
        summary="Assign hub projects and tasks to members. Distinct from TikTask templates (Admin → Task templates)."
        phaseNote="Phase A scaffold — Prisma models are ready; create/assign UI is next."
        bullets={[
          "Create projects, add members, assign tasks with due dates.",
          "Members only see a project if they are on it or assigned a task.",
          "Optional link to a Group space when Groups v2 lands.",
        ]}
      />
    </div>
  );
}
