"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteBroadcastDraftAction,
  generateDraftAction,
  pauseScheduledBroadcastAction,
  previewBroadcastAudienceAction,
  resumeScheduledBroadcastAction,
  saveBroadcastDraftAction,
  scheduleBroadcastAction,
  sendBroadcastAction,
} from "@/app/admin/broadcast/actions";
import { scoreBroadcastContent } from "@/lib/broadcastSpamScore";
import { formatBroadcastWhen, recurrenceLabel } from "@/lib/broadcastSchedule";
import BroadcastSpamScorePanel from "@/components/admin/BroadcastSpamScorePanel";

type Tag = { id: string; name: string };
type Group = { id: string; name: string };

export type BroadcastDraftItem = {
  id: string;
  subject: string;
  bodyText: string;
  audienceType: "ALL_MEMBERS" | "TAG" | "GROUP" | "SINGLE_USER" | "NETWORK_TRACK";
  audienceLabel: string;
  audienceTagId: string | null;
  audienceGroupId: string | null;
  audienceTrack: string | null;
  audienceEmail: string | null;
  updatedAt: string | Date;
  createdByName: string;
};

export type BroadcastScheduleItem = BroadcastDraftItem & {
  recurrence: "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";
  scheduleHour: number;
  scheduleMinute: number;
  scheduleWeekday: number | null;
  scheduleMonthDay: number | null;
  nextRunAt: string | Date | null;
  lastRunAt: string | Date | null;
  pausedAt: string | Date | null;
};

type AudiencePreview = {
  label: string;
  count: number;
  emails: string[];
  skippedUnsubscribed: number;
};

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

const PREVIEW_EMAIL_CAP = 200;
const WEEKDAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
] as const;
const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const MINUTES = [0, 15, 30, 45];

export default function BroadcastComposer({
  tags,
  groups,
  drafts,
  scheduled,
  aiConfigured,
}: {
  tags: Tag[];
  groups: Group[];
  drafts: BroadcastDraftItem[];
  scheduled: BroadcastScheduleItem[];
  aiConfigured: boolean;
}) {
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [audienceType, setAudienceType] = useState<
    "ALL_MEMBERS" | "TAG" | "GROUP" | "SINGLE_USER" | "NETWORK_TRACK"
  >("ALL_MEMBERS");
  const [tagId, setTagId] = useState(tags[0]?.id ?? "");
  const [groupId, setGroupId] = useState(groups[0]?.id ?? "");
  const [track, setTrack] = useState<"CN" | "MN">("CN");
  const [email, setEmail] = useState("");
  const [draftId, setDraftId] = useState<string | null>(null);
  const [editingScheduled, setEditingScheduled] = useState(false);
  const [recurrence, setRecurrence] = useState<"DAILY" | "WEEKLY" | "MONTHLY">("WEEKLY");
  const [scheduleHour, setScheduleHour] = useState(9);
  const [scheduleMinute, setScheduleMinute] = useState(0);
  const [scheduleWeekday, setScheduleWeekday] = useState(1);
  const [scheduleMonthDay, setScheduleMonthDay] = useState(1);

  const router = useRouter();
  const [generating, startGenerating] = useTransition();
  const [sending, startSending] = useTransition();
  const [savingDraft, startSavingDraft] = useTransition();
  const [scheduling, startScheduling] = useTransition();
  const [deletingDraftId, setDeletingDraftId] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [preview, setPreview] = useState<AudiencePreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const spamScore = useMemo(
    () => scoreBroadcastContent(subject, bodyText),
    [subject, bodyText]
  );

  const audienceInput = useMemo(() => {
    if (audienceType === "TAG") {
      if (!tagId) return null;
      return { audienceType: "TAG" as const, tagId };
    }
    if (audienceType === "GROUP") {
      if (!groupId) return null;
      return { audienceType: "GROUP" as const, groupId };
    }
    if (audienceType === "SINGLE_USER") {
      const trimmed = email.trim();
      if (!trimmed || !trimmed.includes("@")) return null;
      return { audienceType: "SINGLE_USER" as const, email: trimmed };
    }
    if (audienceType === "NETWORK_TRACK") {
      return { audienceType: "NETWORK_TRACK" as const, track };
    }
    return { audienceType: "ALL_MEMBERS" as const };
  }, [audienceType, tagId, groupId, track, email]);

  useEffect(() => {
    if (!audienceInput) {
      setPreview(null);
      setPreviewError(null);
      setPreviewLoading(false);
      return;
    }

    let cancelled = false;
    setPreviewLoading(true);
    setPreviewError(null);

    const handle = window.setTimeout(async () => {
      try {
        const result = await previewBroadcastAudienceAction(audienceInput);
        if (cancelled) return;
        if (result.error !== null) {
          setPreview(null);
          setPreviewError(result.error);
          return;
        }
        setPreview({
          label: result.label,
          count: result.count,
          emails: result.emails,
          skippedUnsubscribed: result.skippedUnsubscribed,
        });
        setPreviewError(null);
      } catch {
        if (!cancelled) {
          setPreview(null);
          setPreviewError("Couldn't load audience preview.");
        }
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [audienceInput]);

  function loadDraft(draft: BroadcastDraftItem) {
    setError(null);
    setSuccessMsg(null);
    setDraftId(draft.id);
    setEditingScheduled(false);
    setSubject(draft.subject);
    setBodyText(draft.bodyText);
    setAudienceType(draft.audienceType);
    if (draft.audienceType === "TAG" && draft.audienceTagId) setTagId(draft.audienceTagId);
    if (draft.audienceType === "GROUP" && draft.audienceGroupId) {
      setGroupId(draft.audienceGroupId);
    }
    if (draft.audienceType === "NETWORK_TRACK" && (draft.audienceTrack === "CN" || draft.audienceTrack === "MN")) {
      setTrack(draft.audienceTrack);
    }
    if (draft.audienceType === "SINGLE_USER") setEmail(draft.audienceEmail || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function loadSchedule(item: BroadcastScheduleItem) {
    loadDraft(item);
    setEditingScheduled(true);
    if (item.recurrence === "DAILY" || item.recurrence === "WEEKLY" || item.recurrence === "MONTHLY") {
      setRecurrence(item.recurrence);
    }
    setScheduleHour(item.scheduleHour);
    setScheduleMinute(item.scheduleMinute);
    if (item.scheduleWeekday != null) setScheduleWeekday(item.scheduleWeekday);
    if (item.scheduleMonthDay != null) setScheduleMonthDay(item.scheduleMonthDay);
  }

  function clearComposer() {
    setDraftId(null);
    setEditingScheduled(false);
    setSubject("");
    setBodyText("");
    setTopic("");
    setAudienceType("ALL_MEMBERS");
    setEmail("");
    setRecurrence("WEEKLY");
    setScheduleHour(9);
    setScheduleMinute(0);
    setScheduleWeekday(1);
    setScheduleMonthDay(1);
  }

  function handleGenerate() {
    setError(null);
    setSuccessMsg(null);
    startGenerating(async () => {
      const result = await generateDraftAction(topic);
      if (result.error !== null) {
        setError(result.error);
        return;
      }
      setSubject(result.subject);
      setBodyText(result.bodyText);
    });
  }

  function handleSaveDraft(formData: FormData) {
    setError(null);
    setSuccessMsg(null);
    startSavingDraft(async () => {
      const result = await saveBroadcastDraftAction(formData);
      if (result.error !== null) {
        setError(result.error);
        return;
      }
      setDraftId(result.draftId);
      setSuccessMsg("Draft saved — any admin can open and send it.");
      router.refresh();
    });
  }

  function handleSend(formData: FormData) {
    setError(null);
    setSuccessMsg(null);

    if (!spamScore.canSend) {
      setError(
        `Deliverability score ${spamScore.score}/100 is too low. Fix the issues below before sending.`
      );
      return;
    }

    const countLabel =
      preview && !previewLoading
        ? `${preview.count} recipient${preview.count === 1 ? "" : "s"} (${preview.label})`
        : audienceType === "ALL_MEMBERS"
          ? "all members (active + invited)"
          : audienceType === "TAG"
            ? `everyone tagged "${tags.find((t) => t.id === tagId)?.name}"`
            : audienceType === "GROUP"
              ? `everyone in "${groups.find((g) => g.id === groupId)?.name}"`
              : audienceType === "NETWORK_TRACK"
                ? track === "CN"
                  ? "everyone on the Creator Network (CN) track"
                  : "everyone on the Media Network (MN) track"
                : `${email}`;

    const extra = editingScheduled
      ? " This sends once now and keeps the recurring schedule."
      : " This can't be undone.";
    if (!confirm(`Send this email to ${countLabel}?${extra}`)) return;

    startSending(async () => {
      const result = await sendBroadcastAction(formData);
      if (result.error !== null) {
        setError(result.error);
        return;
      }
      const parts = [
        `Sent to ${result.sent} recipient${result.sent === 1 ? "" : "s"}.`,
      ];
      if (result.skippedUnsubscribed > 0) {
        parts.push(`Skipped ${result.skippedUnsubscribed} unsubscribed.`);
      }
      if (result.failed > 0) {
        parts.push(
          `${result.failed} failed${
            result.failedEmails.length
              ? ` (${result.failedEmails.join(", ")}${
                  result.failed > result.failedEmails.length ? ", …" : ""
                })`
              : ""
          }.`
        );
      }
      setSuccessMsg(parts.join(" "));
      clearComposer();
      router.refresh();
    });
  }

  function handleSchedule(formData: FormData) {
    setError(null);
    setSuccessMsg(null);

    if (!spamScore.canSend) {
      setError(
        `Deliverability score ${spamScore.score}/100 is too low. Fix the issues below before scheduling.`
      );
      return;
    }

    const when = recurrenceLabel({
      recurrence,
      hour: scheduleHour,
      minute: scheduleMinute,
      weekday: scheduleWeekday,
      monthDay: scheduleMonthDay,
    });
    if (!confirm(`Start sending this automatically — ${when}?`)) return;

    startScheduling(async () => {
      const result = await scheduleBroadcastAction(formData);
      if (result.error !== null) {
        setError(result.error);
        return;
      }
      const next = result.nextRunAt ? formatBroadcastWhen(new Date(result.nextRunAt)) : when;
      setSuccessMsg(`Recurring send is on. Next run ${next}.`);
      setDraftId(result.scheduleId);
      setEditingScheduled(true);
      router.refresh();
    });
  }

  async function handlePause(id: string) {
    setError(null);
    const result = await pauseScheduledBroadcastAction(id);
    if (result.error) setError(result.error);
    else {
      setSuccessMsg("Paused — it won’t send until you resume.");
      router.refresh();
    }
  }

  async function handleResume(id: string) {
    setError(null);
    const result = await resumeScheduledBroadcastAction(id);
    if (result.error) setError(result.error);
    else {
      setSuccessMsg("Resumed. Next send is scheduled in Eastern time.");
      router.refresh();
    }
  }

  async function handleDeleteDraft(id: string) {
    if (!confirm("Delete this draft? This can't be undone.")) return;
    setDeletingDraftId(id);
    setError(null);
    try {
      const result = await deleteBroadcastDraftAction(id);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (draftId === id) clearComposer();
      setSuccessMsg("Draft deleted.");
      router.refresh();
    } finally {
      setDeletingDraftId(null);
    }
  }

  const shownEmails = preview?.emails.slice(0, PREVIEW_EMAIL_CAP) ?? [];
  const hiddenEmailCount = preview ? Math.max(0, preview.count - shownEmails.length) : 0;

  return (
    <div className="flex flex-col gap-6">
      {drafts.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <h2 className="font-display text-xl tracking-wide text-off-white/80">
            Shared drafts
          </h2>
          <p className="mt-1 font-body text-xs text-off-white/45">
            Any admin can open a draft, edit it, and send.
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {drafts.map((draft) => {
              const active = draftId === draft.id && !editingScheduled;
              return (
                <div
                  key={draft.id}
                  className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
                    active
                      ? "border-cyan/40 bg-cyan/10"
                      : "border-off-white/10 bg-off-white/[0.03]"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate font-body font-semibold text-off-white">
                      {draft.subject || "(untitled)"}
                    </p>
                    <p className="mt-0.5 font-body text-xs text-off-white/45">
                      {draft.audienceLabel} · updated{" "}
                      {new Date(draft.updatedAt).toLocaleString([], {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}{" "}
                      · by {draft.createdByName}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => loadDraft(draft)}
                      className="rounded-lg border border-cyan/40 px-3 py-1.5 font-body text-xs font-semibold text-cyan transition hover:bg-cyan/10"
                    >
                      {active ? "Editing" : "Open"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteDraft(draft.id)}
                      disabled={deletingDraftId === draft.id}
                      className="rounded-lg border border-off-white/15 px-3 py-1.5 font-body text-xs text-off-white/50 transition hover:border-orange/40 hover:text-orange disabled:opacity-40"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {scheduled.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <h2 className="font-display text-xl tracking-wide text-off-white/80">
            Recurring sends
          </h2>
          <p className="mt-1 font-body text-xs text-off-white/45">
            Automatic Hub 0 broadcasts. Times are Eastern. Pause anytime without deleting the copy.
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {scheduled.map((item) => {
              const active = draftId === item.id && editingScheduled;
              const paused = Boolean(item.pausedAt);
              return (
                <div
                  key={item.id}
                  className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
                    active
                      ? "border-cyan/40 bg-cyan/10"
                      : "border-off-white/10 bg-off-white/[0.03]"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate font-body font-semibold text-off-white">
                      {item.subject || "(untitled)"}
                      {paused ? (
                        <span className="ml-2 font-body text-[10px] font-semibold uppercase tracking-wide text-orange">
                          Paused
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 font-body text-xs text-off-white/45">
                      {item.audienceLabel} ·{" "}
                      {recurrenceLabel({
                        recurrence: item.recurrence,
                        hour: item.scheduleHour,
                        minute: item.scheduleMinute,
                        weekday: item.scheduleWeekday,
                        monthDay: item.scheduleMonthDay,
                      })}
                      {item.nextRunAt && !paused
                        ? ` · next ${formatBroadcastWhen(new Date(item.nextRunAt))}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => loadSchedule(item)}
                      className="rounded-lg border border-cyan/40 px-3 py-1.5 font-body text-xs font-semibold text-cyan transition hover:bg-cyan/10"
                    >
                      {active ? "Editing" : "Open"}
                    </button>
                    {paused ? (
                      <button
                        type="button"
                        onClick={() => void handleResume(item.id)}
                        className="rounded-lg border border-off-white/15 px-3 py-1.5 font-body text-xs text-off-white/70 transition hover:border-cyan/40 hover:text-cyan"
                      >
                        Resume
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void handlePause(item.id)}
                        className="rounded-lg border border-off-white/15 px-3 py-1.5 font-body text-xs text-off-white/70 transition hover:border-orange/40 hover:text-orange"
                      >
                        Pause
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void handleDeleteDraft(item.id)}
                      disabled={deletingDraftId === item.id}
                      className="rounded-lg border border-off-white/15 px-3 py-1.5 font-body text-xs text-off-white/50 transition hover:border-orange/40 hover:text-orange disabled:opacity-40"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="glass flex flex-col gap-6 rounded-2xl p-6">
        {draftId && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-cyan/25 bg-cyan/5 px-3 py-2">
            <p className="font-body text-xs text-cyan">
              {editingScheduled
                ? "Editing a recurring send — update the schedule, send once now, or start a new email."
                : "Editing shared draft — save to update, or send when ready."}
            </p>
            <button
              type="button"
              onClick={clearComposer}
              className="font-body text-xs text-off-white/50 transition hover:text-off-white"
            >
              Start new instead
            </button>
          </div>
        )}

        <div>
          <h2 className="font-display text-xl tracking-wide text-off-white/80">
            1. Write or generate
          </h2>
          {!aiConfigured && (
            <p className="mt-1 font-body text-xs text-orange/80">
              AI drafting isn&apos;t configured yet &mdash; add OPENAI_API_KEY to enable the
              Generate button. You can still write the email by hand below.
            </p>
          )}
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={2}
              placeholder="Rough topic or bullet points, e.g. &quot;announce the new webinars feature, first one is Thursday&quot;"
              className={`${fieldClass} flex-1`}
            />
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating || !aiConfigured || topic.trim().length < 5}
              className="shrink-0 self-start rounded-lg border border-cyan/50 px-5 py-2 font-body text-sm font-semibold text-cyan transition hover:bg-cyan/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {generating ? "Generating..." : "✨ Generate with AI"}
            </button>
          </div>
        </div>

        <form className="flex flex-col gap-4">
          <input type="hidden" name="draftId" value={draftId ?? ""} />
          <input type="hidden" name="recurrence" value={recurrence} />
          <input type="hidden" name="scheduleHour" value={String(scheduleHour)} />
          <input type="hidden" name="scheduleMinute" value={String(scheduleMinute)} />
          <input type="hidden" name="scheduleWeekday" value={String(scheduleWeekday)} />
          <input type="hidden" name="scheduleMonthDay" value={String(scheduleMonthDay)} />
          <div>
            <h2 className="mb-2 font-display text-xl tracking-wide text-off-white/80">
              2. Review &amp; edit
            </h2>
            <input
              name="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              placeholder="Subject line"
              className={fieldClass}
            />
            <textarea
              name="bodyText"
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              rows={8}
              placeholder="Email body — separate paragraphs with a blank line"
              className={`${fieldClass} mt-2`}
            />
            {(subject.trim() || bodyText.trim()) && (
              <div className="mt-3">
                <BroadcastSpamScorePanel score={spamScore} />
              </div>
            )}
          </div>

          <div>
            <h2 className="mb-2 font-display text-xl tracking-wide text-off-white/80">
              3. Choose audience
            </h2>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { value: "ALL_MEMBERS", label: "All members" },
                  { value: "NETWORK_TRACK", label: "CN / MN track" },
                  { value: "TAG", label: "By tag" },
                  { value: "GROUP", label: "By group" },
                  { value: "SINGLE_USER", label: "Single user" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAudienceType(opt.value)}
                  className={`rounded-full border px-4 py-1.5 font-body text-xs font-semibold transition ${
                    audienceType === opt.value
                      ? "border-orange bg-orange text-off-white"
                      : "border-off-white/20 text-off-white/60 hover:border-off-white/40"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <input type="hidden" name="audienceType" value={audienceType} />

            {audienceType === "NETWORK_TRACK" && (
              <div className="mt-3 flex flex-col gap-2">
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { value: "CN", label: "Creator Network (CN)" },
                      { value: "MN", label: "Media Network (MN)" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setTrack(opt.value)}
                      className={`rounded-full border px-4 py-1.5 font-body text-xs font-semibold transition ${
                        track === opt.value
                          ? opt.value === "CN"
                            ? "border-orange bg-orange/20 text-orange"
                            : "border-cyan bg-cyan/20 text-cyan"
                          : "border-off-white/20 text-off-white/60 hover:border-off-white/40"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <input type="hidden" name="track" value={track} />
                <p className="font-body text-xs text-off-white/40">
                  Matches CN/MN tag, group membership, or application track — including invited
                  members who haven&apos;t signed up yet. Unsubscribed members are skipped.
                </p>
              </div>
            )}

            {audienceType === "TAG" && (
              <select
                name="tagId"
                value={tagId}
                onChange={(e) => setTagId(e.target.value)}
                className={`${fieldClass} mt-3 sm:w-64`}
              >
                {tags.length === 0 && <option value="">No tags yet</option>}
                {tags.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}

            {audienceType === "GROUP" && (
              <select
                name="groupId"
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className={`${fieldClass} mt-3 sm:w-64`}
              >
                {groups.length === 0 && <option value="">No groups yet</option>}
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            )}

            {audienceType === "SINGLE_USER" && (
              <input
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="member@example.com"
                className={`${fieldClass} mt-3 sm:w-64`}
              />
            )}

            <div className="mt-4 rounded-xl border border-off-white/10 bg-off-white/[0.03] p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-body text-[11px] font-semibold uppercase tracking-wide text-off-white/40">
                  Active emails this will send to
                </p>
                {previewLoading && (
                  <p className="font-body text-xs text-off-white/40">Loading preview…</p>
                )}
              </div>

              {audienceType === "SINGLE_USER" && !audienceInput && (
                <p className="mt-2 font-body text-sm text-off-white/45">
                  Enter a member email to preview.
                </p>
              )}

              {previewError && !previewLoading && (
                <p className="mt-2 font-body text-sm text-orange">{previewError}</p>
              )}

              {preview && !previewLoading && (
                <>
                  <p className="mt-2 font-body text-sm text-off-white/80">
                    <span className="font-semibold text-cyan">{preview.count}</span>
                    {" "}
                    recipient{preview.count === 1 ? "" : "s"}
                    <span className="text-off-white/40"> · {preview.label}</span>
                    {preview.skippedUnsubscribed > 0 && (
                      <span className="text-off-white/40">
                        {" "}
                        · {preview.skippedUnsubscribed} unsubscribed skipped
                      </span>
                    )}
                  </p>
                  {preview.count === 0 ? (
                    <p className="mt-2 font-body text-sm text-orange/80">
                      {preview.skippedUnsubscribed > 0
                        ? "Everyone in that audience has unsubscribed from announcement emails."
                        : "No recipients match that audience."}
                    </p>
                  ) : (
                    <ul className="mt-3 max-h-56 overflow-y-auto rounded-lg border border-off-white/10 bg-charcoal/40 px-3 py-2 font-body text-xs text-off-white/70">
                      {shownEmails.map((addr) => (
                        <li
                          key={addr}
                          className="border-b border-off-white/5 py-1.5 last:border-b-0"
                        >
                          {addr}
                        </li>
                      ))}
                    </ul>
                  )}
                  {hiddenEmailCount > 0 && (
                    <p className="mt-2 font-body text-xs text-off-white/40">
                      Showing first {PREVIEW_EMAIL_CAP} of {preview.count}. Full list will still
                      receive the send.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          <div>
            <h2 className="mb-2 font-display text-xl tracking-wide text-off-white/80">
              4. Recurring send
            </h2>
            <p className="font-body text-xs text-off-white/45">
              Automatic sends use Eastern Time. GitHub pings the hub about every 10 minutes, so
              the email goes out at or just after the time you pick.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(
                [
                  { value: "DAILY", label: "Daily" },
                  { value: "WEEKLY", label: "Weekly" },
                  { value: "MONTHLY", label: "Monthly" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRecurrence(opt.value)}
                  className={`rounded-full border px-4 py-1.5 font-body text-xs font-semibold transition ${
                    recurrence === opt.value
                      ? "border-cyan bg-cyan/20 text-cyan"
                      : "border-off-white/20 text-off-white/60 hover:border-off-white/40"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {recurrence === "WEEKLY" && (
              <div className="mt-3 flex flex-wrap gap-2">
                {WEEKDAYS.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => setScheduleWeekday(day.value)}
                    className={`rounded-full border px-3 py-1 font-body text-xs font-semibold transition ${
                      scheduleWeekday === day.value
                        ? "border-orange bg-orange/20 text-orange"
                        : "border-off-white/20 text-off-white/60 hover:border-off-white/40"
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            )}
            {recurrence === "MONTHLY" && (
              <label className="mt-3 flex items-center gap-2 font-body text-xs text-off-white/60">
                Day of month
                <select
                  value={scheduleMonthDay}
                  onChange={(e) => setScheduleMonthDay(Number(e.target.value))}
                  className={`${fieldClass} w-20`}
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2 font-body text-xs text-off-white/60">
              <span>Time</span>
              <select
                value={scheduleHour}
                onChange={(e) => setScheduleHour(Number(e.target.value))}
                className={`${fieldClass} w-28`}
              >
                {HOURS.map((hour) => (
                  <option key={hour} value={hour}>
                    {((hour + 11) % 12) + 1}:00 {hour >= 12 ? "PM" : "AM"}
                  </option>
                ))}
              </select>
              <select
                value={scheduleMinute}
                onChange={(e) => setScheduleMinute(Number(e.target.value))}
                className={`${fieldClass} w-20`}
              >
                {MINUTES.map((minute) => (
                  <option key={minute} value={minute}>
                    :{String(minute).padStart(2, "0")}
                  </option>
                ))}
              </select>
              <span>ET</span>
            </div>
            <p className="mt-2 font-body text-xs text-off-white/40">
              {recurrenceLabel({
                recurrence,
                hour: scheduleHour,
                minute: scheduleMinute,
                weekday: scheduleWeekday,
                monthDay: scheduleMonthDay,
              })}
            </p>
          </div>

          {error && (
            <p className="rounded-lg border border-orange/30 bg-orange/10 px-4 py-3 font-body text-sm text-orange">
              {error}
            </p>
          )}
          {successMsg && (
            <p className="rounded-lg border border-cyan/30 bg-cyan/10 px-4 py-3 font-body text-sm text-cyan">
              {successMsg}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              formAction={handleSend}
              disabled={
                sending ||
                savingDraft ||
                scheduling ||
                !subject.trim() ||
                !bodyText.trim() ||
                !spamScore.canSend ||
                previewLoading ||
                !preview ||
                preview.count === 0
              }
              className="rounded-lg bg-orange px-8 py-3 font-body font-semibold text-off-white shadow-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending
                ? "Sending..."
                : !spamScore.canSend && (subject.trim() || bodyText.trim())
                  ? "Fix deliverability to send"
                  : preview && preview.count > 0
                    ? `Send to ${preview.count} recipient${preview.count === 1 ? "" : "s"}`
                    : "Send broadcast"}
            </button>
            <button
              type="submit"
              formAction={handleSchedule}
              disabled={
                sending ||
                savingDraft ||
                scheduling ||
                !subject.trim() ||
                !bodyText.trim() ||
                !spamScore.canSend ||
                previewLoading ||
                !preview ||
                preview.count === 0
              }
              className="rounded-lg border border-cyan/40 px-6 py-3 font-body font-semibold text-cyan transition hover:bg-cyan/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {scheduling
                ? "Scheduling…"
                : editingScheduled
                  ? "Update recurring send"
                  : "Start recurring send"}
            </button>
            <button
              type="submit"
              formAction={handleSaveDraft}
              disabled={
                sending ||
                savingDraft ||
                scheduling ||
                editingScheduled ||
                !subject.trim() ||
                !audienceInput
              }
              className="rounded-lg border border-off-white/25 px-6 py-3 font-body font-semibold text-off-white/80 transition hover:border-cyan/40 hover:text-cyan disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingDraft ? "Saving…" : draftId ? "Update draft" : "Save as draft"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
