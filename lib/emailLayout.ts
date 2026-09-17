export type EmailContent = { subject: string; html: string };

/**
 * Shared branded email chrome — kept separate from send/build helpers so
 * editable templates can import without circular deps.
 *
 * Hub 0 (TriForge Media) outbound mail uses the streaming-kit orange-glow
 * wordmark. The file is public so Gmail/Outlook can fetch it without auth.
 */

export const SAMPLE_APP_URL = "https://hub.triforgemedia.com";

export function appOrigin(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || SAMPLE_APP_URL).replace(/\/$/, "");
}

export function emailLogoUrl(): string {
  return `${appOrigin()}/brand/email-logo.png`;
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function safeHref(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return escapeHtml(parsed.toString());
  } catch {
    return null;
  }
}

export function layout(bodyHtml: string): string {
  const origin = appOrigin();
  const logo = emailLogoUrl();
  return `<div style="font-family:'Segoe UI',Arial,sans-serif;background:#0A0A0A;padding:32px 16px;">
    <div style="max-width:520px;margin:0 auto;">
      <a href="${escapeHtml(origin)}" style="display:inline-block;margin:0 0 24px;text-decoration:none;">
        <img src="${escapeHtml(logo)}" alt="TriForge Media" width="220" height="110" style="display:block;width:220px;height:auto;border:0;outline:none;" />
      </a>
      <div style="background:#12121A;border:1px solid rgba(245,245,245,0.08);border-radius:16px;padding:32px;color:#F5F5F5;">
        ${bodyHtml}
      </div>
      <p style="color:rgba(245,245,245,0.35);font-size:12px;margin:20px 4px 0;">
        TriForge Media &middot; hub.triforgemedia.com
      </p>
    </div>
  </div>`;
}

export function button(url: string, label: string): string {
  return `<p style="margin:24px 0;"><a href="${safeHref(url) || "#"}" style="background:#FD4802;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;">${escapeHtml(label)}</a></p>`;
}
