"use client";

import MemberAvatar from "@/components/MemberAvatar";

export type DmPerson = {
  id: string;
  name: string;
  avatarUrl: string | null;
  initial: string;
};

export default function DmPeopleAvatars({
  people,
  size = 28,
}: {
  people: DmPerson[];
  size?: number;
}) {
  if (people.length === 0) {
    return (
      <MemberAvatar avatarUrl={null} initial="?" size={size} textSize="text-[11px]" />
    );
  }

  if (people.length === 1) {
    const person = people[0];
    return (
      <MemberAvatar
        avatarUrl={person.avatarUrl}
        initial={person.initial}
        size={size}
        textSize="text-[11px]"
      />
    );
  }

  const shown = people.slice(0, 2);
  const overlap = Math.round(size * 0.38);
  const width = size + overlap;
  const half = Math.round(size * 0.72);

  return (
    <div className="relative shrink-0" style={{ width, height: size }} aria-hidden>
      {shown.map((person, index) => (
        <div
          key={person.id}
          className="absolute overflow-hidden rounded-full ring-2 ring-[#0A0A0A]"
          style={{
            width: half,
            height: half,
            left: index === 0 ? 0 : overlap,
            top: index === 0 ? 0 : size - half,
            zIndex: index + 1,
          }}
        >
          <MemberAvatar
            avatarUrl={person.avatarUrl}
            initial={person.initial}
            size={half}
            textSize="text-[9px]"
          />
        </div>
      ))}
    </div>
  );
}
