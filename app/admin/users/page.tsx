import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import UserRoleSelect from "@/components/admin/UserRoleSelect";
import BanButton from "@/components/admin/BanButton";

export const dynamic = "force-dynamic";

const statusStyles: Record<string, string> = {
  ACTIVE: "text-cyan",
  INVITED: "text-off-white/50",
  BANNED: "text-orange",
  PENDING_APPLICATION: "text-off-white/50",
};

export default async function AdminUsersPage() {
  const session = await auth();
  const currentUserId = session!.user.id;

  const users = await prisma.user.findMany({
    where: { status: { in: ["ACTIVE", "INVITED", "BANNED"] } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-wide">
        USER <span className="text-gradient">MANAGEMENT</span>
      </h1>
      <p className="mt-2 font-body text-off-white/60">{users.length} members</p>

      <div className="mt-10 flex flex-col gap-2">
        {users.map((user) => {
          const isSelf = user.id === currentUserId;
          const isBanned = user.status === "BANNED";
          return (
            <div
              key={user.id}
              className="glass flex flex-wrap items-center justify-between gap-4 rounded-xl p-4"
            >
              <div className="min-w-0">
                <p className="truncate font-body font-medium text-off-white">
                  {user.name || "Unnamed"}
                  {isSelf && <span className="ml-2 text-xs text-off-white/40">(you)</span>}
                </p>
                <p className="truncate font-body text-sm text-off-white/50">{user.email}</p>
              </div>

              <div className="flex items-center gap-4">
                <span
                  className={`font-body text-xs font-semibold uppercase tracking-wide ${
                    statusStyles[user.status] || "text-off-white/50"
                  }`}
                >
                  {user.status}
                </span>
                <UserRoleSelect userId={user.id} currentRole={user.role} disabled={isSelf} />
                <BanButton userId={user.id} banned={isBanned} disabled={isSelf} />
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
