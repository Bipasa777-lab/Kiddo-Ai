"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  CalendarDays,
  ClipboardList,
  HeartPulse,
  MessageCircle,
  Search,
  ShieldCheck,
  Users,
  CheckCircle2,
  FileText,
  Save,
  Loader2,
  ChevronRight,
  Eye,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleGate } from "@/components/role-gate";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";

interface PatientProfile {
  id: string;
  name: string;
  age: number;
  risk: string;
  wellbeingScore: number;
  note: string;
  color: string;
  activeAlerts: string[];
}

const mockPatientList: PatientProfile[] = [
  {
    id: "child_01",
    name: "Aarav Sharma",
    age: 12,
    risk: "Moderate",
    wellbeingScore: 74,
    note: "Night usage improved by 18%; parent instituted 9:30 PM device dock.",
    color: "text-warning",
    activeAlerts: ["Late-night phone use detected (PMC5658795)", "Gaming time trending up on weekends"],
  },
  {
    id: "p2",
    name: "Leo Sinclair",
    age: 10,
    risk: "Low",
    wellbeingScore: 88,
    note: "Mood check-ins steady; gaming within standard thresholds.",
    color: "text-accent",
    activeAlerts: ["Educational app goal achieved (+18%)"],
  },
  {
    id: "p3",
    name: "Maya Patel",
    age: 14,
    risk: "High",
    wellbeingScore: 61,
    note: "Parent requested consultation regarding peer anxiety and screen fatigue.",
    color: "text-danger",
    activeAlerts: ["Social media fatigue detected past 1:00 AM", "Negative affect sentiment flag in chat"],
  },
];

const stats = [
  { label: "Active Patients", value: "24", icon: Users },
  { label: "Reports Ready", value: "8", icon: ClipboardList },
  { label: "Care Plans", value: "16", icon: HeartPulse },
  { label: "Sessions Today", value: "5", icon: CalendarDays },
];

export default function DoctorPage() {
  const [selectedPatient, setSelectedPatient] = useState<PatientProfile>(mockPatientList[0]);
  const [clinicianNote, setClinicianNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [consultations, setConsultations] = useState<any[]>([]);

  useEffect(() => {
    async function loadDoctorData() {
      try {
        const [notesRes, consultRes] = await Promise.all([
          fetch(`/api/doctors/notes?childId=${selectedPatient.id}`),
          fetch("/api/doctors/consult"),
        ]);
        const notesData = await notesRes.json();
        const consultData = await consultRes.json();

        if (notesData.note?.note) {
          setClinicianNote(notesData.note.note);
        }
        if (consultData.consultations) {
          setConsultations(consultData.consultations);
        }
      } catch (err) {
        console.error("Failed to load doctor data:", err);
      }
    }
    loadDoctorData();
  }, [selectedPatient]);

  const handleSaveClinicianNote = async () => {
    setSavingNote(true);
    setSavedSuccess(false);
    try {
      await fetch("/api/doctors/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: selectedPatient.id,
          childName: selectedPatient.name,
          doctorName: "Dr. Sarah Jenkins",
          note: clinicianNote,
        }),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save clinician note:", err);
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <RoleGate allowedRole="doctor">
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <header className="mb-8 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
                <HeartPulse size={18} />
              </div>
              <div>
                <p className="font-heading text-lg font-semibold">KiddoAI Doctor</p>
                <p className="text-xs text-muted">Pediatric &amp; Behavioral Clinical Workspace</p>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="text-xs text-primary hover:underline">
                View Parent Dashboard →
              </Link>
              <ThemeToggle />
            </div>
          </header>

          <section className="mb-6 flex flex-col justify-between gap-4 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center">
            <div>
              <p className="mb-2 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                Pediatric Clinician Access
              </p>
              <h1 className="font-heading text-2xl font-bold sm:text-3xl">Patient Wellbeing Review</h1>
              <p className="mt-1 max-w-2xl text-xs sm:text-sm text-muted">
                Review consented child profiles, behavioral risk events, and author clinical notes for telehealth follow-ups.
              </p>
            </div>
          </section>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map(({ label, value, icon: Icon }) => (
              <Card key={label}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted">{label}</p>
                    <p className="mt-1 font-heading text-2xl font-semibold">{value}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                    <Icon size={18} />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-12">
            {/* Left Column: Shared Patient Profiles */}
            <div className="lg:col-span-5 space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Consented Patient Roster</CardTitle>
                    <ShieldCheck className="h-4 w-4 text-accent" />
                  </div>
                </CardHeader>
                <div className="space-y-2 p-4 pt-0">
                  {mockPatientList.map((patient) => {
                    const isSelected = selectedPatient.id === patient.id;
                    return (
                      <button
                        key={patient.id}
                        onClick={() => setSelectedPatient(patient)}
                        className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition ${
                          isSelected
                            ? "border-primary bg-primary/10 shadow-sm"
                            : "border-border bg-card/40 hover:bg-card"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">{patient.name}</span>
                            <span className="text-xs text-muted">({patient.age}y)</span>
                          </div>
                          <p className="mt-0.5 text-xs text-muted line-clamp-1">{patient.note}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-bold ${patient.color}`}>{patient.risk}</span>
                          <p className="text-[10px] text-muted">{patient.wellbeingScore}/100</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Card>

              {/* Consultation Requests Queue */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Consultation Schedule</CardTitle>
                    <Activity className="h-4 w-4 text-primary" />
                  </div>
                </CardHeader>
                <div className="space-y-3 p-4 pt-0">
                  {consultations.length === 0 ? (
                    <div className="rounded-xl bg-primary/10 p-3 text-xs text-muted">
                      No pending consultation bookings.
                    </div>
                  ) : (
                    consultations.slice(0, 3).map((c, i) => (
                      <div key={i} className="rounded-xl border border-border p-3 text-xs">
                        <div className="flex items-center justify-between font-semibold">
                          <span>{c.childName}</span>
                          <span className="capitalize rounded-full bg-accent/15 px-2 py-0.5 text-accent text-[10px]">
                            {c.status}
                          </span>
                        </div>
                        <p className="mt-1 text-muted">Date: {c.date} · Type: {c.type}</p>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>

            {/* Right Column: Selected Patient Clinical Deep-Dive & Clinician Notes */}
            <div className="lg:col-span-7 space-y-4">
              <Card className="border-primary/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{selectedPatient.name}&apos;s Clinical Overview</CardTitle>
                      <p className="text-xs text-muted">Age {selectedPatient.age} · Score: {selectedPatient.wellbeingScore}/100</p>
                    </div>
                    <Badge color={selectedPatient.risk === "High" ? "var(--danger)" : "var(--primary)"}>
                      {selectedPatient.risk} Risk Profile
                    </Badge>
                  </div>
                </CardHeader>

                <div className="space-y-4 p-4 pt-0 text-xs">
                  {/* Flagged Signals */}
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Flagged Telemetry &amp; Risk Signals:</h4>
                    <ul className="space-y-1.5">
                      {selectedPatient.activeAlerts.map((alert, idx) => (
                        <li key={idx} className="flex items-start gap-2 rounded-lg border border-border/80 bg-background/60 p-2.5">
                          <span className="h-2 w-2 rounded-full bg-warning mt-1 shrink-0" />
                          <span className="text-muted leading-relaxed">{alert}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Clinician Authoring Box */}
                  <div className="border-t border-border pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-semibold text-foreground flex items-center gap-1.5">
                        <FileText size={14} className="text-primary" />
                        <span>Clinician Notes &amp; Care Guidance</span>
                      </label>
                      {savedSuccess && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-accent">
                          <CheckCircle2 size={13} />
                          <span>Note Saved to Patient Record!</span>
                        </span>
                      )}
                    </div>
                    <textarea
                      rows={5}
                      value={clinicianNote}
                      onChange={(e) => setClinicianNote(e.target.value)}
                      placeholder="Record clinical recommendations, bedtime curfew assessments, and offline parental guidance..."
                      className="w-full rounded-xl border border-border bg-background p-3 text-xs leading-relaxed outline-none focus:border-primary"
                    />

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[10px] text-muted">
                        Changes are synced to the parent-facing health record.
                      </span>
                      <button
                        onClick={handleSaveClinicianNote}
                        disabled={savingNote}
                        className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-primary/90 disabled:opacity-50"
                      >
                        {savingNote ? (
                          <>
                            <Loader2 size={13} className="animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Save size={13} />
                            <span>Save Clinician Note</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </RoleGate>
  );
}
