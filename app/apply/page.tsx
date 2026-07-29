"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { platformOptions } from "@/lib/validations/apply";
import { PLATFORM_LABELS as platformLabels } from "@/lib/platforms";
import { COUNTRY_OPTIONS } from "@/lib/applyTrack";

type FieldErrors = Partial<Record<string, string[]>>;

export default function ApplyPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setFieldErrors({});

    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: data.get("name"),
      email: data.get("email"),
      platform: data.get("platform"),
      handle: data.get("handle"),
      phone: data.get("phone"),
      smsConsent: data.get("smsConsent") === "on",
      socialLink: data.get("socialLink"),
      country: data.get("country"),
      goals: data.get("goals"),
      whyJoin: data.get("whyJoin"),
      hasAgency: data.get("hasAgency"),
    };

    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (!res.ok) {
        setFormError(result.error ?? "Something went wrong. Please try again.");
        setFieldErrors(result.issues ?? {});
        return;
      }

      const params = new URLSearchParams({
        track: result.track === "CN" ? "cn" : "mn",
        aid: result.applicationId ?? "",
      });
      if (result.mnReason) params.set("reason", result.mnReason);
      router.push(`/apply/thank-you?${params.toString()}`);
      return;
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16">
      <div className="w-full max-w-xl">
        <div className="mb-10 text-center">
          <h1 className="font-display text-5xl tracking-wide sm:text-6xl">
            APPLY FOR <span className="text-gradient">ACCESS</span>
          </h1>
          <p className="mt-3 font-body text-off-white/60">
            TriForge Community is invite-only. Tell us about you and we&apos;ll
            review your application.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass flex flex-col gap-5 rounded-2xl p-8">
          {formError && (
            <p className="rounded-lg border border-orange/30 bg-orange/10 px-4 py-3 text-sm font-body text-orange">
              {formError}
            </p>
          )}

          <Field label="Name" name="name" errors={fieldErrors.name}>
            <input
              id="name"
              name="name"
              type="text"
              required
              className={inputClass}
              placeholder="Jane Creator"
            />
          </Field>

          <Field label="Email" name="email" errors={fieldErrors.email}>
            <input
              id="email"
              name="email"
              type="email"
              required
              className={inputClass}
              placeholder="you@example.com"
            />
          </Field>

          <Field label="Main platform" name="platform" errors={fieldErrors.platform}>
            <select id="platform" name="platform" required defaultValue="" className={inputClass}>
              <option value="" disabled>
                Select a platform
              </option>
              {platformOptions.map((p) => (
                <option key={p} value={p}>
                  {platformLabels[p]}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Handle / username" name="handle" errors={fieldErrors.handle}>
            <input
              id="handle"
              name="handle"
              type="text"
              required
              className={inputClass}
              placeholder="@yourhandle"
            />
          </Field>

          <Field label="Phone number" name="phone" errors={fieldErrors.phone}>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              className={inputClass}
              placeholder="(555) 555-5555"
            />
          </Field>

          <label className="flex items-start gap-3 rounded-lg border border-off-white/10 bg-off-white/5 p-4">
            <input
              id="smsConsent"
              name="smsConsent"
              type="checkbox"
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-off-white/30 bg-transparent accent-orange"
            />
            <span className="font-body text-xs leading-relaxed text-off-white/60">
              By checking this box, I consent to receive non-marketing text messages from
              TriForgeMedia about transactions and events. Message frequency varies, message &amp;
              data rates may apply. Text HELP for assistance, reply STOP to opt out.
            </span>
          </label>

          <Field
            label="Link to your channel/profile (optional)"
            name="socialLink"
            errors={fieldErrors.socialLink}
          >
            <input
              id="socialLink"
              name="socialLink"
              type="url"
              className={inputClass}
              placeholder="https://..."
            />
          </Field>

          <Field label="Country" name="country" errors={fieldErrors.country}>
            <select id="country" name="country" required defaultValue="" className={inputClass}>
              <option value="" disabled>
                Select your country
              </option>
              {COUNTRY_OPTIONS.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
            <span className="mt-1.5 font-body text-xs text-off-white/45">
              Creators in the United States or Canada (with no agency) may join the Forge Creator
              Network. Everyone else is placed in the TriForge Media Network.
            </span>
          </Field>

          <Field label="What are your goals right now?" name="goals" errors={fieldErrors.goals}>
            <textarea
              id="goals"
              name="goals"
              required
              rows={3}
              className={inputClass}
              placeholder="Grow followers, post more consistently, land brand deals..."
            />
          </Field>

          <Field
            label="Why do you want to join TriForge Community?"
            name="whyJoin"
            errors={fieldErrors.whyJoin}
          >
            <textarea
              id="whyJoin"
              name="whyJoin"
              required
              rows={3}
              className={inputClass}
              placeholder="Tell us a bit about yourself and why this is a fit"
            />
          </Field>

          <Field
            label="Do you currently have an agency/management representing you as a live host?"
            name="hasAgency"
            errors={fieldErrors.hasAgency}
          >
            <select id="hasAgency" name="hasAgency" required defaultValue="" className={inputClass}>
              <option value="" disabled>
                Select one
              </option>
              <option value="no">No, I don&apos;t have an agency</option>
              <option value="yes">Yes, an agency already represents me</option>
            </select>
          </Field>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-lg bg-orange px-8 py-3 font-body font-semibold text-off-white shadow-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Submit application"}
          </button>
        </form>
      </div>
    </main>
  );
}

const inputClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-4 py-2.5 font-body text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60 focus:ring-1 focus:ring-cyan/60";

function Field({
  label,
  name,
  errors,
  children,
}: {
  label: string;
  name: string;
  errors?: string[];
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={name} className="flex flex-col gap-1.5">
      <span className="font-body text-sm font-medium text-off-white/80">{label}</span>
      {children}
      {errors?.map((err) => (
        <span key={err} className="font-body text-xs text-orange">
          {err}
        </span>
      ))}
    </label>
  );
}
