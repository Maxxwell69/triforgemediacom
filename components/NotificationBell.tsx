import Link from "next/link";

export default function NotificationBell({ unread }: { unread: number }) {
  return (
    <Link
      href="/notifications"
      className="relative inline-flex items-center justify-center rounded-lg p-1.5 text-off-white/60 transition hover:bg-off-white/5 hover:text-off-white"
      aria-label={unread > 0 ? `${unread} unread notifications` : "Notifications"}
    >
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path
          d="M10 2.5a4.5 4.5 0 00-4.5 4.5v2.1L4 12.5h12l-1.5-3.4V7A4.5 4.5 0 0010 2.5zM8.2 15.2a1.8 1.8 0 003.6 0"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {unread > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 min-w-[16px] rounded-full bg-orange px-1 text-center font-body text-[10px] font-semibold leading-4 text-off-white">
          {unread > 99 ? "99+" : unread}
        </span>
      ) : null}
    </Link>
  );
}
