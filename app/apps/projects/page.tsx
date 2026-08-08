import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/session";
import { isAdminRole } from "@/lib/rbac";

export const dynamic = "force-dynamic";

/** Projects stay admin-only for now — members do not get a hub nav entry. */
export default async function ProjectsPage() {
  const { user } = await requireProfile();
  if (isAdminRole(user.role)) {
    redirect("/admin/projects");
  }
  redirect("/home");
}
