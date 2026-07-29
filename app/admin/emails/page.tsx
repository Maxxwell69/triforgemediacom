import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/rbac";
import {
  EMAIL_TEMPLATE_DEFS,
  renderTemplateContent,
  sampleVarsFor,
} from "@/lib/emailTemplates";

export default async function AdminEmailsPage() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) notFound();

  const overrides = await prisma.emailTemplate.findMany();
  const overrideByKey = new Map(overrides.map((o) => [o.key, o]));

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <div>
        <h1 className="font-display text-4xl tracking-wide text-off-white">Email templates</h1>
        <p className="mt-2 font-body text-sm text-off-white/60">
          Edit member-facing emails below. Changes go live immediately for new sends. Admin alerts stay
          code-managed.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {EMAIL_TEMPLATE_DEFS.map((def) => {
          const override = overrideByKey.get(def.key);
          const subject = override?.subject ?? def.defaultSubject;
          const body = override?.bodyHtml ?? def.defaultBodyHtml;
          const preview = renderTemplateContent(
            def,
            subject,
            body,
            def.wrapsInLayout,
            sampleVarsFor(def.key)
          );

          return (
            <details
              key={def.key}
              className="glass group rounded-2xl open:ring-1 open:ring-cyan/30"
            >
              <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-body text-base font-semibold text-off-white">{def.label}</p>
                    {override ? (
                      <span className="rounded-full border border-cyan/40 bg-cyan/10 px-2 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wide text-cyan">
                        Customized
                      </span>
                    ) : (
                      <span className="rounded-full border border-off-white/15 px-2 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wide text-off-white/40">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 font-body text-xs text-off-white/45">{def.trigger}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/admin/emails/${def.key}`}
                    className="rounded-lg bg-orange px-3 py-1.5 font-body text-xs font-semibold text-off-white transition hover:brightness-110"
                  >
                    Edit
                  </Link>
                  <span className="font-body text-xs text-off-white/40 group-open:hidden">
                    Preview ↓
                  </span>
                </div>
              </summary>
              <div className="border-t border-off-white/10 px-5 pb-5 pt-4">
                <p className="mb-3 font-body text-sm text-off-white/60">
                  Subject: <span className="text-off-white/85">{preview.subject}</span>
                </p>
                <div className="overflow-hidden rounded-xl border border-off-white/10 bg-charcoal">
                  <iframe
                    title={def.label}
                    srcDoc={preview.html}
                    sandbox=""
                    className="h-[420px] w-full"
                  />
                </div>
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
