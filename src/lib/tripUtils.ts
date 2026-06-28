// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type StyleForm = {
  groupType: string;
  pace: string;
  atmosphere: string[];
  diningStyle: string;
  beverages: string[];
  shopping: string;
  transport: string;
};

// ---------------------------------------------------------------------------
// calcNights
// Returns the number of nights between two date strings, or null if invalid.
// ---------------------------------------------------------------------------
export function calcNights(arrival: string, departure: string): number | null {
  if (!arrival || !departure) return null;
  const a = new Date(arrival);
  const d = new Date(departure);
  if (isNaN(a.getTime()) || isNaN(d.getTime())) return null;
  return Math.round((d.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

// ---------------------------------------------------------------------------
// buildStylePreview
// Builds a human-readable prompt preview sentence from style selections.
// ---------------------------------------------------------------------------
export function buildStylePreview(style: StyleForm): string {
  const parts: string[] = [];

  if (style.groupType) {
    const labels: Record<string, string> = {
      solo: "Solo traveller",
      couple: "Couple",
      family: "Family with kids",
      group: "Group of friends",
    };
    parts.push(labels[style.groupType] ?? style.groupType);
  }

  if (style.pace) {
    const labels: Record<string, string> = {
      relaxed: "travelling at a relaxed pace with 1–2 highlights per day and long breaks",
      moderate: "travelling at a moderate pace with 3–4 activities per day",
      packed: "wanting a packed schedule to see as much as possible",
    };
    parts.push(labels[style.pace] ?? style.pace);
  }

  if (style.atmosphere.length > 0) {
    parts.push(`drawn to ${style.atmosphere.join(" and ")} destinations`);
  }

  if (style.diningStyle) {
    const labels: Record<string, string> = {
      local: "preferring local and casual dining",
      mixed: "enjoying a mix of casual and special meals",
      special: "seeking special dining experiences",
      veggie: "with a vegetarian or vegan focus",
    };
    parts.push(labels[style.diningStyle] ?? style.diningStyle)
  }

  if (style.beverages.length > 0 && !style.beverages.includes("none")) {
    parts.push(`with ${style.beverages.join(", ")} woven into each day`);
  }

  if (style.shopping && style.shopping !== "none") {
    const labels: Record<string, string> = {
      markets: "interested in local markets and independent shops",
      brands: "interested in quality flagship retail where it offers something better than home",
      casual: "open to shopping wherever looks interesting",
    };
    parts.push(labels[style.shopping] ?? style.shopping);
  }

  if (style.transport) {
    const labels: Record<string, string> = {
      transit: "preferring metro and public transit",
      walking: "preferring to walk everywhere possible",
      taxi: "happy to use taxis and rideshare",
      cycling: "preferring to cycle",
      car: "planning to hire a car",
    };
    parts.push(labels[style.transport] ?? style.transport);
  }

  if (parts.length === 0) return "";
  return parts.join(". ") + ".";
}
