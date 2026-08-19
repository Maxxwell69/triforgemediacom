import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { requireProgressionModule } from "@/lib/progression/module";
import { completeMyModule, submitMyQuiz } from "../../actions";
import { categoryUnlockMessage, evaluateProgression } from "@/lib/progression/engine";
import {
  isProgressionEnrolled,
  maybeAutoEnrollProgression,
  requireMemberProgressionPage,
} from "@/lib/progression/access";

export const dynamic = "force-dynamic";

export default async function ProgressLearnPage({ params }: { params: { moduleId: string } }) {
  requireProgressionModule();
  const { user } = await requireProfile();
  const learnModule = await prisma.progressionLearningModule.findUnique({
    where: { id: params.moduleId },
    include: { quiz: { include: { questions: { orderBy: { sortOrder: "asc" } } } }, category: true },
  });
  if (!learnModule || learnModule.status !== "ACTIVE") notFound();
  await requireMemberProgressionPage(user.role);
  await maybeAutoEnrollProgression(user.id, user.role);
  if (!(await isProgressionEnrolled(user.id))) redirect("/progress");
  await evaluateProgression(user.id);
  const locked = await categoryUnlockMessage(user.id, learnModule.categoryId);
  const done = await prisma.progressionModuleCompletion.findUnique({
    where: { userId_moduleId: { userId: user.id, moduleId: learnModule.id } },
  });
  const lastAttempt = learnModule.quiz
    ? await prisma.progressionQuizAttempt.findFirst({
        where: { userId: user.id, quizId: learnModule.quiz.id },
        orderBy: { createdAt: "desc" },
      })
    : null;

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/progress" className="font-body text-sm text-off-white/50 hover:text-cyan">
          ← Progress
        </Link>
        <h1 className="mt-4 font-display text-4xl tracking-wide">{learnModule.title}</h1>
        <p className="mt-1 font-body text-xs text-off-white/40">{learnModule.category.name}</p>
        {locked ? (
          <p className="mt-4 font-body text-sm text-orange">{locked}</p>
        ) : null}
        {learnModule.description ? (
          <p className="mt-4 font-body text-sm text-off-white/65">{learnModule.description}</p>
        ) : null}
        {learnModule.content ? (
          <div className="glass mt-6 whitespace-pre-wrap rounded-2xl p-6 font-body text-sm text-off-white/75">
            {learnModule.content}
          </div>
        ) : null}
        {learnModule.videoUrl ? (
          <p className="mt-4">
            <a href={learnModule.videoUrl} className="font-body text-sm text-cyan hover:underline" target="_blank" rel="noreferrer">
              Watch video
            </a>
          </p>
        ) : null}
        {learnModule.linkUrl ? (
          <p className="mt-2">
            <a href={learnModule.linkUrl} className="font-body text-sm text-cyan hover:underline" target="_blank" rel="noreferrer">
              Open resource
            </a>
          </p>
        ) : null}

        {locked ? null : learnModule.quiz && learnModule.quiz.questions.length > 0 ? (
          <form action={submitMyQuiz} className="glass mt-8 flex flex-col gap-4 rounded-2xl p-6">
            <h2 className="font-display text-xl text-off-white/80">Quiz · pass {learnModule.quiz.passThreshold}%</h2>
            <input type="hidden" name="quizId" value={learnModule.quiz.id} />
            <input type="hidden" name="questionCount" value={learnModule.quiz.questions.length} />
            {learnModule.quiz.questions.map((question, i) => {
              const options = Array.isArray(question.options) ? (question.options as string[]) : [];
              return (
                <fieldset key={question.id}>
                  <legend className="font-body text-sm text-off-white">{question.prompt}</legend>
                  <div className="mt-2 flex flex-col gap-1">
                    {options.map((option, n) => (
                      <label key={n} className="font-body text-sm text-off-white/70">
                        <input type="radio" name={`a${i}`} value={n} className="mr-2 accent-orange" required />
                        {option}
                      </label>
                    ))}
                  </div>
                </fieldset>
              );
            })}
            {lastAttempt ? (
              <p className="font-body text-xs text-off-white/45">
                Last score: {lastAttempt.score}% {lastAttempt.passed ? "(passed)" : "(try again)"}
              </p>
            ) : null}
            <button type="submit" className="self-start rounded-lg bg-orange px-6 py-2 font-body font-semibold text-off-white">
              Submit quiz
            </button>
          </form>
        ) : !done ? (
          <form
            action={async () => {
              "use server";
              await completeMyModule(learnModule.id);
            }}
            className="mt-8"
          >
            <button type="submit" className="rounded-lg bg-orange px-6 py-2 font-body font-semibold text-off-white">
              Mark complete
            </button>
          </form>
        ) : (
          <p className="mt-8 font-body text-sm text-cyan">Module complete</p>
        )}
      </div>
    </main>
  );
}
