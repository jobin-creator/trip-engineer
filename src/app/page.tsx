"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type TripForm = {
  destination: string;
  days: string;
  interests: string;
  budget: string;
  arrivalDate: string;
  departureDate: string;
};

type StyleForm = {
  groupType: string;          // single-select
  pace: string;               // single-select
  atmosphere: string[];       // multi-select, max 2
  diningStyle: string;        // single-select
  beverages: string[];        // multi-select
  shopping: string;           // single-select
  transport: string;          // single-select
};

type TravelForm = {
  departureCity: string;
  stayArea: string;
  arrivalTime: string;
  departureTime: string;
};

const INITIAL_TRIP: TripForm = {
  destination: "",
  days: "5",
  interests: "",
  budget: "mid-range",
  arrivalDate: "",
  departureDate: "",
};

const INITIAL_STYLE: StyleForm = {
  groupType: "",
  pace: "",
  atmosphere: [],
  diningStyle: "",
  beverages: [],
  shopping: "",
  transport: "",
};

const INITIAL_TRAVEL: TravelForm = {
  departureCity: "",
  stayArea: "",
  arrivalTime: "",
  departureTime: "",
};

type Tab = "trip" | "style" | "travel";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function calcNights(arrival: string, departure: string): number | null {
  if (!arrival || !departure) return null;
  const a = new Date(arrival);
  const d = new Date(departure);
  if (isNaN(a.getTime()) || isNaN(d.getTime())) return null;
  return Math.round((d.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

// Build a human-readable prompt preview from the style selections
function buildStylePreview(style: StyleForm): string {
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
    parts.push(labels[style.diningStyle] ?? style.diningStyle);
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

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

// Single-select pill button group
function PillGroup({
  value,
  options,
  onChange,
  disabled,
}: {
  value: string;
  options: { value: string; label: string; icon: string }[];
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="pill-group">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`pill ${value === opt.value ? "pill-selected" : ""}`}
          onClick={() => onChange(value === opt.value ? "" : opt.value)}
          disabled={disabled}
          aria-pressed={value === opt.value}
        >
          <span className="pill-icon">{opt.icon}</span>
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// Multi-select checkbox pill group
function CheckGroup({
  values,
  options,
  max,
  onChange,
  disabled,
}: {
  values: string[];
  options: { value: string; label: string; icon: string }[];
  max?: number;
  onChange: (v: string[]) => void;
  disabled?: boolean;
}) {
  function toggle(val: string) {
    if (values.includes(val)) {
      onChange(values.filter((v) => v !== val));
    } else {
      if (max && values.length >= max) return;
      onChange([...values, val]);
    }
  }

  return (
    <div className="pill-group">
      {options.map((opt) => {
        const selected = values.includes(opt.value);
        const capped = !!max && values.length >= max && !selected;
        return (
          <button
            key={opt.value}
            type="button"
            className={`pill pill-check ${selected ? "pill-selected" : ""} ${capped ? "pill-capped" : ""}`}
            onClick={() => toggle(opt.value)}
            disabled={disabled || capped}
            aria-pressed={selected}
          >
            <span className={`check-box ${selected ? "check-box-on" : ""}`}>
              {selected && (
                <svg width="9" height="7" viewBox="0 0 9 7" fill="none" aria-hidden="true">
                  <path d="M1 3.5L3.5 6L8 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </span>
            <span className="pill-icon">{opt.icon}</span>
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------
export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("trip");
  const [trip, setTrip] = useState<TripForm>(INITIAL_TRIP);
  const [style, setStyle] = useState<StyleForm>(INITIAL_STYLE);
  const [travel, setTravel] = useState<TravelForm>(INITIAL_TRAVEL);
  const [itinerary, setItinerary] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Derived
  const nights = calcNights(trip.arrivalDate, trip.departureDate);
  const dateError: string | null =
    nights !== null && nights < 0 ? "Departure date must be after arrival date." : null;
  const daysMismatch: number | null =
    nights !== null && nights > 0 && nights !== parseInt(trip.days, 10) ? nights : null;

  const stylePreview = buildStylePreview(style);
  const styleFilled = [
    style.groupType, style.pace, style.diningStyle, style.shopping, style.transport,
  ].filter(Boolean).length + style.atmosphere.length + style.beverages.length;

  const travelFilled = Object.values(travel).filter((v) => v.trim().length > 0).length;
  const canSubmit = !loading && trip.destination.trim().length > 0 && !dateError;

  function handleTripChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setTrip((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "arrivalDate" || name === "departureDate") {
        const arrival = name === "arrivalDate" ? value : prev.arrivalDate;
        const departure = name === "departureDate" ? value : prev.departureDate;
        const n = calcNights(arrival, departure);
        if (n !== null && n > 0) {
          if (!Array.from({ length: 14 }, (_, i) => i + 1).includes(n)) {
            updated.days = String(Math.min(Math.max(n, 1), 14));
          } else {
            updated.days = String(n);
          }
        }
      }
      return updated;
    });
  }

  function handleTravelChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTravel((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function syncDaysToDate() {
    if (nights !== null && nights > 0) {
      setTrip((prev) => ({ ...prev, days: String(Math.min(Math.max(nights, 1), 14)) }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (dateError) return;
    setError("");
    setItinerary("");
    setLoading(true);

    try {
      const response = await fetch("/api/generate-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: trip.destination,
          days: parseInt(trip.days, 10),
          interests: trip.interests,
          budget: trip.budget,
          arrivalDate: trip.arrivalDate,
          departureDate: trip.departureDate,
          departureCity: travel.departureCity,
          stayArea: travel.stayArea,
          arrivalTime: travel.arrivalTime,
          departureTime: travel.departureTime,
          // Style profile
          groupType: style.groupType,
          pace: style.pace,
          atmosphere: style.atmosphere,
          diningStyle: style.diningStyle,
          beverages: style.beverages,
          shopping: style.shopping,
          transport: style.transport,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? `Request failed (${response.status})`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No response body.");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setItinerary((prev) => prev + decoder.decode(value, { stream: true }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setItinerary("");
    setTrip(INITIAL_TRIP);
    setStyle(INITIAL_STYLE);
    setTravel(INITIAL_TRAVEL);
    setActiveTab("trip");
    setError("");
  }

  const hasResult = itinerary.length > 0;

  // Tab badge content
  const tripDone = trip.destination.trim().length > 0;

  return (
    <div className="page">
      {/* ── Header ── */}
      <header className="header">
        <div className="logo">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <circle cx="14" cy="14" r="13" stroke="currentColor" strokeWidth="1.5" />
            <path d="M9 19 L14 8 L19 19 M11 15.5 H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Trip Engineer</span>
        </div>
        <p className="tagline">AI-powered travel itineraries</p>
      </header>

      <main>
        <section className="form-card" aria-label="Trip planner">

          {/* ── Tab bar ── */}
          <div className="tab-bar" role="tablist">
            <button role="tab" aria-selected={activeTab === "trip"}
              className={`tab ${activeTab === "trip" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("trip")} type="button">
              Trip details
              {tripDone && <span className="tab-badge tab-badge-done">✓</span>}
            </button>
            <button role="tab" aria-selected={activeTab === "style"}
              className={`tab ${activeTab === "style" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("style")} type="button">
              Your style
              {styleFilled === 0
                ? <span className="tab-badge">optional</span>
                : <span className="tab-badge tab-badge-filled">{styleFilled} set</span>}
            </button>
            <button role="tab" aria-selected={activeTab === "travel"}
              className={`tab ${activeTab === "travel" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("travel")} type="button">
              Travel info
              {travelFilled === 0
                ? <span className="tab-badge">optional</span>
                : <span className="tab-badge tab-badge-filled">{travelFilled} added</span>}
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate>

            {/* ══════════════════════════════════════
                TAB 1 — Trip details
            ══════════════════════════════════════ */}
            <div role="tabpanel" hidden={activeTab !== "trip"} className="tab-panel">

              <div className="field">
                <label htmlFor="destination">Where are you going?</label>
                <input id="destination" name="destination" type="text"
                  placeholder="Tokyo, Japan" value={trip.destination}
                  onChange={handleTripChange} required autoComplete="off" disabled={loading} />
              </div>

              <div className="field-row">
                <div className="field">
                  <label htmlFor="arrivalDate">Arrival date <span className="label-hint">(optional)</span></label>
                  <input id="arrivalDate" name="arrivalDate" type="date"
                    value={trip.arrivalDate} onChange={handleTripChange}
                    disabled={loading} className={dateError ? "input-error" : ""} />
                </div>
                <div className="field">
                  <label htmlFor="departureDate">Departure date <span className="label-hint">(optional)</span></label>
                  <input id="departureDate" name="departureDate" type="date"
                    value={trip.departureDate} onChange={handleTripChange}
                    disabled={loading} className={dateError ? "input-error" : ""} />
                </div>
              </div>

              {dateError && (
                <div className="inline-error" role="alert">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {dateError}
                </div>
              )}

              {daysMismatch !== null && !dateError && (
                <div className="inline-warning" role="status">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  <span>Your dates span {daysMismatch} days but &ldquo;Number of days&rdquo; is set to {trip.days}.</span>
                  <button type="button" className="fix-btn" onClick={syncDaysToDate}>Set to {daysMismatch}</button>
                </div>
              )}

              <div className="field-row">
                <div className="field">
                  <label htmlFor="days">Number of days</label>
                  <select id="days" name="days" value={trip.days} onChange={handleTripChange} disabled={loading}>
                    {Array.from({ length: 14 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={String(n)}>{n} {n === 1 ? "day" : "days"}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="budget">Budget</label>
                  <select id="budget" name="budget" value={trip.budget} onChange={handleTripChange} disabled={loading}>
                    <option value="budget">Budget</option>
                    <option value="mid-range">Mid-range</option>
                    <option value="luxury">Luxury</option>
                  </select>
                </div>
              </div>

              <div className="field">
                <label htmlFor="interests">Interests <span className="label-hint">(optional)</span></label>
                <textarea id="interests" name="interests" rows={2}
                  placeholder="Street food, temples, architecture, live music…"
                  value={trip.interests} onChange={handleTripChange} disabled={loading} />
              </div>

              <div className="tab-nav">
                <button type="button" className="tab-next-btn" onClick={() => setActiveTab("style")}>
                  Add your travel style →
                </button>
              </div>
            </div>

            {/* ══════════════════════════════════════
                TAB 2 — Your style
            ══════════════════════════════════════ */}
            <div role="tabpanel" hidden={activeTab !== "style"} className="tab-panel">

              <p className="tab-intro">All optional — takes about 30 seconds. Shapes the itinerary without you having to type anything.</p>

              {/* Who's travelling */}
              <div className="style-section">
                <div className="section-label">Who&rsquo;s travelling</div>
                <PillGroup
                  value={style.groupType}
                  onChange={(v) => setStyle((p) => ({ ...p, groupType: v }))}
                  disabled={loading}
                  options={[
                    { value: "solo", label: "Solo", icon: "👤" },
                    { value: "couple", label: "Couple", icon: "💑" },
                    { value: "family", label: "Family with kids", icon: "👨‍👩‍👧" },
                    { value: "group", label: "Group of friends", icon: "👥" },
                  ]}
                />
              </div>

              {/* Pace & style */}
              <div className="style-section">
                <div className="section-label">Pace and style</div>

                <div className="style-field-label">Daily pace</div>
                <PillGroup
                  value={style.pace}
                  onChange={(v) => setStyle((p) => ({ ...p, pace: v }))}
                  disabled={loading}
                  options={[
                    { value: "relaxed", label: "Relaxed — 1–2 highlights", icon: "☕" },
                    { value: "moderate", label: "Moderate — 3–4 activities", icon: "🚶" },
                    { value: "packed", label: "Packed — maximise every day", icon: "🏃" },
                  ]}
                />

                <div className="style-field-label">
                  Atmosphere you love
                  <span className="multi-hint">choose up to 2</span>
                </div>
                <CheckGroup
                  values={style.atmosphere}
                  max={2}
                  onChange={(v) => setStyle((p) => ({ ...p, atmosphere: v }))}
                  disabled={loading}
                  options={[
                    { value: "historic", label: "Historic and walkable", icon: "🏛️" },
                    { value: "artistic", label: "Artistic and cultural", icon: "🎨" },
                    { value: "coastal", label: "Beach and coastal", icon: "🏖️" },
                    { value: "urban", label: "Modern and urban", icon: "🏙️" },
                    { value: "nature", label: "Nature and outdoors", icon: "🌿" },
                    { value: "offbeat", label: "Off the beaten path", icon: "🗺️" },
                  ]}
                />
                {style.atmosphere.length === 2 && (
                  <p className="field-hint">Maximum 2 selected — deselect one to change</p>
                )}
              </div>

              {/* Food & drink */}
              <div className="style-section">
                <div className="section-label">Food and drink</div>

                <div className="style-field-label">Dining style</div>
                <PillGroup
                  value={style.diningStyle}
                  onChange={(v) => setStyle((p) => ({ ...p, diningStyle: v }))}
                  disabled={loading}
                  options={[
                    { value: "local", label: "Local and casual", icon: "🍽️" },
                    { value: "mixed", label: "Mix — casual and special", icon: "🥂" },
                    { value: "special", label: "Special dining experiences", icon: "⭐" },
                    { value: "veggie", label: "Vegetarian / vegan focus", icon: "🌱" },
                  ]}
                />

                <div className="style-field-label">
                  Beverage preferences
                  <span className="multi-hint">multi-select</span>
                </div>
                <CheckGroup
                  values={style.beverages}
                  onChange={(v) => setStyle((p) => ({ ...p, beverages: v }))}
                  disabled={loading}
                  options={[
                    { value: "coffee", label: "Specialty coffee", icon: "☕" },
                    { value: "tea", label: "Tea and café culture", icon: "🍵" },
                    { value: "wine", label: "Wine and local drinks", icon: "🍷" },
                    { value: "beer", label: "Craft beer and pubs", icon: "🍺" },
                    { value: "nonalcoholic", label: "Non-alcoholic only", icon: "🥤" },
                    { value: "none", label: "Not a priority", icon: "—" },
                  ]}
                />
              </div>

              {/* Shopping */}
              <div className="style-section">
                <div className="section-label">Shopping</div>
                <PillGroup
                  value={style.shopping}
                  onChange={(v) => setStyle((p) => ({ ...p, shopping: v }))}
                  disabled={loading}
                  options={[
                    { value: "none", label: "Not interested", icon: "🚫" },
                    { value: "markets", label: "Local markets and independents", icon: "🛍️" },
                    { value: "brands", label: "Quality brands and flagships", icon: "🏬" },
                    { value: "casual", label: "Wherever looks interesting", icon: "👀" },
                  ]}
                />
                {style.shopping === "brands" && (
                  <p className="field-hint">Only suggested where the destination offers something better than home</p>
                )}
              </div>

              {/* Getting around */}
              <div className="style-section">
                <div className="section-label">Getting around</div>
                <PillGroup
                  value={style.transport}
                  onChange={(v) => setStyle((p) => ({ ...p, transport: v }))}
                  disabled={loading}
                  options={[
                    { value: "transit", label: "Metro and public transit", icon: "🚇" },
                    { value: "walking", label: "Walking as much as possible", icon: "🚶" },
                    { value: "taxi", label: "Taxis and rideshare", icon: "🚕" },
                    { value: "cycling", label: "Cycling", icon: "🚲" },
                    { value: "car", label: "Hiring a car", icon: "🚗" },
                  ]}
                />
                <p className="field-hint">Transit details only appear when the destination has good public transport</p>
              </div>

              {/* Prompt preview */}
              {stylePreview && (
                <div className="style-preview">
                  <div className="style-preview-label">How this shapes your itinerary</div>
                  <p>{stylePreview}</p>
                </div>
              )}

              <div className="tab-nav tab-nav-split">
                <button type="button" className="back-btn" onClick={() => setActiveTab("trip")}>← Back</button>
                <button type="button" className="tab-next-btn" onClick={() => setActiveTab("travel")}>Add travel info →</button>
              </div>
            </div>

            {/* ══════════════════════════════════════
                TAB 3 — Travel info
            ══════════════════════════════════════ */}
            <div role="tabpanel" hidden={activeTab !== "travel"} className="tab-panel">

              <div className="section-label">Travelling from</div>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="departureCity">Departure city</label>
                  <input id="departureCity" name="departureCity" type="text"
                    placeholder="Dublin, Ireland" value={travel.departureCity}
                    onChange={handleTravelChange} autoComplete="off" disabled={loading} />
                  <p className="field-hint">Used for travel time and jet lag context</p>
                </div>
                <div className="field">
                  <label htmlFor="stayArea">Approximate stay area <span className="label-hint">(optional)</span></label>
                  <input id="stayArea" name="stayArea" type="text"
                    placeholder="Shinjuku, near Senso-ji…" value={travel.stayArea}
                    onChange={handleTravelChange} autoComplete="off" disabled={loading} />
                  <p className="field-hint">Neighbourhood or hotel — optimises routing</p>
                </div>
              </div>

              <div className="section-label">Arrival and departure times</div>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="arrivalTime">Arrival time <span className="label-hint">(local)</span></label>
                  <input id="arrivalTime" name="arrivalTime" type="time"
                    value={travel.arrivalTime} onChange={handleTravelChange} disabled={loading} />
                  <p className="field-hint">Day 1 activities start after this</p>
                </div>
                <div className="field">
                  <label htmlFor="departureTime">Departure time <span className="label-hint">(local)</span></label>
                  <input id="departureTime" name="departureTime" type="time"
                    value={travel.departureTime} onChange={handleTravelChange} disabled={loading} />
                  <p className="field-hint">Last day winds down before this</p>
                </div>
              </div>

              <div className="weather-callout">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                  <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
                </svg>
                <span>Claude will include weather tips and seasonal advice based on your destination and travel dates.</span>
              </div>

              <div className="tab-nav tab-nav-split">
                <button type="button" className="back-btn" onClick={() => setActiveTab("style")}>← Back</button>
                {error && <p className="error" role="alert">{error}</p>}
                <button type="submit" className="submit-btn" disabled={!canSubmit}>
                  {loading ? <><span className="spinner" aria-hidden="true" />Building…</> : "Build my itinerary →"}
                </button>
              </div>
            </div>

            {/* ── Submit on tabs 1 and 2 ── */}
            {(activeTab === "trip" || activeTab === "style") && (
              <div className="tab-submit">
                {error && <p className="error" role="alert">{error}</p>}
                <button type="submit" className="submit-btn" disabled={!canSubmit}>
                  {loading ? <><span className="spinner" aria-hidden="true" />Building…</> : "Build my itinerary →"}
                </button>
              </div>
            )}

          </form>
        </section>

        {/* ── Result ── */}
        {hasResult && (
          <section className="result" aria-label="Generated itinerary" aria-live="polite">
            <div className="result-header">
              <h2>Your itinerary</h2>
              <button className="reset-btn" onClick={handleReset}>Start over</button>
            </div>
            <div className="markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{itinerary}</ReactMarkdown>
            </div>
          </section>
        )}
      </main>

      {/* ── Styles ── */}
      <style jsx global>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          --bg: #f7f6f2;
          --surface: #ffffff;
          --border: #e2e0d8;
          --text: #1a1916;
          --muted: #706e66;
          --accent: #1d5fc4;
          --accent-hover: #174ea3;
          --accent-light: #e8f0fd;
          --success: #1a7f4b;
          --success-bg: #eaf6f0;
          --warning: #92600a;
          --warning-bg: #fef9ec;
          --warning-border: #f0c84a;
          --error: #c0392b;
          --error-bg: #fdf0ee;
          --radius: 10px;
          --shadow: 0 1px 4px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.06);
        }

        @media (prefers-color-scheme: dark) {
          :root {
            --bg: #17161a;
            --surface: #21201f;
            --border: #2e2d2a;
            --text: #f0ede6;
            --muted: #908e85;
            --accent: #5b8dee;
            --accent-hover: #7aa3f2;
            --accent-light: #1e2a44;
            --success: #3ecf8e;
            --success-bg: #0d2b1e;
            --warning: #e8b84b;
            --warning-bg: #2a2210;
            --warning-border: #7a5a10;
            --error: #e06c5a;
            --error-bg: #2d1a17;
            --shadow: 0 1px 4px rgba(0,0,0,0.3), 0 0 0 0.5px rgba(255,255,255,0.04);
          }
        }

        html, body {
          min-height: 100vh; background: var(--bg); font-family: var(--font);
          color: var(--text); font-size: 16px; line-height: 1.6;
          -webkit-font-smoothing: antialiased;
        }

        .page { max-width: 680px; margin: 0 auto; padding: 2rem 1rem 4rem; }

        .header { margin-bottom: 2rem; }
        .logo { display: flex; align-items: center; gap: 10px; font-size: 20px; font-weight: 600; color: var(--text); margin-bottom: 4px; }
        .tagline { font-size: 14px; color: var(--muted); margin-left: 38px; }

        .form-card { background: var(--surface); border: 0.5px solid var(--border); border-radius: 14px; box-shadow: var(--shadow); margin-bottom: 2rem; overflow: hidden; }

        /* ── Tabs ── */
        .tab-bar { display: flex; border-bottom: 0.5px solid var(--border); overflow-x: auto; }
        .tab {
          display: flex; align-items: center; gap: 7px; padding: 12px 16px;
          font-size: 13px; font-family: var(--font); font-weight: 400; color: var(--muted);
          background: none; border: none; border-bottom: 2px solid transparent;
          cursor: pointer; transition: color 0.15s; white-space: nowrap;
        }
        .tab-active { color: var(--text); font-weight: 500; border-bottom-color: var(--text); }
        .tab-badge { font-size: 10px; font-weight: 400; padding: 2px 6px; border-radius: 20px; background: var(--border); color: var(--muted); }
        .tab-badge-filled { background: var(--accent-light); color: var(--accent); }
        .tab-badge-done { background: var(--success-bg); color: var(--success); }

        /* ── Tab panels ── */
        .tab-panel { padding: 1.5rem; }
        .tab-intro { font-size: 13px; color: var(--muted); margin-bottom: 1.25rem; }

        .section-label {
          font-size: 11px; font-weight: 600; text-transform: uppercase;
          letter-spacing: 0.07em; color: var(--muted);
          margin-bottom: 1rem; padding-bottom: 8px; border-bottom: 0.5px solid var(--border);
        }

        /* ── Style tab sections ── */
        .style-section { margin-bottom: 1.5rem; }
        .style-section .section-label { margin-bottom: 0.9rem; }
        .style-field-label {
          font-size: 13px; font-weight: 500; color: var(--text);
          margin-bottom: 8px; margin-top: 1rem; display: flex; align-items: center; gap: 8px;
        }
        .style-field-label:first-of-type { margin-top: 0; }
        .multi-hint {
          font-size: 10px; font-weight: 400; color: var(--muted);
          border: 0.5px solid var(--border); border-radius: 4px; padding: 2px 6px;
        }

        /* ── Pill buttons ── */
        .pill-group { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 0.25rem; }
        .pill {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 13px; font-family: var(--font); padding: 6px 13px;
          border-radius: 20px; border: 0.5px solid var(--border);
          background: var(--bg); color: var(--muted);
          cursor: pointer; transition: border-color 0.12s, background 0.12s, color 0.12s;
          line-height: 1;
        }
        .pill:hover:not(:disabled) { border-color: var(--accent); color: var(--text); }
        .pill-selected {
          border-color: var(--accent); background: var(--accent-light); color: var(--accent);
        }
        .pill-capped { opacity: 0.35; cursor: not-allowed; }
        .pill:disabled:not(.pill-capped) { opacity: 0.45; cursor: not-allowed; }
        .pill-icon { font-size: 14px; line-height: 1; }

        /* Checkbox pill */
        .pill-check { padding-left: 9px; }
        .check-box {
          width: 14px; height: 14px; border-radius: 3px; flex-shrink: 0;
          border: 0.5px solid var(--border); background: transparent;
          display: inline-flex; align-items: center; justify-content: center;
          transition: border-color 0.12s, background 0.12s;
        }
        .check-box-on { border-color: var(--accent); background: var(--accent); color: #fff; }

        /* ── Prompt preview ── */
        .style-preview {
          background: var(--bg); border: 0.5px solid var(--border);
          border-left: 3px solid var(--accent);
          border-radius: var(--radius); padding: 10px 14px;
          margin-top: 1.25rem;
        }
        .style-preview-label {
          font-size: 11px; font-weight: 600; text-transform: uppercase;
          letter-spacing: 0.06em; color: var(--accent); margin-bottom: 5px;
        }
        .style-preview p { font-size: 13px; color: var(--muted); line-height: 1.6; }

        /* ── Fields ── */
        .field { margin-bottom: 1.25rem; }
        .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .field-row .field { margin-bottom: 1.25rem; }
        label { display: block; font-size: 14px; font-weight: 500; margin-bottom: 6px; color: var(--text); }
        .label-hint { font-weight: 400; color: var(--muted); }
        .field-hint { font-size: 12px; color: var(--muted); margin-top: 5px; }

        input[type="text"], input[type="date"], input[type="time"], select, textarea {
          width: 100%; padding: 9px 12px; font-size: 15px; font-family: var(--font);
          color: var(--text); background: var(--bg); border: 0.5px solid var(--border);
          border-radius: var(--radius); outline: none;
          transition: border-color 0.15s, box-shadow 0.15s; -webkit-appearance: none;
        }
        input[type="date"], input[type="time"] { cursor: pointer; }
        select {
          cursor: pointer;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px;
        }
        textarea { resize: vertical; min-height: 72px; }
        input:focus, select:focus, textarea:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-light); }
        input.input-error, input.input-error:focus { border-color: var(--error); box-shadow: 0 0 0 3px var(--error-bg); }
        input:disabled, select:disabled, textarea:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ── Inline alerts ── */
        .inline-error, .inline-warning {
          display: flex; align-items: center; gap: 8px; font-size: 13px;
          border-radius: var(--radius); padding: 9px 12px; margin-bottom: 1rem; line-height: 1.4;
        }
        .inline-error { color: var(--error); background: var(--error-bg); border: 0.5px solid var(--error); }
        .inline-error svg { stroke: var(--error); flex-shrink: 0; }
        .inline-warning { color: var(--warning); background: var(--warning-bg); border: 0.5px solid var(--warning-border); flex-wrap: wrap; }
        .inline-warning svg { stroke: var(--warning); flex-shrink: 0; }
        .fix-btn {
          margin-left: auto; font-size: 12px; font-family: var(--font); font-weight: 500;
          color: var(--warning); background: none; border: 0.5px solid var(--warning-border);
          border-radius: 5px; padding: 3px 9px; cursor: pointer; white-space: nowrap;
        }
        .fix-btn:hover { background: var(--warning-border); color: #fff; }

        /* ── Weather callout ── */
        .weather-callout {
          display: flex; align-items: flex-start; gap: 10px; padding: 10px 14px;
          background: var(--accent-light); border: 0.5px solid var(--accent);
          border-radius: var(--radius); font-size: 13px; color: var(--accent);
          margin-bottom: 1.25rem; line-height: 1.5;
        }
        .weather-callout svg { flex-shrink: 0; margin-top: 1px; stroke: var(--accent); }

        /* ── Tab navigation ── */
        .tab-nav { display: flex; justify-content: flex-end; padding-top: 0.75rem; border-top: 0.5px solid var(--border); margin-top: 1rem; }
        .tab-nav-split { justify-content: space-between; align-items: center; }
        .tab-next-btn { font-size: 14px; font-family: var(--font); color: var(--accent); background: none; border: none; cursor: pointer; padding: 4px 0; }
        .tab-next-btn:hover { text-decoration: underline; }
        .back-btn { font-size: 14px; font-family: var(--font); color: var(--muted); background: none; border: none; cursor: pointer; padding: 4px 0; }
        .back-btn:hover { color: var(--text); }

        .tab-submit { padding: 0 1.5rem 1.5rem; }
        .error { font-size: 14px; color: var(--error); background: var(--error-bg); border: 0.5px solid var(--error); border-radius: var(--radius); padding: 10px 14px; margin-bottom: 1rem; }

        .submit-btn {
          padding: 11px 24px; font-size: 15px; font-weight: 500; font-family: var(--font);
          color: #fff; background: var(--accent); border: none; border-radius: var(--radius);
          cursor: pointer; display: flex; align-items: center; gap: 8px;
          white-space: nowrap; transition: background 0.15s, opacity 0.15s;
        }
        .tab-submit .submit-btn { width: 100%; justify-content: center; }
        .submit-btn:hover:not(:disabled) { background: var(--accent-hover); }
        .submit-btn:disabled { opacity: 0.55; cursor: not-allowed; }
        .spinner { width: 15px; height: 15px; border: 2px solid rgba(255,255,255,0.35); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Result ── */
        .result { background: var(--surface); border: 0.5px solid var(--border); border-radius: 14px; padding: 1.5rem; box-shadow: var(--shadow); }
        .result-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; padding-bottom: 1rem; border-bottom: 0.5px solid var(--border); }
        .result-header h2 { font-size: 17px; font-weight: 600; }
        .reset-btn { font-size: 13px; font-family: var(--font); color: var(--muted); background: none; border: 0.5px solid var(--border); border-radius: 6px; padding: 5px 10px; cursor: pointer; }
        .reset-btn:hover { color: var(--text); border-color: var(--muted); }

        /* ── Markdown ── */
        .markdown-body h2 { font-size: 17px; font-weight: 600; margin: 1.5rem 0 0.6rem; color: var(--text); }
        .markdown-body h3 { font-size: 15px; font-weight: 600; margin: 1.1rem 0 0.4rem; color: var(--text); }
        .markdown-body p { font-size: 15px; line-height: 1.7; margin-bottom: 0.75rem; color: var(--text); }
        .markdown-body strong { font-weight: 600; }
        .markdown-body ul, .markdown-body ol { padding-left: 1.4rem; margin-bottom: 0.75rem; }
        .markdown-body li { font-size: 15px; line-height: 1.65; margin-bottom: 0.35rem; color: var(--text); }
        .markdown-body h2:first-child { margin-top: 0; }
        .markdown-body table { width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 1.25rem; display: block; overflow-x: auto; }
        .markdown-body th { background: var(--bg); font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--muted); padding: 8px 12px; border: 0.5px solid var(--border); text-align: left; white-space: nowrap; }
        .markdown-body td { padding: 9px 12px; border: 0.5px solid var(--border); vertical-align: top; line-height: 1.5; color: var(--text); }
        .markdown-body tr:nth-child(even) td { background: var(--bg); }

        /* ── Mobile ── */
        @media (max-width: 480px) {
          .page { padding: 1.25rem 0.875rem 3rem; }
          .tab-panel { padding: 1.25rem; }
          .tab-submit { padding: 0 1.25rem 1.25rem; }
          .result { padding: 1.25rem; }
          .field-row { grid-template-columns: 1fr; gap: 0; }
          .tab-nav-split { flex-wrap: wrap; gap: 10px; }
          .tab-nav-split .submit-btn { flex: 1; justify-content: center; }
          .logo { font-size: 18px; }
          .pill { font-size: 12px; padding: 5px 11px; }
        }
      `}</style>
    </div>
  );
}
