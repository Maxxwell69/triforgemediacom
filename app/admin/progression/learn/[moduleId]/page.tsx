import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProgressionModule } from "@/lib/progression/module";
import { saveQuiz, updateLearningModule } from "../../actions";
import ImageUploadField from "@/components/ImageUploadField";

export const dynamic = "force-dynamic";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

export default async function AdminProgressionModulePage({
  params,
}: {
  params: { moduleId: string };
}) {
  requireProgressionModule();
  const [learnModule, categories] = await Promise.all([
    prisma.progressionLearningModule.findUnique({
      where: { id: params.moduleId },
      include: { quiz: { include: { questions: { orderBy: { sortOrder: "asc" } } } } },
    }),
    prisma.progressionCategory.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  if (!learnModule) notFound();
  const questions = learnModule.quiz?.questions ?? [];
  const slots = Math.max(questions.length + 1, 3);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/admin/progression/learn" className="font-body text-sm text-off-white/50 hover:text-cyan">
        ← Modules
      </Link>
      <h1 className="mt-4 font-display text-4xl tracking-wide">{learnModule.title}</h1>
      <form action={updateLearningModule} className="glass mt-6 flex flex-col gap-3 rounded-2xl p-6">
        <input type="hidden" name="id" value={learnModule.id} />
        <select name="categoryId" defaultValue={learnModule.categoryId} className={fieldClass}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input name="title" defaultValue={learnModule.title} required className={fieldClass} />
        <textarea name="description" defaultValue={learnModule.description ?? ""} rows={2} className={fieldClass} />
        <textarea name="content" defaultValue={learnModule.content ?? ""} rows={5} className={fieldClass} />
        <input name="videoUrl" defaultValue={learnModule.videoUrl ?? ""} className={fieldClass} />
        <input name="linkUrl" defaultValue={learnModule.linkUrl ?? ""} className={fieldClass} />
        <ImageUploadField name="imageUrl" folder="progression-images" defaultValue={learnModule.imageUrl} />
        <select name="status" defaultValue={learnModule.status} className={fieldClass}>
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <button type="submit" className="self-start rounded-lg bg-orange px-6 py-2 font-body font-semibold text-off-white">
          Save module
        </button>
      </form>

      <form action={saveQuiz} className="glass mt-8 flex flex-col gap-4 rounded-2xl p-6">
        <h2 className="font-display text-xl text-off-white/80">Quiz</h2>
        <input type="hidden" name="moduleId" value={learnModule.id} />
        <input type="hidden" name="questionCount" value={slots} />
        <input
          name="passThreshold"
          type="number"
          min={1}
          max={100}
          defaultValue={learnModule.quiz?.passThreshold ?? 70}
          className={fieldClass}
        />
        {Array.from({ length: slots }).map((_, i) => {
          const q = questions[i];
          const options = Array.isArray(q?.options) ? (q.options as string[]) : [];
          return (
            <div key={i} className="rounded-xl border border-off-white/10 p-4">
              <p className="font-body text-xs text-off-white/40">Question {i + 1}</p>
              <input name={`q${i}_prompt`} defaultValue={q?.prompt ?? ""} placeholder="Prompt" className={`mt-2 ${fieldClass}`} />
              {[0, 1, 2, 3].map((n) => (
                <input
                  key={n}
                  name={`q${i}_opt${n}`}
                  defaultValue={options[n] ?? ""}
                  placeholder={`Option ${n + 1}`}
                  className={`mt-2 ${fieldClass}`}
                />
              ))}
              <input
                name={`q${i}_correct`}
                type="number"
                min={0}
                max={3}
                defaultValue={q?.correctIndex ?? 0}
                className={`mt-2 ${fieldClass}`}
              />
            </div>
          );
        })}
        <button type="submit" className="self-start rounded-lg border border-cyan/40 px-4 py-2 font-body text-sm text-cyan">
          Save quiz
        </button>
      </form>
    </main>
  );
}
