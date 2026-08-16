import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { requireProgressionModule } from "@/lib/progression/module";
import { completeMyModule, submitMyQuiz } from "../../actions";

export const dynamic = "force-dynamic";

export default async function ProgressLearnPage({ params }: { params: { moduleId: string } }) {
  requireProgressionModule();
  const { user } = await requireProfile();
  const module = await prisma.progressionLearningModule.findUnique({
    where: { id: params.moduleId },
    include: { quiz: { include: { questions: { orderBy: { sortOrder: "asc" } } } }, category: true },
  });
  if (!module || module.status !== "ACTIVE") notFound();
  const done = await prisma.progressionModuleCompletion.findUnique({
    where: { userId_moduleId: { userId: user.id, moduleId: module.id } },
  });
  const lastAttempt = module.quiz
    ? await prisma.progressionQuizAttempt.findFirst({
        where: { userId: user.id, quizId: module.quiz.id },
        orderBy: { createdAt: "desc" },
      })
    : null;

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/progress" className="font-body text-sm text-off-white/50 hover:text-cyan">
          ← Progress
        </Link>
        <h1 className="mt-4 font-display text-4xl tracking-wide">{module.title}</h1>
        <p className="mt-1 font-body text-xs text-off-white/40">{module.category.name}</p>
        {module.description ? (
          <p className="mt-4 font-body text-sm text-off-white/65">{module.description}</p>
        ) : null}
        {module.content ? (
          <div className="glass mt-6 whitespace-pre-wrap rounded-2xl p-6 font-body text-sm text-off-white/75">
            {module.content}
          </div>
        ) : null}
        {module.videoUrl ? (
          <p className="mt-4">
            <a href={module.videoUrl} className="font-body text-sm text-cyan hover:underline" target="_blank" rel="noreferrer">
              Watch video
            </a>
          </p>
        ) : null}
        {module.linkUrl ? (
          <p className="mt-2">
            <a href={module.linkUrl} className="font-body text-sm text-cyan hover:underline" target="_blank" rel="noreferrer">
              Open resource
            </a>
          </p>
        ) : null}

        {module.quiz && module.quiz.questions.length > 0 ? (
          <form action={submitMyQuiz} className="glass mt-8 flex flex-col gap-4 rounded-2xl p-6">
            <h2 className="font-display text-xl text-off-white/80">Quiz · pass {module.quiz.passThreshold}%</h2>
            <input type="hidden" name="quizId" value={module.quiz.id} />
            <input type="hidden" name="questionCount" value={module.quiz.questions.length} />
            {module.quiz.questions.map((question, i) => {
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
              await completeMyModule(module.id);
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
