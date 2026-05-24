import Link from "next/link";

type HobbyCard = {
  key: string;
  title: string;
  description: string;
  href?: string;
};

const hobbies: HobbyCard[] = [
  {
    key: "music",
    title: "music / albums",
    description: "A curated record collection.",
    href: "/hobbies/albums",
  },
  { key: "books", title: "books", description: "Reading list." },
  { key: "movies", title: "movies / tv", description: "Watchlist and favorites." },
  { key: "gaming", title: "gaming", description: "Games played and playing." },
  { key: "hiking", title: "hiking", description: "Trails and photo journals." },
  { key: "travel", title: "travel", description: "Places visited and travelogues." },
  { key: "woodworking", title: "woodworking", description: "Projects from the shop." },
  { key: "gardening", title: "gardening", description: "What's growing this season." },
  { key: "diy", title: "DIY", description: "Home projects and fixes." },
];

export default function HobbiesPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16 space-y-10">
      <div>
        <p className="text-[var(--muted)] text-sm mb-2">$ ls ./hobbies</p>
        <h1 className="text-2xl font-bold text-[var(--accent)]">## hobbies</h1>
      </div>

      <p className="text-[var(--muted)] text-sm leading-relaxed max-w-xl">
        Things I do when I&apos;m not at a keyboard. Some have pages already;
        others are still being scaffolded.
      </p>

      <ul className="grid gap-4 sm:grid-cols-2">
        {hobbies.map((hobby) => {
          const active = Boolean(hobby.href);
          const card = (
            <div
              className={`border rounded p-4 h-full transition-colors ${
                active
                  ? "border-[var(--border)] group-hover:border-[var(--accent)]"
                  : "border-[var(--border)] opacity-60"
              }`}
            >
              <div className="flex items-baseline gap-2">
                <span
                  className={`shrink-0 ${
                    active ? "text-[var(--accent)]" : "text-[var(--border)]"
                  }`}
                >
                  {active ? "$" : "#"}
                </span>
                <span
                  className={`font-medium ${
                    active
                      ? "text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors"
                      : "text-[var(--muted)]"
                  }`}
                >
                  {hobby.title}
                </span>
              </div>
              <p className="text-[var(--muted)] text-sm mt-2 pl-5">
                {active ? hobby.description : "coming soon..."}
              </p>
            </div>
          );

          return (
            <li key={hobby.key}>
              {hobby.href ? (
                <Link href={hobby.href} className="group block h-full">
                  {card}
                </Link>
              ) : (
                <div className="block h-full">{card}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
