import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getActiveBookingPageBySlug,
  listOpenSlotsForPage,
} from "@/lib/booking";
import Logo from "@/components/Logo";
import PublicBookingClient from "@/components/booking/PublicBookingClient";

export const dynamic = "force-dynamic";

export default async function PublicBookPage({
  params,
}: {
  params: { slug: string };
}) {
  const page = await getActiveBookingPageBySlug(params.slug);
  if (!page) notFound();

  const fallbackSlots = await listOpenSlotsForPage(page);
  const meetingTypes = await Promise.all(
    page.meetingTypes.map(async (type) => ({
      id: type.id,
      title: type.title,
      description: type.description,
      durationMins: type.durationMins,
      slots: await listOpenSlotsForPage(page, new Date(), type.durationMins),
    }))
  );
  const hostName = page.host.name?.trim() || "TriForge host";

  return (
    <main className="min-h-screen bg-charcoal px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <Logo height={22} href="/" />
        <div className="mt-10">
          <PublicBookingClient
            slug={page.slug}
            title={page.title}
            description={page.description}
            hostName={hostName}
            timezone={page.timezone}
            durationMins={page.durationMins}
            slots={meetingTypes[0]?.slots ?? fallbackSlots}
            meetingTypes={meetingTypes}
            remindHourBefore={page.remindHourBefore}
          />
        </div>
        <p className="mt-10 text-center font-body text-xs text-off-white/35">
          Powered by{" "}
          <Link href="/" className="text-cyan/80 hover:underline">
            TriForge Hub
          </Link>
        </p>
      </div>
    </main>
  );
}
