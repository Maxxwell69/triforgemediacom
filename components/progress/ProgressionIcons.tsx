export function IconPerson({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="3" />
      <path d="M5 19c1.2-3.2 3.8-5 7-5s5.8 1.8 7 5" />
    </svg>
  );
}

export function IconRecruit({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="10" cy="8" r="3" />
      <path d="M3.5 19c1-3 3.2-4.6 6.5-4.6 1.2 0 2.3.2 3.3.7" />
      <path d="M17 10v6M14 13h6" />
    </svg>
  );
}

export function IconChevronUp({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M6 14l6-6 6 6" />
    </svg>
  );
}

export function IconEngagementHost({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 6h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H10l-5 4v-4H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" />
    </svg>
  );
}

export function IconGamer({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 10.5c0-1.4 1.1-2.5 2.5-2.5h11c1.4 0 2.5 1.1 2.5 2.5v4c0 1.7-1.3 3-3 3h-1.2l-1.3-2H9.5L8.2 17H7c-1.7 0-3-1.3-3-3v-3.5Z" />
      <path d="M8 12h3M9.5 10.5v3" />
      <circle cx="15.2" cy="11.2" r="0.7" fill="currentColor" />
      <circle cx="17" cy="13" r="0.7" fill="currentColor" />
    </svg>
  );
}

export function IconShopOwner({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 8h12l-1.1 12H7.1L6 8Z" />
      <path d="M9 8V7a3 3 0 0 1 6 0v1" />
    </svg>
  );
}

export function IconMusician({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M10 18V7l9-2v11" />
      <circle cx="8" cy="18" r="2.4" />
      <circle cx="17" cy="16" r="2.4" />
    </svg>
  );
}

export function IconArtist({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M14.5 4.5l5 5-10.2 10.2H4.3v-5L14.5 4.5Z" />
      <path d="M12.8 6.2l5 5" />
    </svg>
  );
}

export function IconEducator({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 8l8-3 8 3-8 3-8-3Z" />
      <path d="M6 10.5V15c2.2 1.8 9.8 1.8 12 0v-4.5" />
      <path d="M20 10v6" />
    </svg>
  );
}

export function IconCommunityBuilder({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="8.5" cy="8" r="2.3" />
      <circle cx="15.5" cy="8.5" r="2" />
      <path d="M3.8 18c.8-2.8 2.8-4.2 4.7-4.2s3.9 1.4 4.7 4.2" />
      <path d="M13.2 18c.5-2 2-3.4 3.4-3.4S20.4 16 21 18" />
    </svg>
  );
}

export function IconForgeMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <rect x="1.5" y="1.5" width="45" height="45" rx="8" fill="#0A0A0A" stroke="#FD4802" strokeWidth="2" />
      <path fill="#F5F5F5" d="M16 13h16v4.2H21.5V21H30v4h-8.5v4.2H32V34H16V13Z" />
      <path fill="#FD4802" d="M28.2 11l3.4 12.6-12.8 14.2 2.2-8.4L32.4 15.2 28.2 11Z" />
    </svg>
  );
}

const SPECIALTY_ICONS: Record<string, (props: { className?: string }) => JSX.Element> = {
  "Engagement Host": IconEngagementHost,
  Gamer: IconGamer,
  "Shop Owner": IconShopOwner,
  Musician: IconMusician,
  Artist: IconArtist,
  Educator: IconEducator,
  "Community Builder": IconCommunityBuilder,
};

export function SpecialtyIcon({ name, className }: { name: string; className?: string }) {
  const Icon = SPECIALTY_ICONS[name] || IconEngagementHost;
  return <Icon className={className} />;
}
