"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type TripForm = {
  destination: string;
  days: string;
  interests: string;
  budget: string;
};

type TravelForm = {
  departureCity: string;
  stayArea: string;
  arrivalDate: string;
  arrivalTime: string;
  departureDate: string;
  departureTime: string;
};

const INITIAL_TRIP: TripForm = {
  destination: "",
  days: "5",
  interests: "",
  budget: "mid-range",
};

const INITIAL_TRAVEL: TravelForm = {
  departureCity: "",
  stayArea: "",
  arrivalDate: "",
  arrivalTime: "",
  departureDate: "",
  departureTime: "",
};

type Tab = "trip" | "travel";

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------
export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("trip");
  const [trip, setTrip] = useState<TripForm>(INITIAL_TRIP);
  const [travel, setTravel] = useState<TravelForm>(INITIAL_TRAVEL);
  const [itinerary, setItinerary] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  function handleTripChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setTrip((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleTravelChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setTravel((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
          departureCity: travel.departureCity,
          stayArea: travel.stayArea,
          arrivalDate: travel.arrivalDate,
          arrivalTime: travel.arrivalTime,
          departureDate: travel.departureDate,
          departureTime: travel.departureTime,
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
    setTravel(INITIAL_TRAVEL);
    setActiveTab("trip");
  }

  const canSubmit = !loading && trip.destination.trim().length > 0;
  const hasResult = itinerary.length > 0;

  // Count how many travel info fields are filled (for the badge)
  const travelFilled = Object.values(travel).filter((v) => v.trim().length > 0).length;

  return (
    <div className="page">
      {/* ── Header ── */}
      <header className="header">
        <div className="logo">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <circle cx="14" cy="14" r="13" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M9 19 L14 8 L19 19 M11 15.5 H17"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Trip Engineer</span>
        </div>
        <p className="tagline">AI-powered travel itineraries</p>
      </header>

      <main>
        {/* ── Form card with tabs ── */}
        <section className="form-card" aria-label="Trip planner">
          {/* Tab bar */}
          <div className="tab-bar" role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === "trip"}
              className={`tab ${activeTab === "trip" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("trip")}
              type="button"
            >
              Trip details
            </button>
            <button
              role="tab"
              aria-selected={activeTab === "travel"}
              className={`tab ${activeTab === "travel" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("travel")}
              type="button"
            >
              Travel info
              {travelFilled === 0 && <span className="tab-badge">optional</span>}
              {travelFilled > 0 && <span className="tab-badge tab-badge-filled">{travelFilled} added</span>}
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* ── Tab 1: Trip details ── */}
            <div role="tabpanel" hidden={activeTab !== "trip"} className="tab-panel">
              <div className="field">
                <label htmlFor="destination">Where are you going?</label>
                <input
                  id="destination"
                  name="destination"
                  type="text"
                  placeholder="Tokyo, Japan"
                  value={trip.destination}
                  onChange={handleTripChange}
                  required
                  autoComplete="off"
                  disabled={loading}
                />
              </div>

              <div className="field-row">
                <div className="field">
                  <label htmlFor="days">Number of days</label>
                  <select
                    id="days"
                    name="days"
                    value={trip.days}
                    onChange={handleTripChange}
                    disabled={loading}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 10, 14].map((n) => (
                      <option key={n} value={String(n)}>
                        {n} {n === 1 ? "day" : "days"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="budget">Budget</label>
                  <select
                    id="budget"
                    name="budget"
                    value={trip.budget}
                    onChange={handleTripChange}
                    disabled={loading}
                  >
                    <option value="budget">Budget</option>
                    <option value="mid-range">Mid-range</option>
                    <option value="luxury">Luxury</option>
                  </select>
                </div>
              </div>

              <div className="field">
                <label htmlFor="interests">
                  Interests <span className="label-hint">(optional)</span>
                </label>
                <textarea
                  id="interests"
                  name="interests"
                  rows={2}
                  placeholder="Street food, temples, architecture, live music…"
                  value={trip.interests}
                  onChange={handleTripChange}
                  disabled={loading}
                />
              </div>

              <div className="tab-nav">
                <button
                  type="button"
                  className="tab-next-btn"
                  onClick={() => setActiveTab("travel")}
                >
                  Add travel details →
                </button>
              </div>
            </div>

            {/* ── Tab 2: Travel info ── */}
            <div role="tabpanel" hidden={activeTab !== "travel"} className="tab-panel">

              <div className="section-label">Travelling from</div>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="departureCity">Departure city</label>
                  <input
                    id="departureCity"
                    name="departureCity"
                    type="text"
                    placeholder="Dublin, Ireland"
                    value={travel.departureCity}
                    onChange={handleTravelChange}
                    autoComplete="off"
                    disabled={loading}
                  />
                  <p className="field-hint">Used for travel time and jet lag context</p>
                </div>
                <div className="field">
                  <label htmlFor="stayArea">
                    Approximate stay area <span className="label-hint">(optional)</span>
                  </label>
                  <input
                    id="stayArea"
                    name="stayArea"
                    type="text"
                    placeholder="Shinjuku, near Senso-ji…"
                    value={travel.stayArea}
                    onChange={handleTravelChange}
                    autoComplete="off"
                    disabled={loading}
                  />
                  <p className="field-hint">Neighbourhood or hotel — optimises routing</p>
                </div>
              </div>

              <div className="section-label">Dates and times</div>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="arrivalDate">Arrival date</label>
                  <input
                    id="arrivalDate"
                    name="arrivalDate"
                    type="date"
                    value={travel.arrivalDate}
                    onChange={handleTravelChange}
                    disabled={loading}
                  />
                </div>
                <div className="field">
                  <label htmlFor="arrivalTime">
                    Arrival time <span className="label-hint">(local)</span>
                  </label>
                  <input
                    id="arrivalTime"
                    name="arrivalTime"
                    type="time"
                    value={travel.arrivalTime}
                    onChange={handleTravelChange}
                    disabled={loading}
                  />
                  <p className="field-hint">Day 1 activities start after this</p>
                </div>
              </div>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="departureDate">Departure date</label>
                  <input
                    id="departureDate"
                    name="departureDate"
                    type="date"
                    value={travel.departureDate}
                    onChange={handleTravelChange}
                    disabled={loading}
                  />
                </div>
                <div className="field">
                  <label htmlFor="departureTime">
                    Departure time <span className="label-hint">(local)</span>
                  </label>
                  <input
                    id="departureTime"
                    name="departureTime"
                    type="time"
                    value={travel.departureTime}
                    onChange={handleTravelChange}
                    disabled={loading}
                  />
                  <p className="field-hint">Last day winds down before this</p>
                </div>
              </div>

              <div className="weather-callout" aria-label="Weather note">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                  <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
                </svg>
                <span>Claude will include weather tips and seasonal advice based on your destination and travel dates.</span>
              </div>

              <div className="tab-nav tab-nav-split">
                <button
                  type="button"
                  className="back-btn"
                  onClick={() => setActiveTab("trip")}
                >
                  ← Back
                </button>
                {error && (
                  <p className="error" role="alert">
                    {error}
                  </p>
                )}
                <button type="submit" className="submit-btn" disabled={!canSubmit}>
                  {loading ? (
                    <><span className="spinner" aria-hidden="true" />Building…</>
                  ) : (
                    "Build my itinerary →"
                  )}
                </button>
              </div>
            </div>

            {/* ── Error + submit on tab 1 ── */}
            {activeTab === "trip" && (
              <div className="tab-submit">
                {error && <p className="error" role="alert">{error}</p>}
                <button type="submit" className="submit-btn" disabled={!canSubmit}>
                  {loading ? (
                    <><span className="spinner" aria-hidden="true" />Building…</>
                  ) : (
                    "Build my itinerary →"
                  )}
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
              <button className="reset-btn" onClick={handleReset}>
                Start over
              </button>
            </div>
            <div className="markdown-body">
              <ReactMarkdown>{itinerary}</ReactMarkdown>
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
            --error: #e06c5a;
            --error-bg: #2d1a17;
            --shadow: 0 1px 4px rgba(0,0,0,0.3), 0 0 0 0.5px rgba(255,255,255,0.04);
          }
        }

        html, body {
          min-height: 100vh;
          background: var(--bg);
          font-family: var(--font);
          color: var(--text);
          font-size: 16px;
          line-height: 1.6;
          -webkit-font-smoothing: antialiased;
        }

        .page {
          max-width: 680px;
          margin: 0 auto;
          padding: 2rem 1rem 4rem;
        }

        /* ── Header ── */
        .header { margin-bottom: 2rem; }

        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 20px;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 4px;
        }

        .tagline {
          font-size: 14px;
          color: var(--muted);
          margin-left: 38px;
        }

        /* ── Form card ── */
        .form-card {
          background: var(--surface);
          border: 0.5px solid var(--border);
          border-radius: 14px;
          box-shadow: var(--shadow);
          margin-bottom: 2rem;
          overflow: hidden;
        }

        /* ── Tabs ── */
        .tab-bar {
          display: flex;
          border-bottom: 0.5px solid var(--border);
        }

        .tab {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 12px 20px;
          font-size: 14px;
          font-family: var(--font);
          font-weight: 400;
          color: var(--muted);
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          transition: color 0.15s;
        }

        .tab-active {
          color: var(--text);
          font-weight: 500;
          border-bottom-color: var(--text);
        }

        .tab-badge {
          font-size: 11px;
          font-weight: 400;
          padding: 2px 7px;
          border-radius: 20px;
          background: var(--border);
          color: var(--muted);
        }

        .tab-badge-filled {
          background: var(--accent-light);
          color: var(--accent);
        }

        /* ── Tab panels ── */
        .tab-panel {
          padding: 1.5rem;
        }

        .section-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: var(--muted);
          margin-bottom: 1rem;
          padding-bottom: 8px;
          border-bottom: 0.5px solid var(--border);
        }

        /* ── Fields ── */
        .field { margin-bottom: 1.25rem; }

        .field-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 0;
        }

        .field-row .field { margin-bottom: 1.25rem; }

        label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 6px;
          color: var(--text);
        }

        .label-hint {
          font-weight: 400;
          color: var(--muted);
        }

        .field-hint {
          font-size: 12px;
          color: var(--muted);
          margin-top: 5px;
        }

        input[type="text"],
        input[type="date"],
        input[type="time"],
        select,
        textarea {
          width: 100%;
          padding: 9px 12px;
          font-size: 15px;
          font-family: var(--font);
          color: var(--text);
          background: var(--bg);
          border: 0.5px solid var(--border);
          border-radius: var(--radius);
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          -webkit-appearance: none;
        }

        input[type="date"],
        input[type="time"] {
          cursor: pointer;
        }

        select {
          cursor: pointer;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 32px;
        }

        textarea {
          resize: vertical;
          min-height: 72px;
        }

        input:focus,
        select:focus,
        textarea:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-light);
        }

        input:disabled,
        select:disabled,
        textarea:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* ── Weather callout ── */
        .weather-callout {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 10px 14px;
          background: var(--accent-light);
          border: 0.5px solid var(--accent);
          border-radius: var(--radius);
          font-size: 13px;
          color: var(--accent);
          margin-bottom: 1.25rem;
          line-height: 1.5;
        }

        .weather-callout svg {
          flex-shrink: 0;
          margin-top: 1px;
          stroke: var(--accent);
        }

        /* ── Tab navigation ── */
        .tab-nav {
          display: flex;
          justify-content: flex-end;
          padding-top: 0.5rem;
          border-top: 0.5px solid var(--border);
          margin-top: 0.5rem;
        }

        .tab-nav-split {
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
        }

        .tab-next-btn {
          font-size: 14px;
          font-family: var(--font);
          color: var(--accent);
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 0;
        }

        .tab-next-btn:hover { text-decoration: underline; }

        .back-btn {
          font-size: 14px;
          font-family: var(--font);
          color: var(--muted);
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 0;
        }

        .back-btn:hover { color: var(--text); }

        /* ── Submit area on tab 1 ── */
        .tab-submit {
          padding: 0 1.5rem 1.5rem;
        }

        /* ── Error ── */
        .error {
          font-size: 14px;
          color: var(--error);
          background: var(--error-bg);
          border: 0.5px solid var(--error);
          border-radius: var(--radius);
          padding: 10px 14px;
          margin-bottom: 1rem;
        }

        /* ── Submit button ── */
        .submit-btn {
          padding: 11px 24px;
          font-size: 15px;
          font-weight: 500;
          font-family: var(--font);
          color: #fff;
          background: var(--accent);
          border: none;
          border-radius: var(--radius);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
          transition: background 0.15s, opacity 0.15s;
        }

        .tab-submit .submit-btn { width: 100%; justify-content: center; }

        .submit-btn:hover:not(:disabled) { background: var(--accent-hover); }
        .submit-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        .spinner {
          width: 15px;
          height: 15px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Result ── */
        .result {
          background: var(--surface);
          border: 0.5px solid var(--border);
          border-radius: 14px;
          padding: 1.5rem;
          box-shadow: var(--shadow);
        }

        .result-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.25rem;
          padding-bottom: 1rem;
          border-bottom: 0.5px solid var(--border);
        }

        .result-header h2 { font-size: 17px; font-weight: 600; }

        .reset-btn {
          font-size: 13px;
          font-family: var(--font);
          color: var(--muted);
          background: none;
          border: 0.5px solid var(--border);
          border-radius: 6px;
          padding: 5px 10px;
          cursor: pointer;
          transition: color 0.15s, border-color 0.15s;
        }

        .reset-btn:hover { color: var(--text); border-color: var(--muted); }

        /* ── Markdown ── */
        .markdown-body h2 { font-size: 17px; font-weight: 600; margin: 1.5rem 0 0.6rem; color: var(--text); }
        .markdown-body h3 { font-size: 15px; font-weight: 600; margin: 1.1rem 0 0.4rem; color: var(--text); }
        .markdown-body p { font-size: 15px; line-height: 1.7; margin-bottom: 0.75rem; color: var(--text); }
        .markdown-body strong { font-weight: 600; }
        .markdown-body ul, .markdown-body ol { padding-left: 1.4rem; margin-bottom: 0.75rem; }
        .markdown-body li { font-size: 15px; line-height: 1.65; margin-bottom: 0.35rem; color: var(--text); }
        .markdown-body h2:first-child { margin-top: 0; }

        /* ── Mobile ── */
        @media (max-width: 480px) {
          .page { padding: 1.25rem 0.875rem 3rem; }
          .tab-panel { padding: 1.25rem; }
          .tab-submit { padding: 0 1.25rem 1.25rem; }
          .result { padding: 1.25rem; }
          .field-row { grid-template-columns: 1fr; gap: 0; }
          .tab-nav-split { flex-direction: column; align-items: stretch; }
          .tab-nav-split .submit-btn { justify-content: center; }
          .logo { font-size: 18px; }
        }
      `}</style>
    </div>
  );
}
