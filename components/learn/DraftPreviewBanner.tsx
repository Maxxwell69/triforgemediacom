import Link from "next/link";

/** Sticky banner when an admin/mod is viewing an unpublished course. */
export default function DraftPreviewBanner({
  courseId,
  courseTitle,
}: {
  courseId: string;
  courseTitle: string;
}) {
  return (
    <div className="sticky top-0 z-30 border-b border-orange/40 bg-orange/15 px-4 py-2.5 backdrop-blur">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2">
        <p className="font-body text-sm text-orange">
          <span className="font-semibold">Draft preview</span>
          <span className="text-orange/80">
            {" "}
            — &ldquo;{courseTitle}&rdquo; is unpublished. Only admins and mods can see this.
          </span>
        </p>
        <Link
          href={`/admin/courses/${courseId}`}
          className="shrink-0 rounded-lg border border-orange/50 px-3 py-1 font-body text-xs font-semibold text-orange transition hover:bg-orange/10"
        >
          Back to editor
        </Link>
      </div>
    </div>
  );
}
