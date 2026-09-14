"use client";

import { useState } from "react";
import type { OnboardingActionType } from "@prisma/client";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white outline-none focus:border-cyan/60";

export type OnboardingCourseOption = {
  id: string;
  title: string;
  isPublished: boolean;
};

export default function OnboardingStepActionFields({
  courses,
  defaultActionType = "CONFIRM",
  defaultActionTarget = "",
}: {
  courses: OnboardingCourseOption[];
  defaultActionType?: OnboardingActionType;
  defaultActionTarget?: string | null;
}) {
  const [actionType, setActionType] = useState<OnboardingActionType>(defaultActionType);
  const target = defaultActionTarget ?? "";

  return (
    <>
      <label className="font-body text-sm text-off-white/70">
        Action
        <select
          name="actionType"
          value={actionType}
          onChange={(e) => setActionType(e.target.value as OnboardingActionType)}
          className={`${fieldClass} mt-1`}
        >
          <option value="CONFIRM">Confirm / check off</option>
          <option value="LINK">Open a link</option>
          <option value="COURSE_LINK">Open a course</option>
          <option value="CUSTOM">Custom path</option>
        </select>
      </label>
      {actionType === "COURSE_LINK" ? (
        <label className="font-body text-sm text-off-white/70 sm:col-span-2">
          Course
          <select
            key="course-target"
            name="actionTarget"
            required
            defaultValue={courses.some((course) => course.id === target) ? target : ""}
            className={`${fieldClass} mt-1`}
          >
            <option value="">Select a course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
                {course.isPublished ? "" : " (draft)"}
              </option>
            ))}
          </select>
        </label>
      ) : actionType === "CONFIRM" ? null : (
        <label className="font-body text-sm text-off-white/70 sm:col-span-2">
          {actionType === "LINK" ? "Link" : "Path"}
          <input
            key={actionType}
            name="actionTarget"
            required
            defaultValue={actionType === defaultActionType ? target : ""}
            placeholder={actionType === "LINK" ? "https://… or /account/profile" : "/learn"}
            className={`${fieldClass} mt-1`}
          />
        </label>
      )}
    </>
  );
}
