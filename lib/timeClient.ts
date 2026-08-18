/** Stamp naive datetime-local values as UTC ISO using the browser’s local zone. */

const NAIVE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

export function attachDeviceTimeZone(formData: FormData, fields: string[]) {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  if (tz) formData.set("timeZone", tz);

  for (const field of fields) {
    const raw = String(formData.get(field) || "").trim();
    if (!raw || !NAIVE.test(raw)) continue;
    if (/Z$/i.test(raw) || /[+-]\d{2}:\d{2}$/.test(raw)) continue;
    const local = new Date(raw);
    if (!Number.isNaN(local.getTime())) formData.set(field, local.toISOString());
  }
}
