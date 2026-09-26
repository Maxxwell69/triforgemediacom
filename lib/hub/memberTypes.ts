import "server-only";

import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/rbac";
import { isClientHubRequest } from "@/lib/hub/requestHost";
import { MEMBER_TYPE_SYSTEM_IDS } from "@/lib/hub/memberTypeCatalog";

export { MEMBER_TYPE_SYSTEMS, MEMBER_TYPE_SYSTEM_IDS } from "@/lib/hub/memberTypeCatalog";

export const BUILTIN_MEMBER_TYPE_KEYS = ["fan", "superfan", "member"] as const;
export type BuiltinMemberTypeKey = (typeof BUILTIN_MEMBER_TYPE_KEYS)[number];

export const ALWAYS_VISIBLE_MENU_IDS = new Set(["home", "account", "notifications"]);

export type HubMemberTypeRow = {
  id: string;
  key: string | null;
  name: string;
  sortOrder: number;
  allowedMenuIds: string[];
  signupDefault: boolean;
};

const DEFAULTS: { key: BuiltinMemberTypeKey; name: string; sortOrder: number; signupDefault: boolean }[] =
  [
    { key: "fan", name: "Fan", sortOrder: 0, signupDefault: true },
    { key: "superfan", name: "Superfan", sortOrder: 1, signupDefault: false },
    { key: "member", name: "Member", sortOrder: 2, signupDefault: false },
  ];

export function roleToMemberTypeKey(role: UserRole): BuiltinMemberTypeKey {
  if (role === "FAN") return "fan";
  if (role === "SUPERFAN") return "superfan";
  return "member";
}

export function memberTypeKeyToRole(key: string | null | undefined): UserRole | null {
  if (key === "fan") return "FAN";
  if (key === "superfan") return "SUPERFAN";
  if (key === "member") return "MEMBER";
  return null;
}

export function sanitizeAllowedMenuIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (!MEMBER_TYPE_SYSTEM_IDS.has(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export function parseMemberTypeIdsFromForm(formData: FormData, field = "memberTypeId"): string[] {
  return Array.from(new Set(formData.getAll(field).map((v) => String(v).trim()).filter(Boolean)));
}

export async function ensureDefaultMemberTypes(): Promise<HubMemberTypeRow[]> {
  if (!isClientHubRequest()) return listMemberTypes();
  for (const def of DEFAULTS) {
    const existing = await prisma.hubMemberType.findUnique({ where: { key: def.key } });
    if (existing) continue;
    await prisma.hubMemberType.create({
      data: {
        key: def.key,
        name: def.name,
        sortOrder: def.sortOrder,
        signupDefault: def.signupDefault,
        allowedMenuIds: [],
      },
    });
  }
  return listMemberTypes();
}

export async function listMemberTypes(): Promise<HubMemberTypeRow[]> {
  try {
    return await prisma.hubMemberType.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        key: true,
        name: true,
        sortOrder: true,
        allowedMenuIds: true,
        signupDefault: true,
      },
    });
  } catch (err) {
    console.error("listMemberTypes failed", err);
    return [];
  }
}

export async function getSignupDefaultMemberType(): Promise<HubMemberTypeRow | null> {
  const types = await ensureDefaultMemberTypes();
  return types.find((t) => t.signupDefault) ?? types.find((t) => t.key === "fan") ?? types[0] ?? null;
}

export async function getMemberTypeForUser(opts: {
  memberTypeId?: string | null;
  role: UserRole;
}): Promise<HubMemberTypeRow | null> {
  if (!isClientHubRequest()) return null;
  const types = await ensureDefaultMemberTypes();
  if (opts.memberTypeId) {
    const exact = types.find((t) => t.id === opts.memberTypeId);
    if (exact) return exact;
  }
  const key = roleToMemberTypeKey(opts.role);
  return types.find((t) => t.key === key) ?? null;
}

export async function assignMemberTypeToUser(userId: string, typeId: string | null) {
  await prisma.user.update({
    where: { id: userId },
    data: { memberTypeId: typeId },
  });
}

export function memberTypeAllowsMenu(
  type: Pick<HubMemberTypeRow, "allowedMenuIds"> | null,
  menuId: string,
  role: UserRole
): boolean {
  if (isAdminRole(role)) return true;
  if (ALWAYS_VISIBLE_MENU_IDS.has(menuId)) return true;
  if (!type || type.allowedMenuIds.length === 0) return true;
  if (menuId === "chat") return type.allowedMenuIds.includes("chat") || type.allowedMenuIds.includes("groups");
  return type.allowedMenuIds.includes(menuId);
}

export function memberCanSeeAudience(
  typeId: string | null,
  audienceMemberTypeIds: string[] | null | undefined,
  role: UserRole
): boolean {
  if (isAdminRole(role)) return true;
  const ids = audienceMemberTypeIds ?? [];
  if (ids.length === 0) return true;
  return !!typeId && ids.includes(typeId);
}

export function clientHubMemberTypesEnabled() {
  return isClientHubRequest();
}
