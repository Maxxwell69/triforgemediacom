/**
 * Default styling for admin-authored lesson HTML (see lib/sanitizeHtml.ts).
 *
 * The container renders on an off-white "page" background rather than the
 * app's dark theme (see the `bg-off-white` wrapper everywhere this is used).
 * That matches the white canvas that tools like GoHighLevel's page/email
 * builder render on — lesson HTML pasted from those tools' "custom code"
 * blocks routinely leaves body text uncolored (relying on a white page
 * behind it) and only sets explicit background/text colors on the specific
 * sections that need to stand out (hero banners, dark "steps" cards, etc).
 * Rendering on our normal dark theme made that plain text unreadable
 * (dark-gray-on-charcoal) even though the author never intended it to sit on
 * a dark background at all.
 *
 * Deliberately does NOT set `color` on nested tags (h1-h6, p, li, blockquote,
 * strong...) the way Tailwind's `prose` plugin does. A CSS rule that directly
 * targets an element always wins over inherited color regardless of
 * specificity, so using `prose` there would stomp colors inherited from a
 * wrapping <div style="color: ...">. Charcoal is set on `.lesson-canvas` in
 * globals.css (not here) so unstyled copy inherits naturally on the light
 * card without also turning legal pages dark-on-dark.
 */
export const LESSON_CONTENT_CLASSES = [
  "font-body text-sm leading-relaxed",
  "[&_h1]:font-display [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:tracking-wide [&_h1]:mb-3 [&_h1]:mt-6",
  "[&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-wide [&_h2]:mb-2 [&_h2]:mt-5",
  "[&_h3]:font-display [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:tracking-wide [&_h3]:mb-2 [&_h3]:mt-4",
  "[&_p]:mb-3 [&_p:last-child]:mb-0",
  "[&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5",
  "[&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5",
  "[&_li]:mb-1",
  "[&_blockquote]:border-l-2 [&_blockquote]:border-orange/50 [&_blockquote]:pl-4 [&_blockquote]:italic",
  "[&_img]:max-w-full [&_img]:rounded-xl",
  "[&_table]:w-full [&_table]:border-collapse",
  "[&_th]:border [&_th]:border-charcoal/15 [&_th]:p-2 [&_th]:text-left",
  "[&_td]:border [&_td]:border-charcoal/15 [&_td]:p-2",
  "[&_hr]:my-4 [&_hr]:border-charcoal/15",
].join(" ");
