import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Rate limiter — in-memory, per IP
// ---------------------------------------------------------------------------
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;

type RateLimitEntry = { count: number; windowStart: number };
const rateLimitMap = new Map<string, RateLimitEntry>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return false;
  }
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) return true;
  entry.count++;
  return false;
}

const anthropic = new Anthropic();

// ---------------------------------------------------------------------------
// Prompt builder — uses all fields when present
// ---------------------------------------------------------------------------
function buildPrompt(params: {
  destination: string;
  days: number;
  interests: string;
  budget: string;
  departureCity: string;
  stayArea: string;
  arrivalDate: string;
  arrivalTime: string;
  departureDate: string;
  departureTime: string;
}): string {
  const {
    destination, days, interests, budget,
    departureCity, stayArea,
    arrivalDate, arrivalTime,
    departureDate, departureTime,
  } = params;

  // Build optional context blocks so the prompt stays clean when fields are empty
  const originBlock = departureCity
    ? `- Travelling from: ${departureCity}`
    : "";

  const stayBlock = stayArea
    ? `- Staying in/near: ${stayArea} — optimise routing around this area`
    : "";

  const arrivalBlock =
    arrivalDate || arrivalTime
      ? `- Arrives: ${[arrivalDate, arrivalTime ? `at ${arrivalTime} local time` : ""].filter(Boolean).join(" ")} — do not schedule morning activities on Day 1 if arrival is afternoon or later`
      : "";

  const departureBlock =
    departureDate || departureTime
      ? `- Departs: ${[departureDate, departureTime ? `at ${departureTime} local time` : ""].filter(Boolean).join(" ")} — wind down the final day at least 3 hours before this`
      : "";

  const travelContext = [originBlock, stayBlock, arrivalBlock, departureBlock]
    .filter(Boolean)
    .join("\n");

  const travelSection = travelContext
    ? `\nTravel logistics:\n${travelContext}\n`
    : "";

  // Derive travel month for weather context
  const travelMonth = arrivalDate
    ? new Date(arrivalDate).toLocaleString("en", { month: "long" })
    : "";

  const weatherInstruction = `
## Weather and practical tips
- If the travel month is known (${travelMonth || "use your best estimate for a typical visit"}), describe what weather the traveller should expect: temperature range, rainfall, what to pack.
- Flag any seasonal considerations: typhoon season, monsoon, extreme heat, major holidays that affect crowds or closures.
- Keep this section concise — 4 to 6 bullet points.`;

  // Build day labels for the matrix — use real dates if known, otherwise "Day N"
  const matrixDayLabels = Array.from({ length: days }, (_, i) => {
    if (arrivalDate) {
      const d = new Date(arrivalDate);
      d.setDate(d.getDate() + i);
      const label = d.toLocaleDateString("en", { weekday: "short", day: "numeric", month: "short" });
      return `Day ${i + 1} – ${label}`;
    }
    return `Day ${i + 1}`;
  });

  const departureDayLabel = departureDate
    ? (() => {
        const d = new Date(departureDate);
        return `Departure – ${d.toLocaleDateString("en", { weekday: "short", day: "numeric", month: "short" })}`;
      })()
    : "";

  const matrixRowsExample = matrixDayLabels
    .map((label) => `| ${label} | [Morning anchor, 4 words] | [Afternoon anchor, 4 words] | [Evening anchor, 4 words] |`)
    .join("\n");

  const matrixDepartureRow = departureDayLabel
    ? `| ${departureDayLabel} | — Transfer to airport | — | — |`
    : "";

  return `You are Trip Engineer, an expert travel planner who creates detailed, practical itineraries.

Create a ${days}-day travel itinerary for ${destination}.

Traveller preferences:
- Interests: ${interests || "general sightseeing, local food, culture"}
- Budget level: ${budget}
${travelSection}
Format your response in this exact order:

## PART 1 — SUMMARY MATRIX

Start with a 2-sentence overview of the trip (no heading, just plain text).

Then immediately produce a summary matrix table with these exact columns:
| Day | Morning | Afternoon | Evening |
| --- | --- | --- | --- |
${matrixRowsExample}
${matrixDepartureRow}

Rules for the matrix:
- IMPORTANT: every table row must be on its own separate line — never collapse multiple rows onto one line
- Each cell must be 3–5 words maximum — lead with the boldest anchor activity for that slot
- If a slot is empty due to arrival/departure timing, write "—"
- If arrival is afternoon or later on Day 1, Morning cell should be "— Arrive & settle in"
- If departure is before noon on the last day, that row should show "— Transfer to airport" for all slots
- Do not use markdown bold inside table cells
- After the table, add a horizontal rule: ---

## PART 2 — DAY-BY-DAY DETAIL

For each day, use the heading: ## Day N: [Theme for the day]
Under each day, list 3–5 activities with:
  - A bold activity name
  - 1–2 sentences describing it and why it suits this trip
  - A practical tip (best time to visit, booking advice, cost range)
${stayArea ? "  - Where relevant, note walking distance or transit time from " + stayArea : ""}

## PART 3 — END SECTIONS (in this order)
${weatherInstruction}

## Getting there${departureCity ? ` from ${departureCity}` : ""}
- Main transport options to reach ${destination}
- Rough journey time and cost range
- Best way to get from the airport/station to ${stayArea || "the city centre"}

${days > 4 ? `## Quick-reference matrix
Repeat the summary matrix table here for easy reference on longer trips.` : ""}

Be specific — use real place names, real neighbourhoods, real restaurants. Do not use filler phrases like "a must-see" or "hidden gem".`;
}

// ---------------------------------------------------------------------------
// POST /api/generate-itinerary
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (isRateLimited(ip)) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please wait 15 minutes before trying again." }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  let params: {
    destination: string;
    days: number;
    interests: string;
    budget: string;
    departureCity: string;
    stayArea: string;
    arrivalDate: string;
    arrivalTime: string;
    departureDate: string;
    departureTime: string;
  };

  try {
    const body = await request.json();
    params = {
      destination: (body.destination ?? "").trim(),
      days: Math.min(Math.max(parseInt(body.days ?? "3", 10), 1), 14),
      interests: (body.interests ?? "").trim(),
      budget: (body.budget ?? "mid-range").trim(),
      departureCity: (body.departureCity ?? "").trim(),
      stayArea: (body.stayArea ?? "").trim(),
      arrivalDate: (body.arrivalDate ?? "").trim(),
      arrivalTime: (body.arrivalTime ?? "").trim(),
      departureDate: (body.departureDate ?? "").trim(),
      departureTime: (body.departureTime ?? "").trim(),
    };
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!params.destination) {
    return new Response(JSON.stringify({ error: "destination is required." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = anthropic.messages.stream({
          model: "claude-sonnet-4-5",
          max_tokens: 4096,
          messages: [{ role: "user", content: buildPrompt(params) }],
        });

        for await (const chunk of anthropicStream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(new TextEncoder().encode(chunk.delta.text));
          }
        }
        controller.close();
      } catch (error) {
        const message =
          error instanceof Anthropic.APIError
            ? `Anthropic API error: ${error.status}`
            : "An unexpected error occurred.";
        controller.enqueue(new TextEncoder().encode(`\n\nError: ${message}`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
