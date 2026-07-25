/**
 * Default styling for admin-authored lesson HTML (see lib/sanitizeHtml.ts).
 *
 * Deliberately does NOT set `color` on nested tags (h1-h6, p, li, blockquote,
 * strong...) the way Tailwind's `prose` plugin does. Rich HTML pasted from
 * tools like GoHighLevel/email builders often sets color on a wrapping <div>
 * and relies on child <p>/<strong> tags inheriting it. A CSS rule that
 * directly targets an element always wins over inherited color regardless
 * of specificity, so using `prose` there stomps those inherited colors.
 * Only `color` on the *container* is set here, so anything the author didn't
 * explicitly color still inherits naturally — matching normal browser behavior.
 */
export const LESSON_CONTENT_CLASSES = [
  "font-body text-sm leading-relaxed text-off-white/80",
  "[&_h1]:font-display [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:tracking-wide [&_h1]:mb-3 [&_h1]:mt-6",
  "[&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-wide [&_h2]:mb-2 [&_h2]:mt-5",
  "[&_h3]:font-display [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:tracking-wide [&_h3]:mb-2 [&_h3]:mt-4",
  "[&_p]:mb-3 [&_p:last-child]:mb-0",
  "[&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5",
  "[&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5",
  "[&_li]:mb-1",
  "[&_blockquote]:border-l-2 [&_blockquote]:border-cyan/40 [&_blockquote]:pl-4 [&_blockquote]:italic",
  "[&_a]:text-cyan [&_a]:underline",
  "[&_img]:max-w-full [&_img]:rounded-xl",
  "[&_table]:w-full [&_table]:border-collapse",
  "[&_th]:border [&_th]:border-off-white/15 [&_th]:p-2 [&_th]:text-left",
  "[&_td]:border [&_td]:border-off-white/15 [&_td]:p-2",
  "[&_hr]:my-4 [&_hr]:border-off-white/15",
].join(" ");
