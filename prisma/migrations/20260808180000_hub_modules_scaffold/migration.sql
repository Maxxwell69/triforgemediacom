-- Phase A scaffold: Groups v2 + Projects + Calendar/Booking
-- Expand-only migration (no drops). Seeds the Home group.

-- ---------- Groups v2 ----------
CREATE TYPE "GroupJoinMode" AS ENUM ('INVITE_ONLY', 'APPLY', 'CLOSED');
CREATE TYPE "GroupMemberRole" AS ENUM ('MANAGER', 'MOD', 'MEMBER');
CREATE TYPE "GroupApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

ALTER TABLE "Group" ADD COLUMN "isHome" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Group" ADD COLUMN "joinMode" "GroupJoinMode" NOT NULL DEFAULT 'INVITE_ONLY';

CREATE INDEX "Group_isHome_idx" ON "Group"("isHome");

ALTER TABLE "GroupMember" ADD COLUMN "role" "GroupMemberRole" NOT NULL DEFAULT 'MEMBER';
CREATE INDEX "GroupMember_groupId_role_idx" ON "GroupMember"("groupId", "role");

CREATE TABLE "GroupInvite" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT,
    "invitedById" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupInvite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GroupInvite_token_key" ON "GroupInvite"("token");
CREATE INDEX "GroupInvite_groupId_idx" ON "GroupInvite"("groupId");

ALTER TABLE "GroupInvite" ADD CONSTRAINT "GroupInvite_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroupInvite" ADD CONSTRAINT "GroupInvite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "GroupApplication" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT,
    "status" "GroupApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupApplication_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GroupApplication_groupId_status_idx" ON "GroupApplication"("groupId", "status");
CREATE UNIQUE INDEX "GroupApplication_groupId_userId_key" ON "GroupApplication"("groupId", "userId");

ALTER TABLE "GroupApplication" ADD CONSTRAINT "GroupApplication_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroupApplication" ADD CONSTRAINT "GroupApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroupApplication" ADD CONSTRAINT "GroupApplication_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Home / Main hub space (channels attachment + auto-enroll land in Phase B)
INSERT INTO "Group" ("id", "name", "description", "color", "grantsTikTaskAccess", "isHome", "joinMode", "createdAt", "updatedAt")
SELECT
  'home_group_system',
  'Home',
  'Main hub space — default community channels live here.',
  '#FD4802',
  true,
  true,
  'CLOSED',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Group" WHERE "isHome" = true);

-- ---------- Projects ----------
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNING', 'ACTIVE', 'ON_HOLD', 'DONE', 'ARCHIVED');
CREATE TYPE "ProjectTaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED');
CREATE TYPE "ProjectMemberRole" AS ENUM ('OWNER', 'MEMBER');

CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'PLANNING',
    "groupId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Project_status_idx" ON "Project"("status");
CREATE INDEX "Project_groupId_idx" ON "Project"("groupId");

ALTER TABLE "Project" ADD CONSTRAINT "Project_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Project" ADD CONSTRAINT "Project_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ProjectMember" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ProjectMemberRole" NOT NULL DEFAULT 'MEMBER',
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectMember_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProjectMember_userId_idx" ON "ProjectMember"("userId");
CREATE UNIQUE INDEX "ProjectMember_projectId_userId_key" ON "ProjectMember"("projectId", "userId");

ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ProjectTask" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProjectTaskStatus" NOT NULL DEFAULT 'TODO',
    "assigneeId" TEXT,
    "createdById" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectTask_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProjectTask_projectId_status_idx" ON "ProjectTask"("projectId", "status");
CREATE INDEX "ProjectTask_assigneeId_idx" ON "ProjectTask"("assigneeId");

ALTER TABLE "ProjectTask" ADD CONSTRAINT "ProjectTask_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectTask" ADD CONSTRAINT "ProjectTask_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProjectTask" ADD CONSTRAINT "ProjectTask_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------- Calendar / availability / booking ----------
CREATE TYPE "CalendarEventKind" AS ENUM ('MEETING', 'EVENT', 'LIVE', 'WEBINAR', 'OTHER');
CREATE TYPE "CalendarEventVisibility" AS ENUM ('HUB', 'GROUP', 'PRIVATE');
CREATE TYPE "CalendarBookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DECLINED', 'CANCELLED');
CREATE TYPE "AvailabilityKind" AS ENUM ('LIVE', 'FREE', 'BUSY');

CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "kind" "CalendarEventKind" NOT NULL DEFAULT 'EVENT',
    "visibility" "CalendarEventVisibility" NOT NULL DEFAULT 'HUB',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "location" TEXT,
    "groupId" TEXT,
    "createdById" TEXT NOT NULL,
    "webinarId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CalendarEvent_webinarId_key" ON "CalendarEvent"("webinarId");
CREATE INDEX "CalendarEvent_startsAt_idx" ON "CalendarEvent"("startsAt");
CREATE INDEX "CalendarEvent_kind_startsAt_idx" ON "CalendarEvent"("kind", "startsAt");
CREATE INDEX "CalendarEvent_groupId_idx" ON "CalendarEvent"("groupId");

ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_webinarId_fkey" FOREIGN KEY ("webinarId") REFERENCES "Webinar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "CalendarEventAttendee" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "CalendarEventAttendee_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CalendarEventAttendee_userId_idx" ON "CalendarEventAttendee"("userId");
CREATE UNIQUE INDEX "CalendarEventAttendee_eventId_userId_key" ON "CalendarEventAttendee"("eventId", "userId");

ALTER TABLE "CalendarEventAttendee" ADD CONSTRAINT "CalendarEventAttendee_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CalendarEventAttendee" ADD CONSTRAINT "CalendarEventAttendee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "AvailabilitySlot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "AvailabilityKind" NOT NULL DEFAULT 'FREE',
    "label" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "isBookable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvailabilitySlot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AvailabilitySlot_userId_startsAt_idx" ON "AvailabilitySlot"("userId", "startsAt");
CREATE INDEX "AvailabilitySlot_startsAt_endsAt_idx" ON "AvailabilitySlot"("startsAt", "endsAt");

ALTER TABLE "AvailabilitySlot" ADD CONSTRAINT "AvailabilitySlot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "CalendarBooking" (
    "id" TEXT NOT NULL,
    "slotId" TEXT,
    "eventId" TEXT,
    "bookerId" TEXT NOT NULL,
    "hostId" TEXT,
    "status" "CalendarBookingStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarBooking_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CalendarBooking_bookerId_idx" ON "CalendarBooking"("bookerId");
CREATE INDEX "CalendarBooking_hostId_idx" ON "CalendarBooking"("hostId");
CREATE INDEX "CalendarBooking_slotId_idx" ON "CalendarBooking"("slotId");
CREATE INDEX "CalendarBooking_eventId_idx" ON "CalendarBooking"("eventId");
CREATE INDEX "CalendarBooking_startsAt_idx" ON "CalendarBooking"("startsAt");

ALTER TABLE "CalendarBooking" ADD CONSTRAINT "CalendarBooking_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "AvailabilitySlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CalendarBooking" ADD CONSTRAINT "CalendarBooking_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CalendarBooking" ADD CONSTRAINT "CalendarBooking_bookerId_fkey" FOREIGN KEY ("bookerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CalendarBooking" ADD CONSTRAINT "CalendarBooking_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
