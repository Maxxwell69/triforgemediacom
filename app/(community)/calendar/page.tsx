import { requireProfile } from "@/lib/session";
import ModuleScaffold from "@/components/ModuleScaffold";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  await requireProfile();

  return (
    <main className="flex-1 px-6 py-10">
      <ModuleScaffold
        title="HUB"
        accent="CALENDAR"
        summary="Meetings, events, go-live times, availability, and booking — plus mass webinars mirrored from Admin → Webinars."
        phaseNote="Phase A scaffold — models and webinar sync are wired; full calendar UI comes next."
        bullets={[
          "Admins can schedule meetings and hub events.",
          "Members can post availability (live windows or free-for-booking).",
          "Booking against open slots, plus RSVP-style event bookings.",
          "Webinars with audience All / CN / MN appear on the calendar when scheduled or live.",
        ]}
      />
    </main>
  );
}
