"use client";

import ProgressionToggle from "@/components/admin/ProgressionToggle";
import { setLevelMilestone } from "@/app/admin/progression/actions";

export default function LevelMilestoneToggle({
  levelId,
  missionId,
  checked,
  label,
}: {
  levelId: string;
  missionId: string;
  checked: boolean;
  label: string;
}) {
  return (
    <ProgressionToggle
      checked={checked}
      label={label}
      onToggle={(on) => setLevelMilestone(levelId, missionId, on)}
    />
  );
}
