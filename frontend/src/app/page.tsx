"use client";

import { useState } from "react";
import { analyzeOrder, AnalyzeOrderResponse, APIError } from "@/services/api";
import { DeliveryMap } from "@/components/DeliveryMap";

/* ── Mock order generator (Bangalore locations) ────────────────── */
const BANGALORE_LOCATIONS = [
  { name: "Koramangala", lat: 12.9352, lng: 77.6245 },
  { name: "Indiranagar", lat: 13.0206, lng: 77.64 },
  { name: "Whitefield", lat: 12.9698, lng: 77.75 },
  { name: "Jayanagar", lat: 12.9308, lng: 77.5838 },
  { name: "Electronic City", lat: 12.839, lng: 77.6778 },
  { name: "HSR Layout", lat: 12.9116, lng: 77.6389 },
  { name: "Marathahalli", lat: 12.9591, lng: 77.6974 },
  { name: "Yelahanka", lat: 13.1007, lng: 77.5963 },
];

function randomBetween(min: number, max: number) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function generateMockOrder() {
  const pick = BANGALORE_LOCATIONS[Math.floor(Math.random() * BANGALORE_LOCATIONS.length)];
  const distance = randomBetween(1, 12);
  const earnings = Math.round(randomBetween(30, 200));
  const orderId = "ORD" + Math.random().toString(36).substring(2, 8).toUpperCase();
  return {
    order_id: orderId,
    distance_km: distance,
    earnings,
    location: { lat: pick.lat, lng: pick.lng },
    timestamp: new Date().toISOString(),
    _area: pick.name,
  };
}

/* ── Main Page ──────────────────────────────────────────────────── */
export default function Home() {
  const [notification, setNotification] = useState<ReturnType<typeof generateMockOrder> | null>(null);
  const [report, setReport] = useState<AnalyzeOrderResponse | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* FR-1: Simulate Notification */
  const handleSimulate = () => {
    setReport(null);
    setNotification(generateMockOrder());
  };

  /* FR-3 / FR-4: Analyze */
  const handleAnalyze = async () => {
    if (!notification) return;
    setAnalyzing(true);
    setError(null);
    try {
      const res = await analyzeOrder({
        order_id: notification.order_id,
        distance_km: notification.distance_km,
        earnings: notification.earnings,
        location: notification.location,
        timestamp: notification.timestamp,
      });
      setReport(res);
    } catch (err: unknown) {
      // Type-safe error handling
      let errorMessage = "Analysis failed. Please try again.";
      
      if (err instanceof APIError) {
        if (err.status === 0) {
          errorMessage = `Network Error: Cannot reach backend. Please ensure the API server is running.`;
        } else if (err.status === 400) {
          errorMessage = `Invalid request: ${err.message}`;
        } else if (err.status === 408) {
          errorMessage = `Request timeout: ${err.message}`;
        } else if (err.status === 500) {
          errorMessage = `Server error: ${err.message}`;
        } else {
          errorMessage = `API Error (${err.status}): ${err.message}`;
        }
      } else if (err instanceof Error) {
        errorMessage = `Error: ${err.message}`;
      }
      
      console.error("Analysis error:", err);
      setError(errorMessage);
    } finally {
      setAnalyzing(false);
    }
  };

  /* FR-2: Dismiss */
  const handleDismiss = () => {
    setNotification(null);
    setReport(null);
    setError(null);
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 py-12"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)" }}>

      {/* ── Dynamic animated background ────────────────────────── */}
      {/* Floating gradient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="orb orb-4" />
        <div className="orb orb-5" />
      </div>

      {/* Subtle grid overlay */}
      <div className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }} />

      {/* Radial spotlight from center */}
      <div className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(99,102,241,0.12) 0%, transparent 100%)" }} />

      {/* ── Top-right Simulate Notification button ─────────────── */}
      <button
        id="simulate-notification-btn"
        onClick={handleSimulate}
        className="fixed top-6 right-6 z-50 rounded-2xl px-6 py-3 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-indigo-500/50 active:scale-95"
        style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
      >
        🔔 Simulate Notification
      </button>

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="z-10 mb-10 text-center">
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight"
          style={{ background: "linear-gradient(90deg, #818cf8, #c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Saathi
        </h1>
        <p className="mt-2 text-lg text-slate-400 font-medium">Har decision mein saath</p>
        <p className="mt-6 max-w-sm mx-auto text-sm text-slate-500">
          Click <span className="text-indigo-400 font-semibold">Simulate Notification</span> in the top-right to receive a mock Zomato order and analyze it instantly.
        </p>
      </header>

      {/* Error Display */}
      {error && (
        <div className="z-10 mt-6 w-full max-w-md rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-sm font-medium text-red-400">⚠️ {error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-3 w-full rounded-lg border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-400 transition-all hover:bg-red-500/5"
          >
            Dismiss
          </button>
        </div>
      )}
      {error && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={handleDismiss} />
      )}

      {/* FR-2: Notification Popup */}
      {notification && !report && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={handleDismiss}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative mx-4 w-full max-w-md rounded-3xl border border-white/10 p-8 shadow-2xl animate-fade-in"
            style={{ background: "linear-gradient(160deg, #1e293b, #0f172a)" }}
          >
            {/* Glow ring */}
            <div className="absolute -inset-px rounded-3xl opacity-30"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6, #6366f1)", filter: "blur(1px)" }} />
            <div className="relative z-10">
              <div className="mb-1 flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-widest text-green-400">New Order</span>
              </div>

              <h2 className="mt-4 text-2xl font-bold text-white">Zomato Order</h2>

              <div className="mt-6 space-y-4">
                <Row label="Order ID" value={notification.order_id} />
                <Row label="Distance" value={`${notification.distance_km} km`} />
                <Row label="Earnings" value={`₹${notification.earnings}`} />
                <Row label="Area" value={notification._area} />
              </div>

              <div className="mt-8 flex gap-3">
                {/* FR-3: Analyze Button */}
                <button
                  id="analyze-order-btn"
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="flex-1 rounded-xl px-6 py-3 text-base font-bold text-white shadow-lg transition-all duration-300 hover:scale-[1.03] active:scale-95 disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
                >
                  {analyzing ? "Analyzing…" : "⚡ Analyze"}
                </button>
                <button
                  id="dismiss-notification-btn"
                  onClick={handleDismiss}
                  className="flex-1 rounded-xl border border-white/10 px-6 py-3 text-base font-semibold text-slate-400 transition-all duration-300 hover:bg-white/5"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FR-6: Analysis Report */}
      {report && (
        <section className="z-10 mt-10 w-full max-w-md animate-fade-in">
          <div className="rounded-3xl border border-white/10 p-8 shadow-2xl"
            style={{ background: "linear-gradient(160deg, #1e293b, #0f172a)" }}>

            {/* Decision badge */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Analysis Report</h2>
              <span
                id="decision-badge"
                className="rounded-full px-5 py-1.5 text-sm font-extrabold uppercase tracking-wider"
                style={{
                  background: report.decision === "Accept"
                    ? "linear-gradient(135deg, #22c55e, #16a34a)"
                    : "linear-gradient(135deg, #ef4444, #dc2626)",
                  color: "#fff",
                }}
              >
                {report.decision}
              </span>
            </div>

            <div className="mt-6 space-y-5">
              <MetricCard
                id="earnings-per-hour"
                label="Earnings per Hour"
                value={`₹${report.earnings_per_hour}`}
                accent={report.decision === "Accept" ? "#22c55e" : "#ef4444"}
              />
              <MetricCard
                id="estimated-time"
                label="Estimated Time"
                value={`${report.estimated_time_minutes} min`}
                accent="#818cf8"
              />
              {report.suggested_relocation && (
                <div id="relocation-suggestion" className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">💡 Suggestion</p>
                  <p className="mt-1 text-sm text-amber-200">{report.suggested_relocation}</p>
                </div>
              )}
            </div>

              {/* Google Maps – delivery route */}
              {notification && (
                <div className="mt-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">📍 Delivery Route</p>
                  <DeliveryMap
                    deliveryLat={notification.location.lat}
                    deliveryLng={notification.location.lng}
                    areaName={notification._area}
                  />
                </div>
              )}

            <button
              onClick={handleDismiss}
              className="mt-8 w-full rounded-xl border border-white/10 py-3 text-sm font-semibold text-slate-400 transition-all hover:bg-white/5"
            >
              Close Report
            </button>
          </div>
        </section>
      )}

      {/* CSS keyframes & dynamic background animations */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.5s ease-out; }

        @keyframes float-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25%      { transform: translate(80px, -120px) scale(1.1); }
          50%      { transform: translate(-40px, -60px) scale(0.95); }
          75%      { transform: translate(60px, 40px) scale(1.05); }
        }
        @keyframes float-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%      { transform: translate(-100px, 80px) scale(1.15); }
          66%      { transform: translate(50px, -100px) scale(0.9); }
        }
        @keyframes float-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          20%      { transform: translate(120px, 60px) scale(1.08); }
          40%      { transform: translate(-60px, 140px) scale(0.92); }
          60%      { transform: translate(-120px, -40px) scale(1.12); }
          80%      { transform: translate(40px, -120px) scale(0.96); }
        }

        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          will-change: transform;
        }
        .orb-1 {
          width: 500px; height: 500px;
          top: -10%; left: -5%;
          background: radial-gradient(circle, rgba(99,102,241,0.25), transparent 70%);
          animation: float-1 18s ease-in-out infinite;
        }
        .orb-2 {
          width: 400px; height: 400px;
          top: 60%; right: -8%;
          background: radial-gradient(circle, rgba(139,92,246,0.20), transparent 70%);
          animation: float-2 22s ease-in-out infinite;
        }
        .orb-3 {
          width: 350px; height: 350px;
          bottom: -5%; left: 30%;
          background: radial-gradient(circle, rgba(34,197,94,0.12), transparent 70%);
          animation: float-3 25s ease-in-out infinite;
        }
        .orb-4 {
          width: 250px; height: 250px;
          top: 20%; right: 25%;
          background: radial-gradient(circle, rgba(244,114,182,0.10), transparent 70%);
          animation: float-1 20s ease-in-out infinite reverse;
        }
        .orb-5 {
          width: 300px; height: 300px;
          top: 45%; left: 10%;
          background: radial-gradient(circle, rgba(56,189,248,0.10), transparent 70%);
          animation: float-2 16s ease-in-out infinite reverse;
        }
      `}</style>
    </main>
  );
}

/* ── Small helper components ──────────────────────────────────── */
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-base font-semibold text-white">{value}</span>
    </div>
  );
}

function MetricCard({ id, label, value, accent }: { id: string; label: string; value: string; accent: string }) {
  return (
    <div id={id} className="rounded-2xl p-5" style={{ background: `${accent}10`, border: `1px solid ${accent}25` }}>
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: accent }}>{label}</p>
      <p className="mt-1 text-3xl font-extrabold text-white">{value}</p>
    </div>
  );
}
