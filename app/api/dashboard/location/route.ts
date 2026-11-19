import { NextRequest, NextResponse } from "next/server";
import {
  getDb,
  getCurrentLocation,
  updateCurrentLocation,
  getSafeZones,
  upsertSafeZone,
  deleteSafeZone,
  addLocationTimelineEntry,
} from "@/lib/server/db";
import { evaluateTelemetryEvent } from "@/lib/server/risk-engine";

export async function GET() {
  try {
    const currentLocation = getCurrentLocation();
    const safeZones = getSafeZones();
    const db = getDb();

    return NextResponse.json({
      success: true,
      currentLocation,
      safeZones,
      locationTimeline: db.locationTimeline || [],
      batteryLevel: currentLocation.batteryLevel,
      speedKmh: currentLocation.speedKmh,
      isGpsActive: currentLocation.isGpsActive,
    });
  } catch (error) {
    console.error("Location GET error:", error);
    return NextResponse.json({ error: "Failed to fetch location data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      place,
      event,
      lat,
      lng,
      status,
      speedKmh,
      batteryLevel,
      isAnomaly,
    } = body;

    if (!place || !event) {
      return NextResponse.json({ error: "place and event are required" }, { status: 400 });
    }

    const db = getDb();
    const safeZones = getSafeZones();
    const matchedZone = safeZones.find((z) => z.name.toLowerCase() === place.toLowerCase());

    const targetLat = lat !== undefined ? lat : matchedZone?.lat ?? db.currentLocation?.lat ?? 37.7749;
    const targetLng = lng !== undefined ? lng : matchedZone?.lng ?? db.currentLocation?.lng ?? -122.4194;

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Update child current location
    const updatedLocation = updateCurrentLocation({
      lat: targetLat,
      lng: targetLng,
      placeName: place,
      currentZone: event.toLowerCase().includes("left") ? "In Transit" : place,
      status: status || (event.toLowerCase().includes("left") ? "in_transit" : "inside_safe_zone"),
      speedKmh: speedKmh !== undefined ? speedKmh : event.toLowerCase().includes("left") ? 18 : 0,
      batteryLevel: batteryLevel !== undefined ? batteryLevel : db.currentLocation.batteryLevel,
    });

    // Add timeline record
    const timelineEntry = addLocationTimelineEntry({
      time: timeStr,
      place,
      event,
      lat: targetLat,
      lng: targetLng,
      batteryLevel: updatedLocation.batteryLevel,
      isAnomaly: Boolean(isAnomaly),
    });

    // If anomaly triggered (e.g. left safe zone at unexpected hour or flagged anomaly)
    let riskEvaluation = null;
    if (isAnomaly || (event.toLowerCase().includes("left school") && new Date().getHours() < 14)) {
      riskEvaluation = evaluateTelemetryEvent({
        id: `evt_loc_${Date.now()}`,
        childId: "child_01",
        timestamp: new Date().toISOString(),
        eventType: "safe_zone",
        hourOfDay: new Date().getHours(),
        locationPlace: place,
        locationEvent: event,
      });
    }

    return NextResponse.json({
      success: true,
      currentLocation: updatedLocation,
      safeZones: getSafeZones(),
      timelineEntry,
      locationTimeline: db.locationTimeline,
      riskEvaluation,
    });
  } catch (error) {
    console.error("Location POST error:", error);
    return NextResponse.json({ error: "Failed to update location" }, { status: 500 });
  }
}

// Add or update safe zone
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name) {
      return NextResponse.json({ error: "Zone name is required" }, { status: 400 });
    }

    const savedZone = upsertSafeZone(body);

    return NextResponse.json({
      success: true,
      message: `Safe zone '${savedZone.name}' saved successfully.`,
      zone: savedZone,
      safeZones: getSafeZones(),
    });
  } catch (error) {
    console.error("Location PUT error:", error);
    return NextResponse.json({ error: "Failed to save safe zone" }, { status: 500 });
  }
}

// Delete safe zone
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Zone ID is required" }, { status: 400 });
    }

    const deleted = deleteSafeZone(id);
    if (!deleted) {
      return NextResponse.json({ error: "Safe zone not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Safe zone removed.",
      safeZones: getSafeZones(),
    });
  } catch (error) {
    console.error("Location DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete safe zone" }, { status: 500 });
  }
}
