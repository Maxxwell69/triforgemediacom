import ModuleScaffold from "@/components/ModuleScaffold";

export const dynamic = "force-dynamic";

export default async function AdminCalendarPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <ModuleScaffold
        title="CALENDAR"
        accent="ADMIN"
        summary="Schedule hub meetings and events, review availability, and manage bookings."
        phaseNote="Phase A scaffold — schema + webinar mirror sync are live; admin composer next."
        bullets={[
          "Mass webinars (All / CN / MN) already sync onto CalendarEvent when scheduled or live.",
          "Admin-only webinars stay off the member calendar.",
          "Coming next: event composer, availability moderation, booking inbox.",
        ]}
      />
    </div>
  );
}
