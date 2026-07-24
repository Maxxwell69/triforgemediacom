import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applySchema } from "@/lib/validations/apply";

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

  const { name, email, platform, handle, socialLink, goals, whyJoin } = parsed.data;
  const normalizedEmail = email.toLowerCase();

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
          answers: { name, platform, handle, socialLink: socialLink || null, goals, whyJoin },
          status: "PENDING",
          reviewNotes: null,
          reviewedById: null,
          reviewedAt: null,
          submittedAt: new Date(),
        },
      });
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // User row exists (e.g. from a prior partial signup) but no application yet.
    await prisma.application.create({
      data: {
        userId: existingUser.id,
        answers: { name, platform, handle, socialLink: socialLink || null, goals, whyJoin },
      },
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  await prisma.user.create({
    data: {
      email: normalizedEmail,
      name,
      status: "PENDING_APPLICATION",
      application: {
        create: {
          answers: { name, platform, handle, socialLink: socialLink || null, goals, whyJoin },
        },
      },
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
