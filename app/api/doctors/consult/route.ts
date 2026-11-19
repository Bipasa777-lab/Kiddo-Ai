import { NextRequest, NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/server/db";
import { Consultation } from "@/lib/mock-data";

export async function GET() {
  const db = getDb();
  return NextResponse.json({
    consultations: db.consultations,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { doctorId, bookingDate, bookingType, childId } = body as {
      doctorId: string;
      bookingDate: string;
      bookingType: "video" | "inperson";
      childId?: string;
    };

    if (!doctorId || !bookingDate) {
      return NextResponse.json(
        { error: "doctorId and bookingDate are required" },
        { status: 400 }
      );
    }

    const db = getDb();
    const doc = db.doctors.find((d) => d.id === doctorId);
    if (!doc) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    const newConsultation: Consultation = {
      id: `c_${Date.now().toString().slice(-4)}`,
      doctorId: doc.id,
      doctorName: doc.name,
      childId: childId || db.child.id,
      childName: db.child.name,
      date: bookingDate,
      type: bookingType || "video",
      status: "confirmed",
      createdAt: new Date().toISOString(),
    };

    db.consultations.unshift(newConsultation);
    saveDb(db);

    return NextResponse.json({
      success: true,
      message: `Consultation with ${doc.name} successfully requested for ${bookingDate}.`,
      consultation: newConsultation,
    });
  } catch (error) {
    console.error("Error creating consultation:", error);
    return NextResponse.json({ error: "Failed to book consultation" }, { status: 500 });
  }
}
