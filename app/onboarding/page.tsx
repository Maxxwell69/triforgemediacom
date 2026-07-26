import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import OnboardingForm from "./OnboardingForm";

export default async function OnboardingPage() {
  const user = await requireUser();

  const existingProfile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (existingProfile) {
    redirect("/home");
  }

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16">
      <div className="w-full max-w-2xl">
        <div className="mb-10 text-center">
          <h1 className="font-display text-5xl tracking-wide sm:text-6xl">
            SET UP YOUR <span className="text-gradient">PROFILE</span>
          </h1>
          <p className="mt-3 font-body text-off-white/60">
            This drives your TikTask daily list — takes less than a minute.
          </p>
        </div>
        <OnboardingForm />
      </div>
    </main>
  );
}
