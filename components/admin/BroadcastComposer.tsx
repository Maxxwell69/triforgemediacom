"use client";

import { useMemo, useState, useTransition } from "react";
import { generateDraftAction, sendBroadcastAction } from "@/app/admin/broadcast/actions";
import { scoreBroadcastContent } from "@/lib/broadcastSpamScore";
import BroadcastSpamScorePanel from "@/components/admin/BroadcastSpamScorePanel";

type Tag = { id: string; name: string };
type Group = { id: string; name: string };

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

export default function BroadcastComposer({
  tags,
  groups,
  aiConfigured,
}: {
  tags: Tag[];
  groups: Group[];
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

  const [generating, startGenerating] = useTransition();
  const [sending, startSending] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const spamScore = useMemo(
    () => scoreBroadcastContent(subject, bodyText),
    [subject, bodyText]
  );

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

  function handleSend(formData: FormData) {
    setError(null);
    setSuccessMsg(null);

    if (!spamScore.canSend) {
      setError(
        `Deliverability score ${spamScore.score}/100 is too low. Fix the issues below before sending.`
      );
      return;
    }

    const audienceLabel =
      audienceType === "ALL_MEMBERS"
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

    if (!confirm(`Send this email to ${audienceLabel}? This can't be undone.`)) return;

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
        parts.push(
          `Skipped ${result.skippedUnsubscribed} unsubscribed.`
        );
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
      setSubject("");
      setBodyText("");
      setTopic("");
    });
  }

  return (
    <div className="glass flex flex-col gap-6 rounded-2xl p-6">
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

      <form action={handleSend} className="flex flex-col gap-4">
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
            required
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

        <button
          type="submit"
          disabled={
            sending || !subject.trim() || !bodyText.trim() || !spamScore.canSend
          }
          className="self-start rounded-lg bg-orange px-8 py-3 font-body font-semibold text-off-white shadow-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sending
            ? "Sending..."
            : !spamScore.canSend && (subject.trim() || bodyText.trim())
              ? "Fix deliverability to send"
              : "Send broadcast"}
        </button>
      </form>
    </div>
  );
}
