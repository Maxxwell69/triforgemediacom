import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/rbac";
import { getTemplateDef, sampleVarsFor } from "@/lib/emailTemplates";
import EmailTemplateEditor from "@/components/admin/EmailTemplateEditor";

export default async function AdminEmailTemplateEditPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) notFound();

  const { key } = await params;
  const def = getTemplateDef(key);
  if (!def) notFound();

  const override = await prisma.emailTemplate.findUnique({ where: { key } });

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div>
        <Link
          href="/admin/emails"
          className="font-body text-sm text-off-white/50 transition hover:text-cyan"
        >
          ← Email templates
        </Link>
        <h1 className="mt-2 font-display text-4xl tracking-wide text-off-white">{def.label}</h1>
        <p className="mt-1 font-body text-sm text-off-white/50">
          Edit subject and body. Use {"{{placeholders}}"} for dynamic fields. HTML placeholders like{" "}
          {"{{cta}}"} are injected by the system.
        </p>
      </div>

      <EmailTemplateEditor
        def={def}
        initialSubject={override?.subject ?? def.defaultSubject}
        initialBodyHtml={override?.bodyHtml ?? def.defaultBodyHtml}
        isCustomized={Boolean(override)}
        updatedByName={override?.updatedByName ?? null}
        updatedAt={override?.updatedAt?.toISOString() ?? null}
        sampleVars={sampleVarsFor(def.key)}
      />
    </div>
  );
}
