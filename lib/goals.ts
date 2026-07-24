/**
 * Fixed set of TikTask goals. Keys are stored as boolean flags inside
 * `Profile.goals` (e.g. `{ growFollowers: true }`) and referenced by
 * `TaskTemplate.goalKey` so admins can target task templates at a goal
 * without touching application code.
 */
export const GOAL_OPTIONS = [
  { key: "growFollowers", label: "Grow followers" },
  { key: "consistentSchedule", label: "Consistent posting schedule" },
  { key: "increaseEngagement", label: "Increase engagement" },
  { key: "monetization", label: "Monetization / brand deals" },
] as const;

export type GoalKey = (typeof GOAL_OPTIONS)[number]["key"];

export type Goals = Partial<Record<GoalKey, boolean>>;

export function activeGoalKeys(goals: unknown): string[] {
  if (!goals || typeof goals !== "object") return [];
  return Object.entries(goals as Record<string, unknown>)
    .filter(([, v]) => v === true)
    .map(([k]) => k);
}
