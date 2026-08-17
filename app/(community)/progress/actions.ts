"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/session";
import { hubHas } from "@/lib/hub/modules";
import { completeLearningModule, completeMission, chooseSpecialty, submitProgressionQuiz } from "@/lib/progression/engine";

export async function chooseMySpecialty(missionId: string) {
  if (!hubHas("progression")) throw new Error("Not available");
  const { user } = await requireProfile();
  await chooseSpecialty(user.id, missionId);
  revalidatePath("/progress");
}

export async function completeMyMission(missionId: string) {
  if (!hubHas("progression")) throw new Error("Not available");
  const { user } = await requireProfile();
  await completeMission(user.id, missionId);
  revalidatePath("/progress");
}

export async function completeMyModule(moduleId: string) {
  if (!hubHas("progression")) throw new Error("Not available");
  const { user } = await requireProfile();
  await completeLearningModule(user.id, moduleId);
  revalidatePath("/progress");
  revalidatePath(`/progress/learn/${moduleId}`);
}

export async function submitMyQuiz(formData: FormData) {
  if (!hubHas("progression")) throw new Error("Not available");
  const { user } = await requireProfile();
  const quizId = String(formData.get("quizId") || "");
  const count = Number(formData.get("questionCount") || 0);
  const answers: number[] = [];
  for (let i = 0; i < count; i += 1) {
    answers.push(Number(formData.get(`a${i}`) || -1));
  }
  await submitProgressionQuiz(user.id, quizId, answers);
  revalidatePath("/progress", "layout");
}
