"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Topbar } from "@/components/dashboard/topbar";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LiveLocationMap,
  SafeZone,
  TimelineEntry,
  CurrentLocation,
} from "@/components/dashboard/live-location-map";
import {
  MapPin,
  Navigation,
  Compass,
  Battery,
  Shield,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Plus,
  Trash2,
  Sparkles,
  Home,
  GraduationCap,
  BookOpen,
  Trees,
  Send,
  Loader2,
  ExternalLink,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const defaultCurrentLoc: CurrentLocation = {
  childId: "child_01",
  childName: "Aarav Sharma",
  lat: 37.7749,
  lng: -122.4194,
  placeName: "Home",
  currentZone: "Home",
  status: "inside_safe_zone",
  lastUpdated: new Date().toISOString(),
  batteryLevel: 84,
  speedKmh: 0,
  accuracyMeters: 5,
  isGpsActive: true,
};

export default function LocationPage() {
  const [currentLocation, setCurrentLocation] = useState<CurrentLocation>(defaultCurrentLoc);
  const [safeZones, setSafeZones] = useState<SafeZone[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeAlertBanner, setActiveAlertBanner] = useState<{
    title: string;
    detail: string;
    timestamp: string;
  } | null>(null);

  // Manual Check-in Form state
  const [manualPlace, setManualPlace] = useState("");
  const [manualEvent, setManualEvent] = useState("Reached Location Safely");
  const [manualIsAnomaly, setManualIsAnomaly] = useState(false);
  const [isSubmittingCheckin, setIsSubmittingCheckin] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  // Fetch location data from backend
  const fetchLocationData = useCallback(async (showRefreshingSpinner = false) => {
    if (showRefreshingSpinner) setIsRefreshing(true);
    try {
      const res = await fetch("/api/dashboard/location", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.currentLocation) {
          setCurrentLocation(data.currentLocation);
        }
        if (data.safeZones) {
          setSafeZones(data.safeZones);
        }
        if (data.locationTimeline) {
          setTimeline(data.locationTimeline);
        }
      }
    } catch (err) {
      console.error("Failed to load location data:", err);
    } finally {
      setIsLoading(false);
      if (showRefreshingSpinner) {
        setTimeout(() => setIsRefreshing(false), 400);
      }
    }
  }, []);

  useEffect(() => {
    fetchLocationData();
    // Poll every 20 seconds to keep synced
    const interval = setInterval(() => {
      fetchLocationData();
    }, 20000);
    return () => clearInterval(interval);
  }, [fetchLocationData]);

  // Handle movements triggered from simulator or map controls
  const handleTriggerMovement = async (params: {
    place: string;
    event: string;
    lat: number;
    lng: number;
    isAnomaly?: boolean;
  }) => {
    try {
      const res = await fetch("/api/dashboard/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.currentLocation) {
          setCurrentLocation(data.currentLocation);
        }
        if (data.safeZones) {
          setSafeZones(data.safeZones);
        }
        if (data.locationTimeline) {
          setTimeline(data.locationTimeline);
        }

        if (params.isAnomaly || data.riskEvaluation) {
          setActiveAlertBanner({
            title: `Geofence Anomaly: ${params.event}`,
            detail: `Aarav was detected outside normal bounds (${params.place}). The AI Risk Engine logged a telemetry incident and notified the Parent Dashboard.`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          });
        } else {
          setStatusFeedback(`Location updated: ${params.place} · ${params.event}`);
          setTimeout(() => setStatusFeedback(null), 3500);
        }
      }
    } catch (err) {
      console.error("Failed to trigger movement:", err);
    }
  };

  // Handle adding new safe zone
  const handleAddSafeZone = async (zone: Partial<SafeZone> & { name: string }) => {
    try {
      const res = await fetch("/api/dashboard/location", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(zone),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.safeZones) {
          setSafeZones(data.safeZones);
        }
        setStatusFeedback(`Safe zone "${zone.name}" created successfully.`);
        setTimeout(() => setStatusFeedback(null), 3500);
      }
    } catch (err) {
      console.error("Failed to add safe zone:", err);
    }
  };

  // Handle deleting safe zone
  const handleDeleteSafeZone = async (id: string) => {
    try {
      const res = await fetch(`/api/dashboard/location?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      if (res.ok) {
        const data = await res.json();
        if (data.safeZones) {
          setSafeZones(data.safeZones);
        }
        setStatusFeedback("Safe zone deleted.");
        setTimeout(() => setStatusFeedback(null), 3500);
      }
    } catch (err) {
      console.error("Failed to delete safe zone:", err);
    }
  };

  // Handle manual location checkpoint entry
  const handleManualCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPlace.trim()) return;

    setIsSubmittingCheckin(true);
    try {
      // Find matching safe zone or use current coords with small jitter
      const matched = safeZones.find(
        (z) => z.name.toLowerCase() === manualPlace.trim().toLowerCase()
      );
      const targetLat = matched ? matched.lat : currentLocation.lat + 0.003;
      const targetLng = matched ? matched.lng : currentLocation.lng + 0.003;

      await handleTriggerMovement({
        place: manualPlace.trim(),
        event: manualEvent,
        lat: targetLat,
        lng: targetLng,
        isAnomaly: manualIsAnomaly,
      });

      setManualPlace("");
      setManualIsAnomaly(false);
    } finally {
      setIsSubmittingCheckin(false);
    }
  };

  function getZoneCategoryIcon(type: SafeZone["type"]) {
    switch (type) {
      case "home":
        return <Home size={15} className="text-blue-500" />;
      case "school":
        return <GraduationCap size={15} className="text-amber-500" />;
      case "tuition":
        return <BookOpen size={15} className="text-purple-500" />;
      case "park":
        return <Trees size={15} className="text-emerald-500" />;
      default:
        return <MapPin size={15} className="text-pink-500" />;
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Topbar with GPS Status & Manual Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
              Geospatial Radar &amp; Geofencing
            </h1>
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span>Live GPS Active</span>
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">
            Continuous real-time tracking for Aarav Sharma · Automated departure alerts · Dynamic safe zones
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchLocationData(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground transition hover:bg-background shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin text-primary" : ""} />
            <span>{isRefreshing ? "Syncing..." : "Sync GPS"}</span>
          </button>
        </div>
      </div>

      {/* Anomaly / Alert Banner */}
      <AnimatePresence>
        {activeAlertBanner && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-start justify-between gap-4 rounded-2xl border border-danger/40 bg-danger/10 p-4 text-foreground shadow-md"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-danger text-white shadow-sm">
                <AlertTriangle size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-heading text-sm font-bold text-danger">
                    {activeAlertBanner.title}
                  </h4>
                  <span className="rounded-md bg-danger/20 px-2 py-0.5 text-[10px] font-bold text-danger">
                    {activeAlertBanner.timestamp}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted leading-relaxed">
                  {activeAlertBanner.detail}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/dashboard/alerts"
                className="flex items-center gap-1 rounded-xl bg-danger px-3 py-1.5 text-xs font-bold text-white transition hover:bg-danger/90"
              >
                <span>View Risk Incident</span>
                <ExternalLink size={12} />
              </Link>
              <button
                onClick={() => setActiveAlertBanner(null)}
                className="rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-muted hover:text-foreground"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Feedback Toast Banner */}
      <AnimatePresence>
        {statusFeedback && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
          >
            <CheckCircle2 size={15} />
            <span>{statusFeedback}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Device Telemetry Strip (4 Metrics) */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Current Status */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">Current Child Location</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <Navigation size={14} />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-lg font-bold font-heading text-foreground">
              {currentLocation.placeName}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${
                currentLocation.status === "inside_safe_zone"
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
              }`}
            >
              {currentLocation.status.replace(/_/g, " ")}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted">
            Coordinates: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
          </p>
        </div>

        {/* Metric 2: GPS Precision & Hardware */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">GPS Precision</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <Compass size={14} />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-lg font-bold font-heading text-foreground">
              ±{currentLocation.accuracyMeters}m
            </span>
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              High Precision
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted">
            Current Speed: {currentLocation.speedKmh} km/h · Satellites: 9 Locked
          </p>
        </div>

        {/* Metric 3: Battery & Device Health */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">Child Device Battery</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Battery size={14} />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-lg font-bold font-heading text-foreground">
              {currentLocation.batteryLevel}%
            </span>
            <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
              iPhone 13 · Good
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted">
            Telemetry sync: {new Date(currentLocation.lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>

        {/* Metric 4: Geofence Shield Status */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">Geofence Shield</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
              <Shield size={14} />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-lg font-bold font-heading text-foreground">
              {safeZones.length} Safe Zones
            </span>
            <span className="rounded-full bg-purple-500/15 px-2 py-0.5 text-[10px] font-bold text-purple-600 dark:text-purple-400">
              Active Shield
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted">
            Automated alerts on unexpected departures enabled
          </p>
        </div>
      </div>

      {/* High-Fidelity Interactive Map Visualizer */}
      <LiveLocationMap
        currentLocation={currentLocation}
        safeZones={safeZones}
        timeline={timeline}
        onTriggerMovement={handleTriggerMovement}
        onAddSafeZone={handleAddSafeZone}
        onDeleteSafeZone={handleDeleteSafeZone}
      />

      {/* Two Column Section: Safe Zones Manager & Today's Journey Timeline */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left Column (3 cols): Safe Zones Management */}
        <div className="space-y-4 lg:col-span-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading text-base font-bold text-foreground">
                Configured Safe Zones
              </h3>
              <p className="text-xs text-muted">
                Designated safe perimeters with automated departure and arrival tracking.
              </p>
            </div>
            <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
              {safeZones.length} Active Geofences
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {safeZones.map((zone) => {
              const isChildHere =
                currentLocation.placeName.toLowerCase() === zone.name.toLowerCase() ||
                zone.status === "inside";

              return (
                <div
                  key={zone.id}
                  className={`group relative overflow-hidden rounded-2xl border p-4 transition-all shadow-sm ${
                    isChildHere
                      ? "border-primary/50 bg-primary/5 shadow-md"
                      : "border-border bg-card hover:border-border/80"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-background border border-border shadow-xs">
                        {getZoneCategoryIcon(zone.type)}
                      </div>
                      <div>
                        <h4 className="font-heading text-sm font-bold text-foreground">
                          {zone.name}
                        </h4>
                        <span className="text-[11px] text-muted capitalize">
                          {zone.type} · {zone.radiusMeters}m radius
                        </span>
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${
                        isChildHere
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : zone.status === "left"
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          : "bg-slate-100 dark:bg-slate-800 text-muted"
                      }`}
                    >
                      {isChildHere ? "Inside Now" : zone.status}
                    </span>
                  </div>

                  <p className="mt-2.5 text-xs text-muted line-clamp-1">
                    {zone.address || "Configured location boundary"}
                  </p>

                  <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2.5 text-[11px] text-muted">
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      <span>{zone.lastEvent}</span>
                    </div>

                    <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100">
                      <button
                        onClick={() =>
                          handleTriggerMovement({
                            place: zone.name,
                            event: `Reached ${zone.name}`,
                            lat: zone.lat,
                            lng: zone.lng,
                          })
                        }
                        className="rounded-lg border border-primary/30 bg-primary/10 px-2 py-1 text-[11px] font-bold text-primary hover:bg-primary hover:text-white transition"
                        title="Simulate child check-in to this safe zone"
                      >
                        Check-in
                      </button>

                      <button
                        onClick={() => handleDeleteSafeZone(zone.id)}
                        className="rounded-lg border border-border p-1 text-muted hover:border-danger/40 hover:text-danger transition"
                        title="Delete Safe Zone"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted">
            <Info size={16} className="text-primary shrink-0" />
            <span>
              Geofences automatically push alerts if Aarav enters or departs without a scheduled calendar event.
            </span>
          </div>
        </div>

        {/* Right Column (2 cols): Today's Journey Timeline & Quick Check-in */}
        <div className="space-y-4 lg:col-span-2">
          {/* Timeline Card */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-primary" />
                <h3 className="font-heading text-sm font-bold text-foreground">
                  Today&apos;s Travel Timeline
                </h3>
              </div>
              <span className="text-[11px] text-muted font-medium">
                {timeline.length} Records Logged
              </span>
            </div>

            <div className="max-h-[340px] overflow-y-auto pr-1">
              <ol className="relative ml-2 space-y-4 border-l border-border pl-4">
                {timeline.map((item, index) => (
                  <li key={item.id || `${item.time}-${index}`} className="relative group">
                    <span
                      className={`absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-background ${
                        item.isAnomaly ? "bg-danger animate-ping" : "bg-primary"
                      }`}
                    />
                    <div className="flex items-baseline justify-between gap-2">
                      <p
                        className={`text-xs font-bold ${
                          item.isAnomaly ? "text-danger" : "text-foreground"
                        }`}
                      >
                        {item.event}
                      </p>
                      <span className="text-[10px] text-muted shrink-0">{item.time}</span>
                    </div>

                    <p className="text-[11px] text-muted flex items-center gap-1.5 mt-0.5">
                      <MapPin size={11} />
                      <span>{item.place}</span>
                      {item.batteryLevel !== undefined && (
                        <span className="ml-auto text-[10px] text-muted">
                          🔋 {item.batteryLevel}%
                        </span>
                      )}
                    </p>

                    {item.isAnomaly && (
                      <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-danger/10 px-1.5 py-0.5 text-[9px] font-bold text-danger border border-danger/20">
                        <AlertTriangle size={10} />
                        <span>AI Risk Engine Alert Dispatched</span>
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Manual Telemetry / Check-in Console */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Send size={15} className="text-primary" />
              <h4 className="font-heading text-xs font-bold text-foreground">
                Manual Check-in / Telemetry Logger
              </h4>
            </div>

            <form onSubmit={handleManualCheckin} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-muted">Place Name</label>
                <input
                  type="text"
                  value={manualPlace}
                  onChange={(e) => setManualPlace(e.target.value)}
                  placeholder="e.g. City Central Library, Soccer Field"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted">Checkpoint Event</label>
                <select
                  value={manualEvent}
                  onChange={(e) => setManualEvent(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                >
                  <option value="Reached Location Safely">Reached Location Safely ✅</option>
                  <option value="Departed Safe Zone">Departed Safe Zone 🚶</option>
                  <option value="In Transit">In Transit (Bicycle/Bus) 🚌</option>
                  <option value="Unscheduled Departure Flagged">
                    Unscheduled Departure Flagged ⚠️
                  </option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="anomalyCheck"
                  checked={manualIsAnomaly}
                  onChange={(e) => setManualIsAnomaly(e.target.checked)}
                  className="rounded accent-danger h-3.5 w-3.5"
                />
                <label
                  htmlFor="anomalyCheck"
                  className="text-[11px] font-medium text-foreground cursor-pointer"
                >
                  Simulate Risk Anomaly (Trigger alert in Risk Engine)
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmittingCheckin || !manualPlace.trim()}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2 text-xs font-bold text-white shadow-sm transition hover:bg-primary/90 disabled:opacity-50"
              >
                {isSubmittingCheckin ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Send size={13} />
                )}
                <span>Record Location Event</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}