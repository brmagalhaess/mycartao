type Person = {
  name: string;
  role: string;
  company: string;
  accent: string;
  chip: string;
  dark?: boolean;
};

const PEOPLE: Person[] = [
  {
    name: "Ana Silva",
    role: "Designer de marca",
    company: "Estúdio Aurora",
    accent: "bg-teal",
    chip: "bg-teal/15 text-teal",
  },
  {
    name: "Bruno Costa",
    role: "Fotógrafo",
    company: "BC Fotografia",
    accent: "bg-ink",
    chip: "bg-sand/60 text-ink",
    dark: true,
  },
  {
    name: "Carla Mendes",
    role: "Advogada",
    company: "Mendes & Prado",
    accent: "bg-teal-deep",
    chip: "bg-ink/10 text-ink",
  },
  {
    name: "Diego Rocha",
    role: "Desenvolvedor",
    company: "Rocha Labs",
    accent: "bg-teal",
    chip: "bg-teal/25 text-teal-deep",
  },
  {
    name: "Elisa Franco",
    role: "Arquiteta",
    company: "EF Arquitetura",
    accent: "bg-ink",
    chip: "bg-sand-warm/50 text-ink",
    dark: true,
  },
  {
    name: "Felipe Nunes",
    role: "Personal trainer",
    company: "FN Performance",
    accent: "bg-teal-deep",
    chip: "bg-mist text-teal-deep",
  },
];

function MiniCard({ person }: { person: Person }) {
  const surface = person.dark
    ? "border-ink/20 bg-ink text-paper"
    : "border-line bg-paper text-ink";
  const soft = person.dark ? "text-paper/70" : "text-ink-soft/80";
  const row = person.dark
    ? "border-paper/15 bg-paper/10"
    : "border-line bg-mist/60";

  return (
    <div
      className={`w-64 shrink-0 rounded-xl border p-5 shadow-[0_16px_40px_-20px_rgba(12,42,46,0.4)] ${surface}`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-full font-display text-base font-semibold ${person.chip}`}
        >
          {person.name.slice(0, 1)}
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-base font-semibold tracking-tight">
            {person.name}
          </p>
          <p className={`truncate text-xs ${soft}`}>
            {person.role} · {person.company}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-1.5">
        {["WhatsApp", "Portfólio"].map((label) => (
          <div
            key={label}
            className={`flex items-center justify-between rounded-md border px-3 py-1.5 text-xs font-medium ${row}`}
          >
            {label}
            <span aria-hidden className={person.dark ? "text-sand" : "text-teal"}>
              →
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span
          className={`rounded-md px-3 py-1.5 text-xs font-semibold text-paper ${person.accent}`}
        >
          Salvar contato
        </span>
        <span
          aria-hidden
          className={`grid grid-cols-4 gap-[2px] rounded-sm border p-1 ${
            person.dark ? "border-paper/20" : "border-line"
          }`}
        >
          {[1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1].map((on, i) => (
            <span
              key={i}
              className={`h-[3px] w-[3px] rounded-[0.5px] ${
                on ? (person.dark ? "bg-paper" : "bg-ink") : "bg-transparent"
              }`}
            />
          ))}
        </span>
      </div>
    </div>
  );
}

export default function LandingCarousel() {
  return (
    <div className="marquee marquee-mask overflow-hidden">
      <div className="marquee-track flex gap-5 pr-5">
        {[...PEOPLE, ...PEOPLE].map((person, i) => (
          <MiniCard key={`${person.name}-${i}`} person={person} />
        ))}
      </div>
    </div>
  );
}
