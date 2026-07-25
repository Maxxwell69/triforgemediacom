-- AlterTable
ALTER TABLE "Course" ADD COLUMN "completionGroupId" TEXT;

-- CreateTable
CREATE TABLE "Module" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Module_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN "moduleId" TEXT,
ADD COLUMN "audioUrl" TEXT,
ADD COLUMN "htmlEmbed" TEXT,
ADD COLUMN "dripDaysAfterEnroll" INTEGER,
ADD COLUMN "dripUnlockAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "_CourseGroups" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CourseGroups_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "Module_courseId_order_idx" ON "Module"("courseId", "order");

-- CreateIndex
CREATE INDEX "Lesson_moduleId_order_idx" ON "Lesson"("moduleId", "order");

-- CreateIndex
CREATE INDEX "_CourseGroups_B_index" ON "_CourseGroups"("B");

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_completionGroupId_fkey" FOREIGN KEY ("completionGroupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Module" ADD CONSTRAINT "Module_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CourseGroups" ADD CONSTRAINT "_CourseGroups_A_fkey" FOREIGN KEY ("A") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CourseGroups" ADD CONSTRAINT "_CourseGroups_B_fkey" FOREIGN KEY ("B") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
