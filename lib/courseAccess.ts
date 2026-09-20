import type { UserRole } from "@prisma/client";
import { isAdminRole } from "@/lib/rbac";

/** Members only see published courses; admins/mods can open drafts to preview. */
export function canViewCourse(
  course: { isPublished: boolean; hubOwnerOnly?: boolean },
  role: UserRole | undefined | null
): boolean {
  if (course.hubOwnerOnly) return false;
  return course.isPublished || isAdminRole(role);
}
