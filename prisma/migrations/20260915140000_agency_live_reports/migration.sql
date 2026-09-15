-- CreateTable
CREATE TABLE "AgencyLiveRosterMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "addedById" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgencyLiveRosterMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgencyLiveReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "ranAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ranById" TEXT,
    "metrics" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgencyLiveReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgencyLiveReportNote" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgencyLiveReportNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AgencyLiveRosterMember_userId_key" ON "AgencyLiveRosterMember"("userId");

-- CreateIndex
CREATE INDEX "AgencyLiveRosterMember_addedAt_idx" ON "AgencyLiveRosterMember"("addedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AgencyLiveReport_userId_year_month_key" ON "AgencyLiveReport"("userId", "year", "month");

-- CreateIndex
CREATE INDEX "AgencyLiveReport_year_month_idx" ON "AgencyLiveReport"("year", "month");

-- CreateIndex
CREATE INDEX "AgencyLiveReportNote_reportId_createdAt_idx" ON "AgencyLiveReportNote"("reportId", "createdAt");

-- AddForeignKey
ALTER TABLE "AgencyLiveRosterMember" ADD CONSTRAINT "AgencyLiveRosterMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyLiveRosterMember" ADD CONSTRAINT "AgencyLiveRosterMember_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyLiveReport" ADD CONSTRAINT "AgencyLiveReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyLiveReport" ADD CONSTRAINT "AgencyLiveReport_ranById_fkey" FOREIGN KEY ("ranById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyLiveReportNote" ADD CONSTRAINT "AgencyLiveReportNote_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "AgencyLiveReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyLiveReportNote" ADD CONSTRAINT "AgencyLiveReportNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
