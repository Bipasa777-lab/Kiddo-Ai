"use client";

import { useState, useRef, useEffect } from "react";
import {
  MapPin,
  Home,
  GraduationCap,
  BookOpen,
  Trees,
  Navigation,
  Compass,
  Battery,
  Zap,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Maximize2,
  RotateCcw,
  Shield,
  Layers,
  ChevronRight,
  Loader2,
  X,
  Smartphone,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface SafeZone {
  id: string;
  name: string;
  type: "home" | "school" | "tuition" | "park" | "other";
  status: "inside" | "left" | "not visited today";
  lastEvent: string;
  address: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  notifyOnEntry: boolean;
  notifyOnExit: boolean;
}

export interface TimelineEntry {
  id?: string;
  time: string;
  timestamp?: string;
  place: string;
  event: string;
  lat: number;
  lng: number;
  batteryLevel?: number;
  isAnomaly?: boolean;
}

export interface CurrentLocation {
  childId: string;
  childName: string;
  lat: number;
  lng: number;
  placeName: string;
  currentZone: string;
  status: "inside_safe_zone" | "in_transit" | "outside_safe_zone";
  lastUpdated: string;
  batteryLevel: number;
  speedKmh: number;
  accuracyMeters: number;
  isGpsActive: boolean;
}

interface LiveLocationMapProps {
  currentLocation: CurrentLocation;
  safeZones: SafeZone[];
  timeline: TimelineEntry[];
  onTriggerMovement: (params: {
    place: string;
    event: string;
    lat: number;
    lng: number;
    isAnomaly?: boolean;
  }) => Promise<void>;
  onAddSafeZone: (zone: Partial<SafeZone> & { name: string }) => Promise<void>;
  onDeleteSafeZone: (id: string) => Promise<void>;
}

// Bounding box for mapping coordinates to SVG viewBox (0-800, 0-500)
// Center ~ (37.778, -122.420)
const MAP_BOUNDS = {
  minLat: 37.7600,
  maxLat: 37.7950,
  minLng: -122.4550,
  maxLng: -122.3950,
};

function latLngToSvg(lat: number, lng: number): { x: number; y: number } {
  const x = ((lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * 800;
  // Lat inverted because SVG y goes down
  const y = ((MAP_BOUNDS.maxLat - lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * 500;
  return { x: Math.max(40, Math.min(760, x)), y: Math.max(40, Math.min(460, y)) };
}

function getZoneIcon(type: SafeZone["type"]) {
  switch (type) {
    case "home":
      return Home;
    case "school":
      return GraduationCap;
    case "tuition":
      return BookOpen;
    case "park":
      return Trees;
    default:
      return MapPin;
  }
}

function getZoneColor(type: SafeZone["type"]) {
  switch (type) {
    case "home":
      return { stroke: "#3B82F6", fill: "rgba(59, 130, 246, 0.15)", text: "text-blue-500" };
    case "school":
      return { stroke: "#F59E0B", fill: "rgba(245, 158, 11, 0.15)", text: "text-amber-500" };
    case "tuition":
      return { stroke: "#8B5CF6", fill: "rgba(139, 92, 246, 0.15)", text: "text-purple-500" };
    case "park":
      return { stroke: "#10B981", fill: "rgba(16, 185, 129, 0.15)", text: "text-emerald-500" };
    default:
      return { stroke: "#EC4899", fill: "rgba(236, 72, 153, 0.15)", text: "text-pink-500" };
  }
}

export function LiveLocationMap({
  currentLocation,
  safeZones,
  timeline,
  onTriggerMovement,
  onAddSafeZone,
  onDeleteSafeZone,
}: LiveLocationMapProps) {
  const [mapMode, setMapMode] = useState<"streets" | "radar">("streets");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [selectedZone, setSelectedZone] = useState<SafeZone | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newZoneName, setNewZoneName] = useState("");
  const [newZoneType, setNewZoneType] = useState<SafeZone["type"]>("other");
  const [newZoneAddress, setNewZoneAddress] = useState("");
  const [newZoneRadius, setNewZoneRadius] = useState(300);
  const [savingZone, setSavingZone] = useState(false);

  // SVG coordinates for child
  const childSvgPos = latLngToSvg(currentLocation.lat, currentLocation.lng);

  // Calculate timeline path for polyline
  const pathPoints = timeline
    .slice()
    .reverse()
    .map((t) => {
      const pos = latLngToSvg(t.lat, t.lng);
      return `${pos.x},${pos.y}`;
    })
    .join(" ");

  const handleZoomIn = () => setZoomLevel((z) => Math.min(1.8, z + 0.2));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.7, z - 0.2));
  const handleResetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleCenterOnChild = () => {
    setZoomLevel(1.2);
    // Center SVG (400, 250) on child pos
    const offsetX = (400 - childSvgPos.x) * 0.5;
    const offsetY = (250 - childSvgPos.y) * 0.5;
    setPanOffset({ x: offsetX, y: offsetY });
  };

  const handleSimulateStep = async (
    place: string,
    event: string,
    lat: number,
    lng: number,
    isAnomaly = false
  ) => {
    setIsSimulating(true);
    try {
      await onTriggerMovement({ place, event, lat, lng, isAnomaly });
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSaveNewZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneName.trim()) return;

    setSavingZone(true);
    try {
      // Offset slightly from center
      const offsetLat = 37.772 + (Math.random() - 0.5) * 0.02;
      const offsetLng = -122.42 + (Math.random() - 0.5) * 0.03;

      await onAddSafeZone({
        name: newZoneName,
        type: newZoneType,
        address: newZoneAddress || "Configured safe zone location",
        radiusMeters: Number(newZoneRadius) || 300,
        lat: offsetLat,
        lng: offsetLng,
        notifyOnEntry: true,
        notifyOnExit: true,
      });

      setShowAddModal(false);
      setNewZoneName("");
      setNewZoneAddress("");
    } catch (err) {
      console.error("Failed to add safe zone:", err);
    } finally {
      setSavingZone(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Map Card */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
        {/* Map Header Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
              <Navigation size={18} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-sm font-bold text-foreground">
                  Live Geospatial Radar &amp; Geofencing
                </h3>
                <span className="flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent animate-ping" />
                  <span>GPS Active (10s Ping)</span>
                </span>
              </div>
              <p className="text-[11px] text-muted">
                {currentLocation.placeName} · Accuracy: ±{currentLocation.accuracyMeters}m · Speed:{" "}
                {currentLocation.speedKmh} km/h
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex rounded-lg border border-border bg-card p-0.5 text-xs">
              <button
                onClick={() => setMapMode("streets")}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                  mapMode === "streets" ? "bg-primary text-white" : "text-muted hover:text-foreground"
                }`}
              >
                🗺️ Street Map
              </button>
              <button
                onClick={() => setMapMode("radar")}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                  mapMode === "radar" ? "bg-primary text-white" : "text-muted hover:text-foreground"
                }`}
              >
                🛰️ Dark Radar
              </button>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-primary/90"
            >
              <Plus size={13} />
              <span>Add Safe Zone</span>
            </button>
          </div>
        </div>

        {/* Interactive Map Visualizer Container */}
        <div className="relative h-[480px] w-full overflow-hidden select-none bg-slate-100 dark:bg-[#071328]">
          {/* SVG Map Canvas with Pan & Zoom */}
          <motion.div
            animate={{
              scale: zoomLevel,
              x: panOffset.x,
              y: panOffset.y,
            }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="h-full w-full origin-center"
          >
            <svg
              viewBox="0 0 800 500"
              className="h-full w-full"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Background Grid & Streets */}
              <defs>
                <pattern id="streetGrid" width="60" height="60" patternUnits="userSpaceOnUse">
                  <path
                    d="M 60 0 L 0 0 0 60"
                    fill="none"
                    stroke={mapMode === "streets" ? "#E2E8F0" : "#1E293B"}
                    strokeWidth="1"
                  />
                  <circle
                    cx="0"
                    cy="0"
                    r="1.5"
                    fill={mapMode === "streets" ? "#CBD5E1" : "#334155"}
                  />
                </pattern>

                <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.9" />
                </linearGradient>

                <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Map Base Texture */}
              <rect
                width="800"
                height="500"
                fill={mapMode === "streets" ? "#F8FAFC" : "#0A172E"}
              />
              <rect width="800" height="500" fill="url(#streetGrid)" />

              {/* Decorative City Blocks / Parks / River */}
              {/* River / Bay curvature */}
              <path
                d="M 640 0 C 660 120, 700 240, 750 360 C 780 430, 800 480, 800 500 L 800 0 Z"
                fill={mapMode === "streets" ? "#E0F2FE" : "#082444"}
                opacity="0.8"
              />

              {/* Central Park Area */}
              <rect
                x="80"
                y="310"
                width="220"
                height="130"
                rx="16"
                fill={mapMode === "streets" ? "#DCFCE7" : "#062E25"}
                opacity="0.6"
                stroke={mapMode === "streets" ? "#86EFAC" : "#047857"}
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
              <text
                x="150"
                y="380"
                fill={mapMode === "streets" ? "#166534" : "#34D399"}
                fontSize="11"
                fontWeight="bold"
                opacity="0.7"
              >
                🌲 City Central Park
              </text>

              {/* Major Arterial Avenues (Lines) */}
              <line x1="0" y1="180" x2="800" y2="180" stroke={mapMode === "streets" ? "#CBD5E1" : "#1E293B"} strokeWidth="5" />
              <line x1="0" y1="320" x2="800" y2="320" stroke={mapMode === "streets" ? "#CBD5E1" : "#1E293B"} strokeWidth="4" />
              <line x1="280" y1="0" x2="280" y2="500" stroke={mapMode === "streets" ? "#CBD5E1" : "#1E293B"} strokeWidth="4" />
              <line x1="520" y1="0" x2="520" y2="500" stroke={mapMode === "streets" ? "#CBD5E1" : "#1E293B"} strokeWidth="4" />

              {/* Street Names */}
              <text x="30" y="174" fill={mapMode === "streets" ? "#94A3B8" : "#475569"} fontSize="9" fontWeight="600">
                MARKET BLVD
              </text>
              <text x="30" y="314" fill={mapMode === "streets" ? "#94A3B8" : "#475569"} fontSize="9" fontWeight="600">
                MISSION EXPRESSWAY
              </text>
              <text x="525" y="40" fill={mapMode === "streets" ? "#94A3B8" : "#475569"} fontSize="9" fontWeight="600" transform="rotate(90, 525, 40)">
                COLUMBUS AVE
              </text>

              {/* Today's Route Polyline connecting travel timeline points */}
              {timeline.length > 1 && (
                <polyline
                  points={pathPoints}
                  fill="none"
                  stroke="url(#routeGradient)"
                  strokeWidth="3.5"
                  strokeDasharray="6 4"
                  filter="url(#glowEffect)"
                  className="animate-pulse"
                />
              )}

              {/* Safe Zone Circular Geofence Boundaries */}
              {safeZones.map((zone) => {
                const pos = latLngToSvg(zone.lat, zone.lng);
                const colors = getZoneColor(zone.type);
                const radiusPixels = Math.max(30, (zone.radiusMeters / 1000) * 110);
                const isSelected = selectedZone?.id === zone.id;

                return (
                  <g
                    key={zone.id}
                    className="cursor-pointer transition-transform hover:scale-105"
                    onClick={() => setSelectedZone(zone)}
                  >
                    {/* Glowing Circular Geofence Area */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={radiusPixels}
                      fill={colors.fill}
                      stroke={colors.stroke}
                      strokeWidth={isSelected ? "3" : "1.8"}
                      strokeDasharray={zone.status === "inside" ? "none" : "5 3"}
                      filter={isSelected ? "url(#glowEffect)" : undefined}
                    />

                    {/* Zone Center Marker Circle */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r="16"
                      fill={colors.stroke}
                      stroke="white"
                      strokeWidth="2.5"
                      className="shadow-md"
                    />

                    {/* Zone Label Text */}
                    <rect
                      x={pos.x - 45}
                      y={pos.y + 20}
                      width="90"
                      height="18"
                      rx="6"
                      fill={mapMode === "streets" ? "white" : "#0F172A"}
                      stroke={colors.stroke}
                      strokeWidth="1"
                      opacity="0.95"
                    />
                    <text
                      x={pos.x}
                      y={pos.y + 32}
                      textAnchor="middle"
                      fill={mapMode === "streets" ? "#0F172A" : "white"}
                      fontSize="9"
                      fontWeight="bold"
                    >
                      {zone.name.split(" ")[0]} ({zone.radiusMeters}m)
                    </text>
                  </g>
                );
              })}

              {/* Live Child Marker (Aarav Sharma) */}
              <g
                className="cursor-pointer"
                onClick={handleCenterOnChild}
                filter="url(#glowEffect)"
              >
                {/* Outer GPS Pulse Animation Ring */}
                <circle
                  cx={childSvgPos.x}
                  cy={childSvgPos.y}
                  r="24"
                  fill="rgba(59, 130, 246, 0.2)"
                  stroke="#3B82F6"
                  strokeWidth="1.5"
                >
                  <animate
                    attributeName="r"
                    values="16;34;16"
                    dur="2.5s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.8;0;0.8"
                    dur="2.5s"
                    repeatCount="indefinite"
                  />
                </circle>

                {/* Child Inner Marker Head */}
                <circle
                  cx={childSvgPos.x}
                  cy={childSvgPos.y}
                  r="14"
                  fill="#3B82F6"
                  stroke="white"
                  strokeWidth="3"
                />

                {/* Avatar Initial / Emoji */}
                <text
                  x={childSvgPos.x}
                  y={childSvgPos.y + 4}
                  textAnchor="middle"
                  fill="white"
                  fontSize="10"
                  fontWeight="bold"
                >
                  A
                </text>

                {/* Floating Child Status Bubble */}
                <rect
                  x={childSvgPos.x - 55}
                  y={childSvgPos.y - 36}
                  width="110"
                  height="22"
                  rx="7"
                  fill="#0F172A"
                  stroke="#3B82F6"
                  strokeWidth="1.5"
                />
                <text
                  x={childSvgPos.x}
                  y={childSvgPos.y - 22}
                  textAnchor="middle"
                  fill="white"
                  fontSize="9.5"
                  fontWeight="bold"
                >
                  🧒 Aarav ({currentLocation.placeName})
                </text>
              </g>
            </svg>
          </motion.div>

          {/* Floating Map Controls (+ / - / Reset / Center) */}
          <div className="absolute right-4 top-4 flex flex-col gap-1.5 rounded-xl border border-border bg-card/90 p-1.5 shadow-lg backdrop-blur-md">
            <button
              onClick={handleZoomIn}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 hover:bg-primary hover:text-white transition"
              title="Zoom In"
            >
              +
            </button>
            <button
              onClick={handleZoomOut}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 hover:bg-primary hover:text-white transition"
              title="Zoom Out"
            >
              −
            </button>
            <button
              onClick={handleResetView}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 hover:bg-primary hover:text-white transition"
              title="Reset View"
            >
              <RotateCcw size={13} />
            </button>
            <button
              onClick={handleCenterOnChild}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/40 bg-primary/10 text-primary hover:bg-primary hover:text-white transition"
              title="Center on Child"
            >
              <Compass size={14} />
            </button>
          </div>

          {/* Map Legend Overlay */}
          <div className="absolute bottom-4 left-4 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card/90 px-3 py-2 text-xs shadow-md backdrop-blur-md">
            <div className="flex items-center gap-1.5 font-medium">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse" />
              <span>Aarav (Current)</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted">
              <span className="h-2 w-2 rounded-full border border-blue-500 bg-blue-500/20" />
              <span>Safe Zone (Home)</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted">
              <span className="h-2 w-2 rounded-full border border-amber-500 bg-amber-500/20" />
              <span>School</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted">
              <span className="h-2 w-2 rounded-full border border-purple-500 bg-purple-500/20" />
              <span>Tuition</span>
            </div>
          </div>
        </div>

        {/* Selected Zone Inspector Drawer / Modal */}
        <AnimatePresence>
          {selectedZone && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="border-t border-border bg-card p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-heading text-sm font-bold text-foreground">
                        {selectedZone.name}
                      </h4>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary capitalize">
                        {selectedZone.type}
                      </span>
                      <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent capitalize">
                        {selectedZone.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted mt-0.5">{selectedZone.address}</p>
                    <p className="text-[11px] text-muted">
                      Geofence Radius: {selectedZone.radiusMeters}m · Last event: {selectedZone.lastEvent}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      handleSimulateStep(
                        selectedZone.name,
                        `Reached ${selectedZone.name}`,
                        selectedZone.lat,
                        selectedZone.lng
                      )
                    }
                    disabled={isSimulating}
                    className="flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-primary hover:text-white disabled:opacity-50"
                  >
                    <CheckCircle2 size={13} />
                    <span>Simulate Arrival</span>
                  </button>

                  <button
                    onClick={() =>
                      handleSimulateStep(
                        selectedZone.name,
                        `Left ${selectedZone.name}`,
                        selectedZone.lat + 0.005,
                        selectedZone.lng + 0.005
                      )
                    }
                    disabled={isSimulating}
                    className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-bold text-muted transition hover:bg-card hover:text-foreground"
                  >
                    <span>Simulate Exit</span>
                  </button>

                  <button
                    onClick={() => onDeleteSafeZone(selectedZone.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-danger/30 text-danger hover:bg-danger/10 transition"
                    title="Delete Safe Zone"
                  >
                    <Trash2 size={14} />
                  </button>

                  <button
                    onClick={() => setSelectedZone(null)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-border text-muted hover:text-foreground"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Movement & Geofence Simulator Toolbar */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-primary" />
            <h4 className="text-sm font-bold text-foreground">
              Live Transit Simulator &amp; Risk Anomaly Tester
            </h4>
          </div>
          <p className="text-xs text-muted">
            Test real-time geofence events, safe zone departures, and school dismissal alerts.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <button
            disabled={isSimulating}
            onClick={() =>
              handleSimulateStep("Oakwood High School", "Reached School", 37.7845, -122.4085)
            }
            className="flex items-center justify-between rounded-xl border border-border bg-card/60 p-3 text-left transition hover:border-amber-500/50 hover:bg-amber-500/5"
          >
            <div>
              <p className="text-xs font-bold text-foreground">🏫 Arrive at School</p>
              <p className="text-[10px] text-muted">Morning 8:24 AM arrival</p>
            </div>
            <ChevronRight size={14} className="text-muted" />
          </button>

          <button
            disabled={isSimulating}
            onClick={() =>
              handleSimulateStep("Science Tuition Center", "Entered Safe Zone", 37.7892, -122.4014)
            }
            className="flex items-center justify-between rounded-xl border border-border bg-card/60 p-3 text-left transition hover:border-purple-500/50 hover:bg-purple-500/5"
          >
            <div>
              <p className="text-xs font-bold text-foreground">📚 Enter Tuition</p>
              <p className="text-[10px] text-muted">Afternoon session check-in</p>
            </div>
            <ChevronRight size={14} className="text-muted" />
          </button>

          <button
            disabled={isSimulating}
            onClick={() =>
              handleSimulateStep("Home", "Reached Home", 37.7749, -122.4194)
            }
            className="flex items-center justify-between rounded-xl border border-border bg-card/60 p-3 text-left transition hover:border-blue-500/50 hover:bg-blue-500/5"
          >
            <div>
              <p className="text-xs font-bold text-foreground">🏠 Return Home</p>
              <p className="text-[10px] text-muted">Evening safe arrival</p>
            </div>
            <ChevronRight size={14} className="text-muted" />
          </button>

          <button
            disabled={isSimulating}
            onClick={() =>
              handleSimulateStep(
                "Oakwood High School",
                "Left School Early (Anomaly Triggered)",
                37.7845,
                -122.4085,
                true
              )
            }
            className="flex items-center justify-between rounded-xl border border-danger/40 bg-danger/5 p-3 text-left transition hover:border-danger hover:bg-danger/10"
          >
            <div>
              <p className="text-xs font-bold text-danger">⚠️ Early Departure Alert</p>
              <p className="text-[10px] text-danger/80">Triggers AI Risk Alert</p>
            </div>
            <AlertTriangle size={14} className="text-danger" />
          </button>
        </div>
      </div>

      {/* Add Safe Zone Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <MapPin size={16} />
                  </div>
                  <h3 className="font-heading text-base font-bold text-foreground">
                    Create New Safe Zone
                  </h3>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg p-1 text-muted hover:text-foreground"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveNewZone} className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-foreground">Zone Name *</label>
                  <input
                    type="text"
                    required
                    value={newZoneName}
                    onChange={(e) => setNewZoneName(e.target.value)}
                    placeholder="e.g. Grandma's House, Soccer Field, Library"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-foreground">Zone Category</label>
                    <select
                      value={newZoneType}
                      onChange={(e) => setNewZoneType(e.target.value as SafeZone["type"])}
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                    >
                      <option value="home">Home 🏠</option>
                      <option value="school">School 🏫</option>
                      <option value="tuition">Tuition / Study 📚</option>
                      <option value="park">Park / Recreation 🌳</option>
                      <option value="other">Other Activity 📍</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground">
                      Geofence Radius ({newZoneRadius}m)
                    </label>
                    <input
                      type="range"
                      min="100"
                      max="1000"
                      step="50"
                      value={newZoneRadius}
                      onChange={(e) => setNewZoneRadius(Number(e.target.value))}
                      className="mt-3 w-full accent-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">Address / Notes</label>
                  <input
                    type="text"
                    value={newZoneAddress}
                    onChange={(e) => setNewZoneAddress(e.target.value)}
                    placeholder="e.g. 520 Ocean Ave, Community Sports Complex"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                  />
                </div>

                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-[11px] text-muted">
                  Safe zone geofencing monitors arrival and departure times automatically. If your child
                  leaves school outside normal dismissal hours, an alert is dispatched to your dashboard.
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingZone || !newZoneName.trim()}
                    className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-md transition hover:bg-primary/90 disabled:opacity-50"
                  >
                    {savingZone ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    <span>Save Safe Zone</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
