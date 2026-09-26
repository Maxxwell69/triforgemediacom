import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isTrueAdmin } from "@/lib/rbac";
import { isClientHubRequest } from "@/lib/hub/requestHost";
import { ensureDefaultMemberTypes } from "@/lib/hub/memberTypes";
import { MEMBER_TYPE_SYSTEMS } from "@/lib/hub/memberTypeCatalog";
import { createMemberType } from "./actions";
import MemberTypeEditor from "@/components/admin/MemberTypeEditor";

export const dynamic = "force-dynamic";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white outline-none transition focus:border-cyan/60";

export default async function AdminMemberTypesPage() {
  const session = await auth();
  if (!session?.user || !isTrueAdmin(session.user.role) || !isClientHubRequest()) {
    redirect("/admin");
  }

  const types = await ensureDefaultMemberTypes();
  const systems = MEMBER_TYPE_SYSTEMS.map((s) => ({ id: s.id, label: s.label }));

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-wide">
        MEMBER <span className="text-gradient">TYPES</span>
      </h1>
      <p className="mt-2 font-body text-off-white/60">
        Name the kinds of people on this hub — Fan, Superfan, or your own labels — and choose
        which systems each type can see. Webinars and events can then be limited to those types.
      </p>

      <form action={createMemberType} className="glass mt-8 flex flex-wrap items-end gap-3 rounded-2xl p-6">
        <label className="min-w-[14rem] flex-1 font-body text-xs text-off-white/50">
          New type name
          <input name="name" required placeholder="e.g. VIP" className={`mt-1 ${fieldClass}`} />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-orange px-5 py-2 font-body text-sm font-semibold text-off-white shadow-glow"
        >
          Add type
        </button>
      </form>

      <div className="mt-6 flex flex-col gap-4">
        {types.map((type) => (
          <MemberTypeEditor key={type.id} type={type} systems={systems} />
        ))}
      </div>
    </main>
  );
}
