import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, FlaskConical, Atom, Database, KeyRound, HelpCircle, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/shell/AppLayout";
import { Card, Button, Badge } from "@/components/ui";
import { API_BASE } from "@/lib/api";
import { cn } from "@/lib/utils";

type DocTab = "start" | "simulate" | "lab" | "data" | "faq";

const TABS: { id: DocTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "start", label: "Getting started", icon: BookOpen },
  { id: "simulate", label: "Simulations & Modeling", icon: Atom },
  { id: "lab", label: "Lab tools", icon: FlaskConical },
  { id: "data", label: "Datasets & API", icon: Database },
  { id: "faq", label: "FAQ", icon: HelpCircle },
];

function Doc({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-line pt-4 first:border-0 first:pt-0">
      <h3 className="text-[14px] font-semibold text-ink">{title}</h3>
      <div className="mt-1.5 space-y-2 text-[13px] leading-relaxed text-ink-soft">{children}</div>
    </div>
  );
}

export default function DocsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<DocTab>("start");

  return (
    <div className="mx-auto max-w-[1000px]">
      <PageHeader
        title="Documents"
        subtitle="Guides for every module, the FastAPI reference and answers — maintained inside the app."
        actions={
          <Button variant="secondary" size="sm" onClick={() => window.open(`${API_BASE}/docs`, "_blank", "noopener")}>
            <KeyRound className="size-4" /> API reference
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Documentation sections" className="flex gap-2 overflow-x-auto lg:flex-col lg:self-start">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex shrink-0 items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-[13px] font-medium transition-colors",
                tab === id ? "border-blue/45 bg-blue/10 text-ink" : "border-line bg-panel/50 text-ink-soft hover:text-ink",
              )}
            >
              <Icon className="size-4" /> {label}
            </button>
          ))}
        </nav>

        <Card className="space-y-4 p-5">
          {tab === "start" && (
            <>
              <Doc title="1 · Create your account">
                <p>Sign up with name, email and password (Settings → Security manages it later). Guest sessions explore freely but cannot enroll in courses or buy Pro.</p>
              </Doc>
              <Doc title="2 · Explore the catalogue">
                <p>Explore lists all 12 nanomaterials with property cards. Open any material for conductivity, band gap, applications and the Scherrer shortcut.</p>
                <p><Button variant="ghost" size="sm" onClick={() => navigate("/explore")}>Open Explore <ArrowRight className="size-3.5" /></Button></p>
              </Doc>
              <Doc title="3 · Run, upload, organise">
                <p>Simulation runs transport models · Analysis charts your CSV uploads · Projects track tasks · Learn teaches the science · Business tracks pilot lots.</p>
              </Doc>
            </>
          )}
          {tab === "simulate" && (
            <>
              <Doc title="Transport simulation">
                <p>Pick material + model (electron / thermal / tensile), temperature 200–1200 K, size 1–100 nm and iterations, then Run. Curves are deterministic demo models, not validated solvers.</p>
                <p>Starter: 5 runs/day enforced by the backend. Pro: unlimited + 5000-iteration deep runs + priority queue (no wait).</p>
              </Doc>
              <Doc title="Unit-cell modeling">
                <p>Modeling builds the geometry twin: SC/BCC/FCC/diamond/hex lattices, Å/nm parameter, molar mass → live density via ρ = Z·M/(Nₐ·a³). Save models to the activity feed.</p>
                <p><Button variant="ghost" size="sm" onClick={() => navigate("/modeling")}>Open Modeling <ArrowRight className="size-3.5" /></Button></p>
              </Doc>
            </>
          )}
          {tab === "lab" && (
            <>
              <Doc title="Six bench calculators">
                <p>Scherrer grain size · Bragg d-spacing · Dilution (C₁V₁) · Solution prep mass · Nanoparticle S/V ratio · Photon energy converter. All run locally and update as you type.</p>
                <p><Button variant="ghost" size="sm" onClick={() => navigate("/lab-tools")}>Open Lab Tools <ArrowRight className="size-3.5" /></Button></p>
              </Doc>
            </>
          )}
          {tab === "data" && (
            <>
              <Doc title="Uploading datasets">
                <p>Analysis accepts .csv (label column + numeric columns), .tsv and .json arrays. Online, files are parsed with pandas on FastAPI, stored in Postgres with describe() stats; offline, parsing happens in-browser.</p>
              </Doc>
              <Doc title="REST API">
                <p>All data routes need a JWT Bearer token from /auth/login. Key routes: /projects, /datasets/upload, /workspace/*, /science/simulate, /learn/*, /billing/*. Interactive reference:</p>
                <p><Button variant="ghost" size="sm" onClick={() => window.open(`${API_BASE}/docs`, "_blank", "noopener")}>Open {API_BASE}/docs <ArrowRight className="size-3.5" /></Button></p>
              </Doc>
              <Doc title="Personal tokens">
                <p>Generate a token in Settings → Connectors → API token for scripts and the Android companion app.</p>
              </Doc>
            </>
          )}
          {tab === "faq" && (
            <>
              <Doc title="Is the science real?">
                <p>Catalogue values are representative sample data; simulations and calculators are illustrative models. Never use them for engineering, medical or safety decisions.</p>
              </Doc>
              <Doc title="Where is my data?">
                <p>FastAPI + Postgres account storage plus an offline browser cache (nanosphere: prefix). Reset anytime in Settings → Privacy.</p>
              </Doc>
              <Doc title="How does Pro billing work?">
                <p>Pro ($199) and Team ($999) unlock only after checkout — Starter quotas are enforced server-side, so an unpaid account cannot reach paid features. Cancel anytime; access drops at once.</p>
              </Doc>
              <Doc title="Guests vs members?">
                <p>Guests explore the workspace but cannot enroll in courses, buy Pro, or keep data across devices. Sign up for the full platform.</p>
              </Doc>
            </>
          )}
        </Card>
      </div>

      <p className="mt-4 flex items-center gap-2 text-[12px] text-ink-muted">
        <Badge tone="neutral">v1.0</Badge> Docs ship with the app — new modules add their own page here.
      </p>
    </div>
  );
}
