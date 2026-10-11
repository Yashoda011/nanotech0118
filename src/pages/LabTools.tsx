import { useState } from "react";
import { Calculator, Ruler, TestTube, Waves, ScanLine, CircleDot, Scale } from "lucide-react";
import { PageHeader } from "@/components/shell/AppLayout";
import { Card, Field, Input } from "@/components/ui";
import { scherrerDiameter, dilutionVolume, evToWavelength, wavelengthToEv, DEMO_DISCLAIMER } from "@/lib/science";
import { cn } from "@/lib/utils";

function ResultRow({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-line bg-panel/70 px-4 py-3">
      <span className="text-[12.5px] text-ink-muted">{label}</span>
      <span className="text-[15px] font-bold tabular-nums text-blue-soft">
        {value} <span className="text-[12px] font-medium text-ink-muted">{unit}</span>
      </span>
    </div>
  );
}

/* ---------------- Related schematic pictures (inline SVG) ---------------- */

function XrdPeakArt({ fwhm }: { fwhm: number }) {
  const w = Math.max(14, Math.min(90, fwhm * 60));
  return (
    <svg viewBox="0 0 300 110" className="h-28 w-full" role="img" aria-label="XRD peak with broadening">
      <line x1="14" y1="96" x2="290" y2="96" stroke="#1a2540" strokeWidth="1.5" />
      <line x1="14" y1="10" x2="14" y2="96" stroke="#1a2540" strokeWidth="1.5" />
      <path d="M14 92 C 90 90, 120 88, 138 40 C 150 12, 162 12, 174 40 C 192 88, 222 90, 290 92" fill="none" stroke="#60a5fa" strokeWidth="2.5" />
      <line x1={150 - w / 2} y1="52" x2={150 + w / 2} y2="52" stroke="#fbbf24" strokeWidth="2" strokeDasharray="5 4" />
      <polygon points={`${150 - w / 2 - 5},52 ${150 - w / 2 + 3},48 ${150 - w / 2 + 3},56`} fill="#fbbf24" />
      <polygon points={`${150 + w / 2 + 5},52 ${150 + w / 2 - 3},48 ${150 + w / 2 - 3},56`} fill="#fbbf24" />
      <text x="150" y="70" textAnchor="middle" fill="#fbbf24" fontSize="11">β FWHM</text>
      <text x="150" y="24" textAnchor="middle" fill="#6d7b93" fontSize="11">2θ peak</text>
    </svg>
  );
}

function DilutionArt({ ratio }: { ratio: number }) {
  const r = Math.max(0.05, Math.min(1, ratio));
  return (
    <svg viewBox="0 0 300 110" className="h-28 w-full" role="img" aria-label="Concentrated stock diluted to working solution">
      <g>
        <path d="M60 18 h36 v22 l14 44 a8 8 0 0 1 -8 10 h-44 a8 8 0 0 1 -8 -10 l14 -44 z" fill="none" stroke="#34d399" strokeWidth="2" />
        <rect x="56" y={86 - 52 * r} width="48" height={52 * r} rx="4" fill="#34d399" opacity="0.75" />
        <text x="80" y="106" textAnchor="middle" fill="#6d7b93" fontSize="11">C₁ stock</text>
      </g>
      <line x1="130" y1="55" x2="170" y2="55" stroke="#6d7b93" strokeWidth="2" strokeDasharray="6 4" />
      <polygon points="170,55 162,51 162,59" fill="#6d7b93" />
      <g>
        <path d="M196 18 h36 v22 l14 44 a8 8 0 0 1 -8 10 h-44 a8 8 0 0 1 -8 -10 l14 -44 z" fill="none" stroke="#34d399" strokeWidth="2" />
        <rect x="192" y="34" width="48" height="52" rx="4" fill="#34d399" opacity={0.12 + r * 0.15} />
        <text x="216" y="106" textAnchor="middle" fill="#6d7b93" fontSize="11">C₂ working</text>
      </g>
    </svg>
  );
}

function SpectrumArt({ nm }: { nm: number }) {
  const x = Math.max(8, Math.min(292, ((Math.min(780, Math.max(380, nm)) - 380) / 400) * 284 + 8));
  return (
    <svg viewBox="0 0 300 110" className="h-28 w-full" role="img" aria-label="Visible spectrum with wavelength marker">
      <defs>
        <linearGradient id="spec" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="25%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor="#22d3ee" />
          <stop offset="70%" stopColor="#a3e635" />
          <stop offset="85%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
      </defs>
      <rect x="8" y="34" width="284" height="30" rx="8" fill="url(#spec)" opacity="0.85" />
      <line x1={x} y1="24" x2={x} y2="74" stroke="#fff" strokeWidth="2.5" />
      <polygon points={`${x - 6},22 ${x + 6},22 ${x},30`} fill="#fff" />
      <text x="8" y="90" fill="#6d7b93" fontSize="11">380 nm</text>
      <text x="292" y="90" textAnchor="end" fill="#6d7b93" fontSize="11">780 nm</text>
      <text x={Math.min(250, Math.max(40, x))} y="18" textAnchor="middle" fill="#e8eefb" fontSize="12" fontWeight="700">{nm} nm</text>
    </svg>
  );
}

function BraggArt({ theta }: { theta: number }) {
  const t = Math.max(5, Math.min(60, theta));
  const dx = 34 * Math.cos((t * Math.PI) / 180);
  const dy = 34 * Math.sin((t * Math.PI) / 180);
  return (
    <svg viewBox="0 0 300 110" className="h-28 w-full" role="img" aria-label="Bragg diffraction from crystal planes">
      {[0, 1, 2].map((i) => (
        <line key={i} x1="30" y1={34 + i * 22} x2="270" y2={34 + i * 22} stroke="#818cf8" strokeWidth="2" strokeOpacity={0.8} />
      ))}
      <line x1={120 - dx} y1={56 - dy} x2="120" y2="56" stroke="#fbbf24" strokeWidth="2.5" />
      <line x1="120" y1="56" x2={120 + dx} y2={56 - dy} stroke="#fbbf24" strokeWidth="2.5" />
      <line x1={120 - dx} y1={78 - dy} x2="120" y2="78" stroke="#fbbf24" strokeWidth="2" strokeOpacity="0.6" />
      <line x1="120" y1="78" x2={120 + dx} y2={78 - dy} stroke="#fbbf24" strokeWidth="2" strokeOpacity="0.6" />
      <path d={`M 120 56 m -16 0 a 16 16 0 0 0 12 12`} fill="none" stroke="#e8eefb" strokeWidth="1.5" />
      <text x="142" y="72" fill="#e8eefb" fontSize="11">θ</text>
      <text x="30" y="104" fill="#6d7b93" fontSize="11">lattice planes · spacing d</text>
    </svg>
  );
}

function SphereArt({ radius }: { radius: number }) {
  const r = Math.max(14, Math.min(40, radius));
  return (
    <svg viewBox="0 0 300 110" className="h-28 w-full" role="img" aria-label="Nanoparticle sphere with radius">
      <defs>
        <radialGradient id="nano-ball" cx="35%" cy="30%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="40%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0b1224" />
        </radialGradient>
      </defs>
      <circle cx="110" cy="55" r={r} fill="url(#nano-ball)" />
      <line x1="110" y1="55" x2={110 + r} y2="55" stroke="#fbbf24" strokeWidth="2" strokeDasharray="5 3" />
      <text x={112 + r} y="50" fill="#fbbf24" fontSize="11">r</text>
      <text x="200" y="40" fill="#6d7b93" fontSize="11">S = 4πr²</text>
      <text x="200" y="58" fill="#6d7b93" fontSize="11">V = ⁴⁄₃πr³</text>
      <text x="200" y="76" fill="#60a5fa" fontSize="12" fontWeight="700">S/V = 3/r</text>
    </svg>
  );
}

function FlaskArt() {
  return (
    <svg viewBox="0 0 300 110" className="h-28 w-full" role="img" aria-label="Volumetric flask for solution preparation">
      <path d="M132 12 h36 v26 l26 48 a10 10 0 0 1 -9 14 h-70 a10 10 0 0 1 -9 -14 z" fill="none" stroke="#c084fc" strokeWidth="2" />
      <path d="M124 66 h52 l14 24 a6 6 0 0 1 -5 8 h-70 a6 6 0 0 1 -5 -8 z" fill="#c084fc" opacity="0.55" />
      <line x1="150" y1="12" x2="150" y2="38" stroke="#6d7b93" strokeWidth="1.5" strokeDasharray="3 3" />
      <text x="196" y="50" fill="#6d7b93" fontSize="11">m = M·V·MW</text>
      <text x="196" y="66" fill="#6d7b93" fontSize="11">M: mol/L</text>
      <text x="196" y="82" fill="#6d7b93" fontSize="11">V: litres</text>
    </svg>
  );
}

function ToolCard({
  icon: Icon,
  title,
  description,
  accent,
  art,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  accent: string;
  art?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col">
      <div className="flex items-start gap-3 border-b border-line px-5 py-4">
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", accent)}>
          <Icon className="size-5" />
        </span>
        <div>
          <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
          <p className="mt-0.5 text-[12px] leading-relaxed text-ink-muted">{description}</p>
        </div>
      </div>
      {art && <div className="border-b border-line bg-void/50 px-3 pt-2">{art}</div>}
      <div className="flex flex-1 flex-col gap-4 px-5 py-4">{children}</div>
    </Card>
  );
}

export default function LabToolsPage() {
  const [fwhm, setFwhm] = useState("0.42");
  const [theta, setTheta] = useState("25");
  const [lambda, setLambda] = useState("0.154");

  const [c1, setC1] = useState("10");
  const [v1, setV1] = useState("100");
  const [c2, setC2] = useState("1");

  const [nm, setNm] = useState("450");

  // Bragg d-spacing: nλ = 2d·sinθ  →  d = λ / (2·sinθ)
  const [braggTheta, setBraggTheta] = useState("20");
  const [braggLambda, setBraggLambda] = useState("0.154");
  const braggD = (() => {
    const t = ((Number(braggTheta) || 0) * Math.PI) / 180;
    const l = Number(braggLambda) || 0;
    const s = Math.sin(t);
    return s > 0 && l > 0 ? l / (2 * s) : 0;
  })();

  // Surface-to-volume ratio of a sphere: S/V = 3 / r
  const [radius, setRadius] = useState("25");
  const sv = (() => {
    const r = Number(radius) || 0;
    return r > 0 ? 3 / r : 0;
  })();

  // Solution prep mass: m(g) = M(mol/L) · V(L) · MW(g/mol)
  const [molarity, setMolarity] = useState("0.1");
  const [volMl, setVolMl] = useState("500");
  const [mw, setMw] = useState("58.44");
  const mass = (Number(molarity) || 0) * ((Number(volMl) || 0) / 1000) * (Number(mw) || 0);

  const grain = scherrerDiameter({ fwhmDeg: Number(fwhm) || 0, thetaDeg: Number(theta) || 0, lambdaNm: Number(lambda) || 0 });
  const vol = dilutionVolume({ c1: Number(c1) || 0, v1: Number(v1) || 0, c2: Number(c2) || 0 });
  const ev = wavelengthToEv(Number(nm) || 0);

  return (
    <div className="mx-auto max-w-[1440px]">
      <PageHeader
        title="Lab Tools"
        subtitle="Instant utilities built on well-known equations. Real formulas, illustrative context — results update as you type."
        actions={<span className="text-[12px] text-ink-muted">{DEMO_DISCLAIMER}</span>}
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <ToolCard
          icon={Ruler}
          title="Scherrer grain size"
          description="D = K·λ / (β·cos θ) from XRD peak broadening."
          accent="bg-blue/15 text-blue-soft"
          art={<XrdPeakArt fwhm={Number(fwhm) || 0.42} />}
        >
          <Field label="FWHM β (°)">
            <Input type="number" step="0.01" min="0.01" value={fwhm} onChange={(e) => setFwhm(e.target.value)} />
          </Field>
          <Field label="Bragg angle θ (°)">
            <Input type="number" step="0.5" min="1" value={theta} onChange={(e) => setTheta(e.target.value)} />
          </Field>
          <Field label="Wavelength λ (nm) — Cu Kα = 0.154">
            <Input type="number" step="0.001" min="0.001" value={lambda} onChange={(e) => setLambda(e.target.value)} />
          </Field>
          <ResultRow label="Crystallite diameter" value={grain > 0 && Number.isFinite(grain) ? grain.toFixed(2) : "—"} unit="nm" />
        </ToolCard>

        <ToolCard
          icon={ScanLine}
          title="Bragg d-spacing"
          description="nλ = 2d·sin θ — interplanar spacing from diffraction angle."
          accent="bg-indigo/15 text-indigo-300"
          art={<BraggArt theta={Number(braggTheta) || 20} />}
        >
          <Field label="Bragg angle θ (°)">
            <Input type="number" step="0.5" min="1" value={braggTheta} onChange={(e) => setBraggTheta(e.target.value)} />
          </Field>
          <Field label="Wavelength λ (nm)">
            <Input type="number" step="0.001" min="0.001" value={braggLambda} onChange={(e) => setBraggLambda(e.target.value)} />
          </Field>
          <ResultRow label="Plane spacing d" value={braggD > 0 && Number.isFinite(braggD) ? braggD.toFixed(3) : "—"} unit="nm" />
          <p className="text-[11.5px] text-ink-muted">Pairs with Scherrer above: same θ and λ inputs feed both equations.</p>
        </ToolCard>

        <ToolCard
          icon={TestTube}
          title="Dilution calculator"
          description="C₁·V₁ = C₂·V₂ stock volume required."
          accent="bg-mint/15 text-mint"
          art={<DilutionArt ratio={(Number(c2) || 0) / Math.max(Number(c1) || 1, 0.0001)} />}
        >
          <Field label="Stock concentration C₁">
            <Input type="number" step="0.1" min="0" value={c1} onChange={(e) => setC1(e.target.value)} />
          </Field>
          <Field label="Final volume V₁ (mL)">
            <Input type="number" step="1" min="0" value={v1} onChange={(e) => setV1(e.target.value)} />
          </Field>
          <Field label="Desired concentration C₂">
            <Input type="number" step="0.1" min="0" value={c2} onChange={(e) => setC2(e.target.value)} />
          </Field>
          <ResultRow label="Stock needed" value={vol > 0 && Number.isFinite(vol) ? vol.toFixed(2) : "—"} unit="mL" />
          <p className="text-[11.5px] text-ink-muted">
            Solvent to add:{" "}
            <span className="font-semibold text-ink-soft">
              {vol > 0 && Number.isFinite(vol) && Number(v1) > vol ? (Number(v1) - vol).toFixed(2) : "—"} mL
            </span>
          </p>
        </ToolCard>

        <ToolCard
          icon={Scale}
          title="Solution prep mass"
          description="m = M·V·MW — weigh-out for a target molarity."
          accent="bg-purple/15 text-purple-300"
          art={<FlaskArt />}
        >
          <Field label="Target molarity M (mol/L)">
            <Input type="number" step="0.01" min="0" value={molarity} onChange={(e) => setMolarity(e.target.value)} />
          </Field>
          <Field label="Final volume (mL)">
            <Input type="number" step="10" min="0" value={volMl} onChange={(e) => setVolMl(e.target.value)} />
          </Field>
          <Field label="Molar mass MW (g/mol)">
            <Input type="number" step="0.01" min="0" value={mw} onChange={(e) => setMw(e.target.value)} />
          </Field>
          <ResultRow label="Mass to weigh" value={mass > 0 && Number.isFinite(mass) ? mass.toFixed(3) : "—"} unit="g" />
        </ToolCard>

        <ToolCard
          icon={CircleDot}
          title="Nanoparticle S/V ratio"
          description="S/V = 3/r — why smaller particles react faster."
          accent="bg-cyan/15 text-cyan"
          art={<SphereArt radius={Number(radius) || 25} />}
        >
          <Field label="Particle radius r (nm)">
            <Input type="number" step="1" min="1" value={radius} onChange={(e) => setRadius(e.target.value)} />
          </Field>
          <ResultRow label="Surface-to-volume" value={sv > 0 && Number.isFinite(sv) ? sv.toFixed(3) : "—"} unit="nm⁻¹" />
          <p className="text-[11.5px] text-ink-muted">
            Halving the radius doubles S/V — the core reason 5 nm catalysts outperform 50 nm ones.
          </p>
        </ToolCard>

        <ToolCard
          icon={Waves}
          title="Photon energy converter"
          description="E (eV) = 1239.84 / λ (nm)."
          accent="bg-violet/15 text-violet"
          art={<SpectrumArt nm={Number(nm) || 450} />}
        >
          <Field label="Wavelength λ (nm)">
            <Input type="number" step="1" min="1" value={nm} onChange={(e) => setNm(e.target.value)} />
          </Field>
          <ResultRow label="Photon energy" value={ev > 0 && Number.isFinite(ev) ? ev.toFixed(3) : "—"} unit="eV" />
          <div className="rounded-xl border border-line bg-panel/70 px-4 py-3 text-[12px] leading-relaxed text-ink-muted">
            {Number(nm) >= 380 && Number(nm) <= 750
              ? "Inside the visible spectrum — useful context for photocatalytic band-gap screening."
              : Number(nm) < 380
                ? "Ultraviolet — relevant for TiO₂ and ZnO photocatalysis."
                : "Infrared — below typical semiconductor band-gap energies."}
          </div>
          <p className="text-[11.5px] text-ink-muted">
            Reverse: {ev > 0 && Number.isFinite(ev) ? evToWavelength(ev).toFixed(0) : "—"} nm at{" "}
            {ev > 0 && Number.isFinite(ev) ? ev.toFixed(3) : "—"} eV.
          </p>
        </ToolCard>
      </div>

      <Card className="mt-5 flex items-start gap-3 p-5">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold">
          <Calculator className="size-4.5" />
        </span>
        <p className="text-[12.5px] leading-relaxed text-ink-muted">
          These tools run entirely in your browser with no network calls. They implement textbook equations directly, but the
          inputs you type are yours — always cross-check values against your instrument calibration and primary literature.
        </p>
      </Card>
    </div>
  );
}
