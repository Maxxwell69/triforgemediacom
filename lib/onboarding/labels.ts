import type { OnboardingProgressStatus } from "@prisma/client";

export function onboardingStatusLabel(status: OnboardingProgressStatus | "NOT_STARTED") {
  switch (status) {
    case "IN_PROGRESS":
      return "In progress";
    case "DISMISSED":
      return "Dismissed";
    case "COMPLETED":
      return "Completed";
    default:
      return "Not started";
  }
}
