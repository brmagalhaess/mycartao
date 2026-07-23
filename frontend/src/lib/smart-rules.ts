export type SmartTarget = "card" | "portfolio" | "whatsapp";

export type SmartRule = {
  id: string;
  conditions: Record<string, unknown>;
  target: SmartTarget;
};

export const TARGET_LABELS: Record<SmartTarget, string> = {
  card: "Cartão",
  portfolio: "Portfólio",
  whatsapp: "WhatsApp",
};

export function formatSmartConditions(
  conditions: Record<string, unknown>,
): string {
  if (conditions.always === true) return "Sempre";
  const range = conditions.hour_range;
  if (
    Array.isArray(range) &&
    range.length === 2 &&
    typeof range[0] === "number" &&
    typeof range[1] === "number"
  ) {
    return `Horário ${range[0]}h–${range[1]}h`;
  }
  const start = conditions.hour_start;
  const end = conditions.hour_end;
  if (typeof start === "number" && typeof end === "number") {
    return `Horário ${start}h–${end}h`;
  }
  return JSON.stringify(conditions);
}

export function buildSmartConditions(
  always: boolean,
  hourStart: number,
  hourEnd: number,
): Record<string, unknown> {
  if (always) return { always: true };
  return { hour_range: [hourStart, hourEnd] };
}
