import type { UserRole } from "@prisma/client";
import { isAdminRole } from "@/lib/rbac";

/** Members only see published courses; admins/mods can open drafts to preview. */
export function canViewCourse(
  course: { isPublished: boolean },
  role: UserRole | undefined | null
): boolean {
  return course.isPublished || isAdminRole(role);
}
