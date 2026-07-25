import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import CertificateActions from "@/components/CertificateActions";

export const dynamic = "force-dynamic";

export default async function CertificatePage({
  params,
}: {
  params: { courseId: string };
}) {
  const { user } = await requireProfile();

  const certificate = await prisma.certificate.findUnique({
    where: { userId_courseId: { userId: user.id, courseId: params.courseId } },
    include: { course: { select: { title: true } } },
  });

  if (!certificate) notFound();

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href={`/learn/${params.courseId}`}
          className="font-body text-sm text-off-white/50 transition hover:text-off-white print:hidden"
        >
          &larr; {certificate.course.title}
        </Link>

        <div className="glass relative mt-6 flex flex-col items-center gap-4 rounded-2xl border-2 border-cyan/30 p-12 text-center print:border-off-white/20 print:bg-white print:text-charcoal">
          <span className="text-5xl">🎓</span>
          <p className="font-body text-xs font-semibold uppercase tracking-[0.3em] text-cyan print:text-charcoal/60">
            Certificate of Completion
          </p>
          <h1 className="font-display text-4xl tracking-wide text-gradient print:text-charcoal">
            {user.name || user.email}
          </h1>
          <p className="max-w-md font-body text-off-white/70 print:text-charcoal/70">
            has successfully completed
          </p>
          <h2 className="font-display text-2xl tracking-wide text-off-white print:text-charcoal">
            {certificate.course.title}
          </h2>
          <p className="mt-4 font-body text-sm text-off-white/50 print:text-charcoal/50">
            Issued{" "}
            {certificate.issuedAt.toLocaleDateString([], {
              dateStyle: "long",
            })}
          </p>
          <p className="font-body text-xs uppercase tracking-wide text-off-white/30 print:text-charcoal/40">
            Certificate No. {certificate.certNumber}
          </p>
          <p className="mt-2 font-display text-lg tracking-wide text-orange print:text-charcoal">
            TriForge Media Community
          </p>
        </div>

        <CertificateActions />
      </div>
    </main>
  );
}
