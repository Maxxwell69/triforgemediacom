import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applySchema } from "@/lib/validations/apply";
import { sendCreatorNetworkInfoEmail, sendNewApplicationAdminAlert } from "@/lib/email";
import { getAlertableAdminEmails } from "@/lib/adminAlerts";
import { syncMnMembership } from "@/lib/mnCn";

async function alertAdmins(application: {
  name: string;
  email: string;
  platform: string;
  handle: string;
  socialLink: string | null;
  goals: string;
  whyJoin: string;
  hasAgency: boolean;
}) {
  try {
    const admins = await getAlertableAdminEmails();
    await sendNewApplicationAdminAlert(admins, {
      name: application.name,
      email: application.email,
      platform: application.platform,
      handle: application.handle,
      socialLink: application.socialLink,
      goals: application.goals,
      whyJoin: application.whyJoin,
      track: application.hasAgency ? "MN" : "CN",
    });
  } catch (err) {
    // Never fail the application submission because the notification email failed.
    console.error("Failed to send new-application admin alert:", err);
  }
}

async function routeByAgencyStatus(userId: string, name: string, email: string, hasAgency: boolean) {
  try {
    await syncMnMembership(userId, hasAgency);
    if (!hasAgency) {
      await sendCreatorNetworkInfoEmail(email, name);
    }
  } catch (err) {
    console.error("Failed to route applicant by agency status:", err);
  }
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = applySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid application", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { name, email, platform, handle, socialLink, goals, whyJoin, hasAgency } = parsed.data;
  const normalizedEmail = email.toLowerCase();
  const hasAgencyBool = hasAgency === "yes";

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: { application: true },
  });

  if (existingUser) {
    if (existingUser.application) {
      const status = existingUser.application.status;
      if (status === "PENDING") {
        return NextResponse.json(
          { error: "You already have an application pending review." },
          { status: 409 }
        );
      }
      if (status === "APPROVED") {
        return NextResponse.json(
          { error: "You've already been approved — check your email for an invite." },
          { status: 409 }
        );
      }
      // REJECTED: fall through and allow them to update their answers + reapply.
      await prisma.application.update({
        where: { userId: existingUser.id },
        data: {
          answers: { name, platform, handle, socialLink: socialLink || null, goals, whyJoin, hasAgency },
          status: "PENDING",
          reviewNotes: null,
          reviewedById: null,
          reviewedAt: null,
          submittedAt: new Date(),
        },
      });
      await Promise.all([
        alertAdmins({
          name,
          email: normalizedEmail,
          platform,
          handle,
          socialLink: socialLink || null,
          goals,
          whyJoin,
          hasAgency: hasAgencyBool,
        }),
        routeByAgencyStatus(existingUser.id, name, normalizedEmail, hasAgencyBool),
      ]);
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // User row exists (e.g. from a prior partial signup) but no application yet.
    await prisma.application.create({
      data: {
        userId: existingUser.id,
        answers: { name, platform, handle, socialLink: socialLink || null, goals, whyJoin, hasAgency },
      },
    });
    await Promise.all([
      alertAdmins({
        name,
        email: normalizedEmail,
        platform,
        handle,
        socialLink: socialLink || null,
        goals,
        whyJoin,
        hasAgency: hasAgencyBool,
      }),
      routeByAgencyStatus(existingUser.id, name, normalizedEmail, hasAgencyBool),
    ]);
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const newUser = await prisma.user.create({
    data: {
      email: normalizedEmail,
      name,
      status: "PENDING_APPLICATION",
      application: {
        create: {
          answers: { name, platform, handle, socialLink: socialLink || null, goals, whyJoin, hasAgency },
        },
      },
    },
  });
  await Promise.all([
    alertAdmins({
      name,
      email: normalizedEmail,
      platform,
      handle,
      socialLink: socialLink || null,
      goals,
      whyJoin,
      hasAgency: hasAgencyBool,
    }),
    routeByAgencyStatus(newUser.id, name, normalizedEmail, hasAgencyBool),
  ]);

  return NextResponse.json({ ok: true }, { status: 201 });
}
