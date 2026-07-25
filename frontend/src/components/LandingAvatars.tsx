const PEOPLE = [
  { name: "Ana Silva", role: "Design", tone: "bg-teal/15 text-teal" },
  { name: "Bruno Costa", role: "Foto", tone: "bg-sand/60 text-ink" },
  { name: "Carla Mendes", role: "Advocacia", tone: "bg-ink/10 text-ink" },
  { name: "Diego Rocha", role: "Dev", tone: "bg-teal/25 text-teal-deep" },
  { name: "Elisa Franco", role: "Arquitetura", tone: "bg-sand-warm/50 text-ink" },
];

export default function LandingAvatars() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {PEOPLE.map((p, i) => (
        <div
          key={p.name}
          className={`flex items-center gap-2.5 rounded-full border border-line bg-paper/80 py-1.5 pl-1.5 pr-4 shadow-[0_8px_24px_-14px_rgba(12,42,46,0.4)] ${
            i % 2 === 0 ? "animate-float" : ""
          }`}
          style={{ animationDelay: `${i * 0.6}s` }}
        >
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-full font-display text-sm font-semibold ${p.tone}`}
          >
            {p.name.slice(0, 1)}
          </span>
          <span className="text-sm">
            <span className="font-medium text-ink">{p.name}</span>
            <span className="ml-1.5 text-ink-soft/70">{p.role}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
