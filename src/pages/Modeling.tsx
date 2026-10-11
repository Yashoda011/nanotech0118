import { useMemo, useState } from "react";
import { Boxes, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/shell/AppLayout";
import { Card, Button, Field, Select, SegmentedControl, Badge } from "@/components/ui";
import { useApp } from "@/store/app";

type Lattice = "sc" | "bcc" | "fcc" | "diamond" | "hex";

const LATTICES: { id: Lattice; label: string; atomsPerCell: number; packing: number }[] = [
  { id: "sc", label: "Simple cubic", atomsPerCell: 1, packing: 0.52 },
  { id: "bcc", label: "Body-centred cubic (Fe, W)", atomsPerCell: 2, packing: 0.68 },
  { id: "fcc", label: "Face-centred cubic (Ag, Au, Al)", atomsPerCell: 4, packing: 0.74 },
  { id: "diamond", label: "Diamond cubic (Si, C)", atomsPerCell: 8, packing: 0.34 },
  { id: "hex", label: "Hexagonal (ZnO, Ti)", atomsPerCell: 6, packing: 0.74 },
];

function CellSVG({ lattice, a }: { lattice: Lattice; a: number }) {
  // Schematic projection: cube frame + atoms; circle radius scales with lattice
  const s = 220;
  const pad = 30;
  const w = s - pad * 2;
  const off = 26; // pseudo-3D offset
  const r = lattice === "diamond" ? 9 : lattice === "sc" ? 13 : 11;
  const corners: [number, number][] = [
    [pad, pad + off], [pad + w, pad + off], [pad + w, pad + w + off], [pad, pad + w + off],
  ];
  const back: [number, number][] = corners.map(([x, y]) => [x + off, y - off]);
  const cx = pad + w / 2 + off / 2;
  const cy = pad + w / 2;
  return (
    <svg viewBox={`0 0 ${s + off} ${s + off}`} className="mx-auto h-64 w-full max-w-sm" role="img" aria-label={`${lattice} unit cell schematic`}>
      {corners.map((_, i) => (
        <line key={i} x1={corners[i][0]} y1={corners[i][1]} x2={back[i][0]} y2={back[i][1]} stroke="#3b82f6" strokeOpacity="0.5" strokeWidth="1.5" />
      ))}
      <polygon points={`${back.map((p) => p.join(",")).join(" ")}`} fill="rgba(59,130,246,0.08)" stroke="#60a5fa" strokeWidth="2" />
      <polygon points={`${corners.map((p) => p.join(",")).join(" ")}`} fill="rgba(59,130,246,0.12)" stroke="#60a5fa" strokeWidth="2" />
      {back.map(([x, y], i) => (
        <circle key={`b${i}`} cx={x} cy={y} r={r * 0.8} fill="#1d4ed8" stroke="#93c5f5" strokeWidth="1.5" />
      ))}
      {(lattice === "bcc" || lattice === "diamond") && <circle cx={cx} cy={cy} r={r} fill="#38bdf8" stroke="#fff" strokeWidth="1.5" />}
      {lattice === "diamond" && (
        <>
          <circle cx={cx - 22} cy={cy - 20} r={r * 0.75} fill="#818cf8" stroke="#fff" strokeWidth="1" />
          <circle cx={cx + 22} cy={cy + 20} r={r * 0.75} fill="#818cf8" stroke="#fff" strokeWidth="1" />
        </>
      )}
      {(lattice === "fcc" || lattice === "hex") && (
        <>
          <circle cx={cx} cy={cy - w / 2 + 4} r={r * 0.85} fill="#38bdf8" stroke="#fff" strokeWidth="1.5" />
          <circle cx={cx} cy={cy + w / 2 + 4} r={r * 0.85} fill="#38bdf8" stroke="#fff" strokeWidth="1.5" />
        </>
      )}
      {corners.map(([x, y], i) => (
        <circle key={`f${i}`} cx={x} cy={y} r={r} fill="#60a5fa" stroke="#fff" strokeWidth="1.5" />
      ))}
      <text x={cx} y={s + off - 4} textAnchor="middle" fill="#6d7b93" fontSize="11">a = {a.toFixed(2)} Å (schematic, not to scale)</text>
    </svg>
  );
}

export default function ModelingPage() {
  const { pushToast, logActivity } = useApp();
  const navigate = useNavigate();
  const [lattice, setLattice] = useState<Lattice>("fcc");
  const [a, setA] = useState("4.09");
  const [molarMass, setMolarMass] = useState("107.87");
  const [unit, setUnit] = useState<"angstrom" | "nm">("angstrom");

  const result = useMemo(() => {
    const info = LATTICES.find((l) => l.id === lattice)!;
    const aAng = unit === "nm" ? (Number(a) || 0) * 10 : Number(a) || 0;
    if (aAng <= 0) return null;
    const aCm = aAng * 1e-8;
    const volCm3 = aCm ** 3;
    const massG = (info.atomsPerCell * (Number(molarMass) || 0)) / 6.022e23;
    const density = massG / volCm3;
    const nearestNm = unit === "nm" ? Number(a) / Math.SQRT2 : (aAng / 10 / Math.SQRT2);
    return { info, density, nearestNm };
  }, [lattice, a, molarMass, unit]);

  return (
    <div className="mx-auto max-w-[1100px]">
      <PageHeader
        title="Simulation & Modeling"
        subtitle="Unit-cell playground: lattice type, parameter and density — the geometric twin of the Simulation transport models."
        actions={<Button variant="secondary" onClick={() => navigate("/simulation")}>Open transport simulation <ArrowRight className="size-4" /></Button>}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink"><Boxes className="size-4 text-cyan" /> Unit cell builder</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Lattice">
              <Select value={lattice} onChange={(e) => setLattice(e.target.value as Lattice)}>
                {LATTICES.map((l) => (
                  <option key={l.id} value={l.id}>{l.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Units">
              <SegmentedControl
                options={[{ value: "angstrom", label: "Å" }, { value: "nm", label: "nm" }]}
                value={unit}
                onChange={(v) => setUnit(v as typeof unit)}
              />
            </Field>
            <Field label={`Lattice parameter a (${unit === "nm" ? "nm" : "Å"})`}>
              <input
                type="range" min={2} max={6} step={0.01} value={Number(a) || 4}
                onChange={(e) => setA(e.target.value)}
                className="h-11 w-full" aria-label="Lattice parameter"
              />
            </Field>
            <Field label="Molar mass (g/mol)">
              <input
                type="number" value={molarMass} onChange={(e) => setMolarMass(e.target.value)}
                className="h-11 w-full rounded-xl border border-line bg-panel/80 px-3.5 text-sm text-ink focus:border-blue-soft/50 focus:outline-none"
              />
            </Field>
          </div>
          {result && (
            <dl className="mt-4 grid grid-cols-3 gap-3">
              {[
                { k: "Atoms / cell", v: String(result.info.atomsPerCell) },
                { k: "Packing", v: `${Math.round(result.info.packing * 100)}%` },
                { k: "Density", v: `${result.density.toFixed(2)} g/cm³` },
              ].map((d) => (
                <div key={d.k} className="rounded-xl border border-line px-3 py-2.5 text-center">
                  <dt className="text-[11px] text-ink-muted">{d.k}</dt>
                  <dd className="tabular-nums text-[14px] font-bold text-ink">{d.v}</dd>
                </div>
              ))}
            </dl>
          )}
          <div className="mt-4 flex gap-2.5">
            <Button
              variant="gradient"
              onClick={() => {
                logActivity("simulation", `Modeled ${result?.info.label}`, `a = ${a} ${unit}`);
                pushToast("Cell parameters saved to activity feed", "success");
              }}
            >
              Save model
            </Button>
            <Badge tone="neutral">ρ = Z·M / (Nₐ·a³)</Badge>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-[15px] font-semibold text-ink">Cell preview</h2>
          <p className="text-[12.5px] text-ink-muted">Schematic projection — corner, face and body atoms for the selected lattice.</p>
          <div className="mt-2 rounded-xl border border-line bg-void/60 p-3">
            <CellSVG lattice={lattice} a={unit === "nm" ? (Number(a) || 0) * 10 : Number(a) || 4} />
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-ink-muted">
            Pair with transport runs: model the geometry here, then validate electronic behaviour in Simulation. Both log to Recent Activity.
          </p>
        </Card>
      </div>
    </div>
  );
}
