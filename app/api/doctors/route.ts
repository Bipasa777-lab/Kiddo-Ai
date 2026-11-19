import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const query = searchParams.get("query")?.toLowerCase();

    const db = getDb();
    let result = [...db.doctors];

    if (category && category !== "all") {
      result = result.filter((d) => d.category === category);
    }

    if (query) {
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(query) ||
          d.specialty.toLowerCase().includes(query) ||
          d.hospital.toLowerCase().includes(query)
      );
    }

    return NextResponse.json({
      doctors: result,
      total: result.length,
    });
  } catch (error) {
    console.error("Error fetching doctors list:", error);
    return NextResponse.json({ error: "Failed to fetch doctors" }, { status: 500 });
  }
}
