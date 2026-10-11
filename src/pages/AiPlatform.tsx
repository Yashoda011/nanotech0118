import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, Sparkles, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/shell/AppLayout";
import { Card, Button, Field, Select, Badge } from "@/components/ui";
import { MATERIALS, type Material } from "@/data/materials";
import { ARTICLES } from "@/data/research";
import { useApp } from "@/store/app";

type AppProfile = "interconnect" | "battery" | "optoelectronic" | "composite" | "biomedical" | "coating";

const PROFILES: { id: AppProfile; label: string; hint: string }[] = [
  { id: "interconnect", label: "Conductive interconnects", hint: "Prioritises electrical index" },
  { id: "battery", label: "Battery electrodes", hint: "Conductivity + thermal stability" },
  { id: "optoelectronic", label: "Optoelectronics / displays", hint: "Band gap + electrical balance" },
  { id: "composite", label: "Structural composites", hint: "Tensile strength first" },
  { id: "biomedical", label: "Biomedical", hint: "Biocompatible only" },
  { id: "coating", label: "Smart coatings", hint: "Band gap + thermal" },
];

function score(m: Material, p: AppProfile): number {
  switch (p) {
    case "interconnect": return m.index.electrical * 0.7 + m.index.thermal * 0.3;
    case "battery": return m.index.electrical * 0.5 + m.index.thermal * 0.3 + m.index.tensile * 0.2;
    case "optoelectronic": return (100 - Math.abs(m.index.bandgap - 55)) * 0.5 + m.index.electrical * 0.5;
    case "composite": return m.index.tensile * 0.7 + m.index.thermal * 0.3;
    case "biomedical": return (m.biocompatible ? 60 : 0) + m.index.electrical * 0.25 + m.index.tensile * 0.15;
    case "coating": return m.index.bandgap * 0.5 + m.index.thermal * 0.3 + m.index.tensile * 0.2;
  }
}

export default function AiPlatformPage() {
  const { logActivity } = useApp();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<AppProfile>("interconnect");
  const [query, setQuery] = useState("");

  const ranked = useMemo(() => {
    let list = MATERIALS.map((m) => ({ m, s: score(m, profile) }));
    if (profile === "biomedical") list = list.filter((r) => r.m.biocompatible);
    return list.sort((a, b) => b.s - a.s).slice(0, 5);
  }, [profile]);

  const lit = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ARTICLES.slice(0, 3);
    return ARTICLES.filter((a) => `${a.title} ${a.tags.join(" ")}`.toLowerCase().includes(q)).slice(0, 3);
  }, [query]);

  return (
    <div className="mx-auto max-w-[1100px]">
      <PageHeader
        title="AI Nanotechnology Platform"
        subtitle="Recommend, predict and mine literature — heuristic models running on-device over the 12-material catalogue."
        actions={<Badge tone="blue"><Sparkles className="size-3" /> Heuristic AI · no key needed</Badge>}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink"><Brain className="size-4 text-violet" /> Material recommender</h2>
          <p className="mt-1 text-[12.5px] text-ink-muted">Pick an application — candidates are scored by weighted property indices.</p>
          <Field label="Application profile">
            <Select value={profile} onChange={(e) => setProfile(e.target.value as AppProfile)}>
              {PROFILES.map((p) => (
                <option key={p.id} value={p.id}>{p.label} — {p.hint}</option>
              ))}
            </Select>
          </Field>
          <ul className="mt-4 space-y-2">
            {ranked.map(({ m, s }, i) => (
              <li key={m.id}>
                <button
                  onClick={() => {
                    logActivity("search", `AI recommended ${m.name}`, PROFILES.find((p) => p.id === profile)?.label);
                    navigate(`/materials/${m.id}`);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl border border-line bg-panel/50 px-3.5 py-2.5 text-left transition-colors hover:border-blue-soft/30"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-violet/15 text-[12px] font-bold text-violet">{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-medium text-ink">{m.name}</span>
                    <span className="block text-[11.5px] text-ink-muted">{m.formula} · {m.category}</span>
                  </span>
                  <span className="tabular-nums text-[13px] font-semibold text-blue-soft">{s.toFixed(0)}</span>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink"><Sparkles className="size-4 text-gold" /> Property predictor</h2>
            <p className="mt-1 text-[12.5px] text-ink-muted">Estimates missing indices from catalogue correlations (demo regression).</p>
            <ul className="mt-3 space-y-2 text-[13px]">
              {MATERIALS.slice(0, 4).map((m) => {
                const predicted = Math.round(m.index.electrical * 0.6 + m.index.thermal * 0.4);
                return (
                  <li key={m.id} className="flex items-center justify-between rounded-xl border border-line px-3.5 py-2.5">
                    <span className="font-medium text-ink">{m.name} <span className="text-ink-muted">· suitability</span></span>
                    <span className="tabular-nums font-semibold text-gold">{predicted}/100</span>
                  </li>
                );
              })}
            </ul>
            <Button variant="ghost" size="sm" className="mt-3" onClick={() => navigate("/simulation")}>
              Validate in Simulation <ArrowRight className="size-3.5" />
            </Button>
          </Card>

          <Card className="p-5">
            <h2 className="text-[15px] font-semibold text-ink">Literature miner</h2>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search topics, e.g. graphene…"
              aria-label="Mine literature"
              className="mt-3 h-10 w-full rounded-xl border border-line bg-panel/80 px-3.5 text-sm text-ink placeholder:text-ink-muted focus:border-blue-soft/50 focus:outline-none"
            />
            <ul className="mt-3 space-y-2">
              {lit.map((a) => (
                <li key={a.id}>
                  <button onClick={() => navigate(`/research/${a.id}`)} className="block w-full rounded-xl border border-line px-3.5 py-2.5 text-left transition-colors hover:border-blue-soft/30">
                    <span className="line-clamp-1 block text-[13px] font-medium text-ink">{a.title}</span>
                    <span className="mt-0.5 block text-[11.5px] text-ink-muted">{a.source} · {a.tags.slice(0, 3).join(", ")}</span>
                  </button>
                </li>
              ))}
              {lit.length === 0 && <p className="py-3 text-center text-[12.5px] text-ink-muted">No matches — try “battery” or “sensor”.</p>}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
