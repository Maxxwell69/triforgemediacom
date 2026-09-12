import type { OnboardingKind, OnboardingProgressStatus } from "@prisma/client";

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

export function onboardingKindLabel(kind: OnboardingKind) {
  switch (kind) {
    case "GETTING_STARTED":
      return "Getting started";
    case "CAMPAIGN":
      return "Campaign follow-through";
    default:
      return "Custom path";
  }
}
