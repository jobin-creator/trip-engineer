import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Rate limiter and prompt builder — imported from shared utils
// ---------------------------------------------------------------------------
import { isRateLimited, buildPrompt, rateLimitMap } from "@/lib/routeUtils";

const anthropic = new Anthropic();

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
    groupType: string;
    pace: string;
    atmosphere: string[];
    diningStyle: string;
    beverages: string[];
    shopping: string;
    transport: string;
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
      groupType: (body.groupType ?? "").trim(),
      pace: (body.pace ?? "").trim(),
      atmosphere: Array.isArray(body.atmosphere) ? body.atmosphere.map(String) : [],
      diningStyle: (body.diningStyle ?? "").trim(),
      beverages: Array.isArray(body.beverages) ? body.beverages.map(String) : [],
      shopping: (body.shopping ?? "").trim(),
      transport: (body.transport ?? "").trim(),
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
