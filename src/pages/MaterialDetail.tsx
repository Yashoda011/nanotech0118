import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Atom, Bookmark, FlaskConical } from "lucide-react";
import { PageHeader } from "@/components/shell/AppLayout";
import { Card, Button, Badge, Field, Input, Select, EmptyState, categoryTone } from "@/components/ui";
import { MaterialArt } from "@/art";
import { Material3D } from "@/components/material/Material3D";
import { MATERIALS, getMaterial } from "@/data/materials";
import { useApp } from "@/store/app";
import { scherrerDiameter, DEMO_DISCLAIMER } from "@/lib/science";
import { cn } from "@/lib/utils";

export default function MaterialDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const material = getMaterial(id);
  const { saved, toggleSaved, logActivity, pushToast, pushSearch } = useApp();

  const [compareId, setCompareId] = useState(() => MATERIALS.find((m) => m.id !== id)?.id ?? "");
  const [fwhm, setFwhm] = useState("0.5");
  const [theta, setTheta] = useState("20");
  const [lambda, setLambda] = useState("0.154");

  const grain = useMemo(
    () => scherrerDiameter({ fwhmDeg: Number(fwhm), thetaDeg: Number(theta), lambdaNm: Number(lambda) }),
    [fwhm, theta, lambda],
  );

  if (!material) {
    return (
      <div className="mx-auto max-w-3xl pt-10">
        <EmptyState
          icon={FlaskConical}
          title="Material not found"
          description="That material is not in the bundled sample catalogue. It may have been a stale link."
          action={
            <Link to="/explore">
              <Button variant="gradient">Back to Explore</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const compare = getMaterial(compareId);
  const isSaved = saved.includes(material.id);
  const peers = MATERIALS.filter((m) => m.id !== material.id && m.category === material.category).slice(0, 4);

  const propertyRows: { label: string; value: string }[] = [
    { label: "Electrical conductivity", value: material.properties.conductivity },
    { label: "Thermal conductivity", value: material.properties.thermalConductivity },
    { label: "Tensile strength", value: material.properties.tensileStrength },
    { label: "Band gap", value: material.properties.bandGap },
    { label: "Density", value: material.properties.density },
    { label: "Typical size", value: material.properties.size },
    { label: "Surface area", value: material.properties.surfaceArea },
    { label: "Melting point", value: material.properties.meltingPoint ?? "—" },
  ];

  const compareRows = [
    { label: "Electrical index", a: material.index.electrical, b: compare?.index.electrical ?? 0 },
    { label: "Thermal index", a: material.index.thermal, b: compare?.index.thermal ?? 0 },
    { label: "Tensile index", a: material.index.tensile, b: compare?.index.tensile ?? 0 },
    { label: "Band gap (eV)", a: material.numbers.bandGap, b: compare?.numbers.bandGap ?? 0, raw: true },
  ];

  return (
    <div className="mx-auto max-w-[1440px]">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ink-muted transition hover:text-ink"
      >
        <ArrowLeft className="size-4" /> Back
      </button>

      <Card className="overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-5">
          <div className="relative h-52 lg:col-span-2 lg:h-full lg:min-h-[240px]">
            <Material3D kind={material.art} accent={material.accent} className="h-full w-full" />
            <span className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/55 px-2.5 py-1 text-[10.5px] font-bold tracking-wide text-white backdrop-blur">
              Interactive 3D — drag to rotate
            </span>
          </div>
          <div className="p-6 lg:col-span-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={categoryTone(material.category)}>{material.category}</Badge>
              {material.biocompatible && <Badge tone="green">Biocompatible</Badge>}
              {material.trending && <Badge tone="violet">Trending</Badge>}
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink">{material.name}</h1>
            <p className="mt-1 text-sm text-ink-muted">
              {material.formula} · introduced {material.year}
            </p>
            <p className="mt-4 max-w-2xl text-[13.5px] leading-relaxed text-ink-soft">{material.description}</p>

            <div className="mt-5 flex flex-wrap gap-2.5">
              <Button
                variant="gradient"
                onClick={() => {
                  logActivity("simulation", `Simulation started · ${material.name}`, "From material detail");
                  navigate(`/simulation?material=${material.id}&auto=1`);
                }}
              >
                <Atom className="size-4" /> Run simulation
              </Button>
              <Button variant={isSaved ? "soft" : "secondary"} onClick={() => toggleSaved(material.id)}>
                <Bookmark className="size-4" fill={isSaved ? "currentColor" : "none"} />
                {isSaved ? "Saved" : "Save material"}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="mt-5 grid gap-5 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <h2 className="border-b border-line px-5 py-4 text-[15px] font-semibold text-ink">Property sheet</h2>
          <dl className="grid gap-x-6 gap-y-0 px-5 py-1 sm:grid-cols-2">
            {propertyRows.map((row) => (
              <div key={row.label} className="flex items-baseline justify-between gap-4 border-b border-line/60 py-3 last:border-0">
                <dt className="text-[12.5px] text-ink-muted">{row.label}</dt>
                <dd className="text-right text-[12.5px] font-medium text-ink">{row.value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <div className="space-y-5 lg:col-span-5">
          <Card>
            <h2 className="border-b border-line px-5 py-4 text-[15px] font-semibold text-ink">Side-by-side comparison</h2>
            <div className="space-y-4 px-5 py-4">
              <Field label="Compare with">
                <Select value={compareId} onChange={(e) => setCompareId(e.target.value)}>
                  {MATERIALS.filter((m) => m.id !== material.id).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </Select>
              </Field>
              {compare && (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-[1.2fr_1fr_1fr] gap-2 text-[11.5px] font-semibold text-ink-muted">
                    <span>Metric</span>
                    <span className="truncate text-right text-blue-soft">{material.name}</span>
                    <span className="truncate text-right text-violet">{compare.name}</span>
                  </div>
                  {compareRows.map((row) => (
                    <div key={row.label} className="grid grid-cols-[1.2fr_1fr_1fr] items-center gap-2 border-t border-line/60 py-2 text-[12.5px]">
                      <span className="text-ink-muted">{row.label}</span>
                      <span className={cn("text-right font-semibold tabular-nums", row.raw ? "text-ink" : row.a >= row.b ? "text-mint" : "text-ink-soft")}>
                        {row.raw ? `${row.a} eV` : row.a}
                      </span>
                      <span className={cn("text-right font-semibold tabular-nums", row.raw ? "text-ink" : row.b > row.a ? "text-mint" : "text-ink-soft")}>
                        {row.raw ? `${row.b} eV` : row.b}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <Card>
            <h2 className="border-b border-line px-5 py-4 text-[15px] font-semibold text-ink">Demo calculation · Scherrer grain size</h2>
            <div className="grid gap-3 px-5 py-4 sm:grid-cols-3">
              <Field label="FWHM β (°)">
                <Input type="number" step="0.01" min="0.01" value={fwhm} onChange={(e) => setFwhm(e.target.value)} />
              </Field>
              <Field label="θ (°)">
                <Input type="number" step="0.5" min="1" value={theta} onChange={(e) => setTheta(e.target.value)} />
              </Field>
              <Field label="λ (nm)">
                <Input type="number" step="0.001" min="0.001" value={lambda} onChange={(e) => setLambda(e.target.value)} />
              </Field>
            </div>
            <div className="mx-5 mb-5 flex items-center justify-between rounded-xl border border-line bg-panel/70 px-4 py-3">
              <span className="text-[12.5px] text-ink-muted">Estimated crystallite diameter</span>
              <span className="text-lg font-bold tabular-nums text-blue-soft">
                {Number.isFinite(grain) && grain > 0 ? grain.toFixed(2) : "—"} nm
              </span>
            </div>
            <p className="px-5 pb-5 text-[11px] leading-relaxed text-ink-muted">{DEMO_DISCLAIMER}</p>
          </Card>
        </div>

        <Card className="lg:col-span-7">
          <h2 className="border-b border-line px-5 py-4 text-[15px] font-semibold text-ink">Applications</h2>
          <div className="flex flex-wrap gap-2 px-5 py-4">
            {material.applications.map((app) => (
              <span key={app} className="rounded-full border border-line bg-panel/70 px-3.5 py-1.5 text-[12.5px] text-ink-soft">
                {app}
              </span>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-5">
          <h2 className="border-b border-line px-5 py-4 text-[15px] font-semibold text-ink">Related materials</h2>
          <ul className="divide-y divide-line/60 px-2">
            {(peers.length ? peers : MATERIALS.filter((m) => m.id !== material.id).slice(0, 4)).map((m) => (
              <li key={m.id}>
                <Link
                  to={`/materials/${m.id}`}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-white/5"
                  onClick={() => pushSearch(m.name)}
                >
                  <span className="h-10 w-14 shrink-0 overflow-hidden rounded-lg border border-line">
                    <MaterialArt kind={m.art} accent={m.accent} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-ink">{m.name}</span>
                    <span className="block truncate text-[11.5px] text-ink-muted">{m.tagline}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
