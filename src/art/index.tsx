import { useMemo } from "react";
import { seededRandom, cn, hashSeed } from "@/lib/utils";
import type { ArtKind } from "@/data/materials";
import type { ResearchArt } from "@/data/research";

/* -------------------------------------------------------------------------- */
/*  Shared helpers                                                             */
/* -------------------------------------------------------------------------- */

function hexPoints(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(" ");
}

function Bokeh({ seed, accent, count = 7 }: { seed: number; accent: string; count?: number }) {
  const circles = useMemo(() => {
    const rnd = seededRandom(seed);
    return Array.from({ length: count }, () => ({
      cx: rnd() * 320,
      cy: rnd() * 200,
      r: 8 + rnd() * 34,
      o: 0.05 + rnd() * 0.12,
    }));
  }, [seed, count]);

  return (
    <g>
      {circles.map((c, i) => (
        <circle key={i} cx={c.cx} cy={c.cy} r={c.r} fill={accent} opacity={c.o} />
      ))}
    </g>
  );
}

function Frame({ children, accent, seed, className }: { children: React.ReactNode; accent: string; seed: number; className?: string }) {
  return (
    <svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" className={cn("h-full w-full", className)} aria-hidden="true">
      <defs>
        <linearGradient id={`bg-${seed}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0d1730" />
          <stop offset="55%" stopColor="#0a1122" />
          <stop offset="100%" stopColor="#060a14" />
        </linearGradient>
        <radialGradient id={`glow-${seed}`}>
          <stop offset="0%" stopColor={accent} stopOpacity="0.85" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`sh-${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.95" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.35" />
        </linearGradient>
      </defs>
      <rect width="320" height="200" fill={`url(#bg-${seed})`} />
      <Bokeh seed={seed} accent={accent} />
      {children}
      <rect width="320" height="200" fill={`url(#glow-${seed})`} opacity="0.1" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Material artwork                                                           */
/* -------------------------------------------------------------------------- */

function Lattice({ accent, seed }: { accent: string; seed: number }) {
  const hexes = useMemo(() => {
    const out: { cx: number; cy: number }[] = [];
    const r = 26;
    for (let row = -1; row < 8; row++) {
      for (let col = -1; col < 10; col++) {
        const cx = col * r * 1.5;
        const cy = row * r * Math.sqrt(3) + (col % 2 ? (r * Math.sqrt(3)) / 2 : 0);
        out.push({ cx, cy });
      }
    }
    return out;
  }, []);

  const nodes = useMemo(() => {
    const rnd = seededRandom(seed);
    return hexes.slice(0, 40).flatMap((h) => {
      const pts = hexPoints(h.cx, h.cy, 26)
        .split(" ")
        .map((p) => p.split(",").map(Number));
      return pts.filter(() => rnd() > 0.55);
    });
  }, [hexes, seed]);

  return (
    <g transform="translate(28,4) scale(0.98)">
      <g stroke={accent} strokeOpacity="0.4" strokeWidth="1.5" fill="none">
        {hexes.map((h, i) => (
          <polygon key={i} points={hexPoints(h.cx, h.cy, 26)} />
        ))}
      </g>
      <g fill={accent}>
        {nodes.map((n, i) => (
          <circle key={i} cx={n[0]} cy={n[1]} r={i % 5 === 0 ? 4.2 : 2.6} opacity={i % 5 === 0 ? 0.95 : 0.55} />
        ))}
      </g>
    </g>
  );
}

function Tube({ accent }: { accent: string }) {
  const rings = [40, 90, 140, 190, 240, 288];
  const strands = Array.from({ length: 7 }, (_, i) => i);
  return (
    <g transform="translate(10,18)">
      <ellipse cx="46" cy="80" rx="26" ry="62" fill="none" stroke={accent} strokeOpacity="0.55" strokeWidth="2" />
      {rings.map((x, i) => (
        <ellipse
          key={i}
          cx={x}
          cy={80}
          rx={i % 2 === 0 ? 18 : 26}
          ry="62"
          fill="none"
          stroke={accent}
          strokeOpacity={i % 2 === 0 ? 0.35 : 0.5}
          strokeWidth="1.4"
        />
      ))}
      <ellipse cx="288" cy="80" rx="26" ry="62" fill="#0a1122" stroke={accent} strokeOpacity="0.6" strokeWidth="2" />
      <g stroke={accent} strokeOpacity="0.45" strokeWidth="1.3" fill="none">
        {strands.map((s) => {
          const y = 24 + s * 18;
          return <path key={s} d={`M 40 ${y} C 110 ${y - 8}, 200 ${y + 10}, 286 ${y}`} />;
        })}
      </g>
      <g fill={accent} opacity="0.85">
        {strands.map((s) => (
          <circle key={s} cx={46} cy={24 + s * 18} r="3" />
        ))}
      </g>
    </g>
  );
}

function Cluster({ accent, seed }: { accent: string; seed: number }) {
  const balls = useMemo(() => {
    const rnd = seededRandom(seed);
    return Array.from({ length: 16 }, (_, i) => ({
      cx: 40 + rnd() * 240,
      cy: 30 + rnd() * 140,
      r: 14 + rnd() * 26,
      z: rnd(),
      i,
    }));
  }, [seed])
    .sort((a, b) => a.z - b.z);
  return (
    <g>
      {balls.map((b) => (
        <g key={b.i}>
          <circle cx={b.cx} cy={b.cy} r={b.r} fill={`url(#ball-${seed})`} opacity={0.75 + b.z * 0.25} />
          <circle cx={b.cx - b.r * 0.3} cy={b.cy - b.r * 0.35} r={b.r * 0.22} fill="#ffffff" opacity="0.5" />
        </g>
      ))}
      <defs>
        <radialGradient id={`ball-${seed}`} cx="35%" cy="30%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="35%" stopColor={accent} />
          <stop offset="100%" stopColor="#0b1224" />
        </radialGradient>
      </defs>
    </g>
  );
}

function Crystal({ accent, seed }: { accent: string; seed: number }) {
  const cubes = useMemo(() => {
    const rnd = seededRandom(seed);
    return Array.from({ length: 9 }, (_, i) => ({
      x: 50 + rnd() * 200,
      y: 50 + rnd() * 90,
      s: 20 + rnd() * 22,
      i,
    }));
  }, [seed]);

  const cube = (x: number, y: number, s: number, i: number) => {
    const h = s * 0.55;
    return (
      <g key={i} transform={`translate(${x},${y})`}>
        <polygon points={`0,${-h} ${s},0 0,${h} ${-s},0`} fill={accent} opacity="0.9" />
        <polygon points={`${-s},0 0,${h} 0,${h + s * 0.9} ${-s},${s * 0.9}`} fill={accent} opacity="0.45" />
        <polygon points={`${s},0 0,${h} 0,${h + s * 0.9} ${s},${s * 0.9}`} fill={accent} opacity="0.65" />
      </g>
    );
  };

  return (
    <g>
      {cubes.map((c) => cube(c.x, c.y, c.s, c.i))}
    </g>
  );
}

function Wires({ accent, seed }: { accent: string; seed: number }) {
  const wires = useMemo(() => {
    const rnd = seededRandom(seed);
    return Array.from({ length: 9 }, (_, i) => ({
      x: 30 + i * 32 + rnd() * 10,
      h: 90 + rnd() * 70,
      bend: (rnd() - 0.5) * 40,
      i,
    }));
  }, [seed]);

  return (
    <g fill="none" strokeLinecap="round">
      {wires.map((w) => (
        <g key={w.i}>
          <path
            d={`M ${w.x} 190 C ${w.x + w.bend} 140, ${w.x - w.bend} 110, ${w.x + w.bend * 0.4} ${190 - w.h}`}
            stroke={accent}
            strokeOpacity="0.75"
            strokeWidth="4"
          />
          <circle cx={w.x + w.bend * 0.4} cy={190 - w.h} r="5" fill="#ffffff" opacity="0.85" />
        </g>
      ))}
    </g>
  );
}

function QuantumDots({ accent, seed }: { accent: string; seed: number }) {
  const dots = useMemo(() => {
    const rnd = seededRandom(seed);
    const palette = ["#22d3ee", "#818cf8", accent, "#f472b6", "#34d399"];
    return Array.from({ length: 18 }, (_, i) => ({
      cx: 30 + rnd() * 260,
      cy: 25 + rnd() * 150,
      r: 6 + rnd() * 14,
      color: palette[i % palette.length],
      i,
    }));
  }, [seed, accent]);

  return (
    <g>
      {dots.map((d) => (
        <g key={d.i}>
          <circle cx={d.cx} cy={d.cy} r={d.r * 2.1} fill={d.color} opacity="0.13" />
          <circle cx={d.cx} cy={d.cy} r={d.r} fill={d.color} opacity="0.85" />
          <circle cx={d.cx - d.r * 0.3} cy={d.cy - d.r * 0.3} r={d.r * 0.28} fill="#fff" opacity="0.7" />
        </g>
      ))}
    </g>
  );
}

function Layers({ accent }: { accent: string }) {
  const sheets = [0, 1, 2];
  return (
    <g transform="translate(160,100)">
      {sheets.map((s) => (
        <g key={s} transform={`translate(0,${-46 + s * 40})`}>
          <polygon points="-120,-30 40,-64 130,-18 -30,16" fill={accent} opacity={0.14 + s * 0.05} stroke={accent} strokeOpacity="0.7" strokeWidth="1.6" />
          <g fill={accent} opacity="0.9">
            {Array.from({ length: 8 }, (_, i) => (
              <circle key={i} cx={-96 + i * 26} cy={-26 - i * 6 + 8} r="2.6" />
            ))}
          </g>
        </g>
      ))}
    </g>
  );
}

function Rods({ accent, seed }: { accent: string; seed: number }) {
  const rods = useMemo(() => {
    const rnd = seededRandom(seed);
    return Array.from({ length: 10 }, (_, i) => ({
      x: 24 + rnd() * 260,
      y: 30 + rnd() * 130,
      len: 40 + rnd() * 50,
      rot: -60 + rnd() * 120,
      w: 10 + rnd() * 8,
      i,
    }));
  }, [seed]);

  return (
    <g>
      {rods.map((r) => (
        <g key={r.i} transform={`translate(${r.x},${r.y}) rotate(${r.rot})`}>
          <rect x={-r.len / 2} y={-r.w / 2} width={r.len} height={r.w} rx={r.w / 2} fill={accent} opacity="0.8" />
          <rect x={-r.len / 2 + 4} y={-r.w / 2 + 2} width={r.len - 8} height={r.w * 0.3} rx={r.w * 0.15} fill="#ffffff" opacity="0.35" />
        </g>
      ))}
    </g>
  );
}

const MATERIAL_SEEDS: Record<ArtKind, number> = {
  lattice: 11,
  tube: 23,
  cluster: 37,
  crystal: 53,
  wire: 67,
  quantum: 83,
  layer: 97,
  rod: 113,
};

export function MaterialArt({
  kind,
  accent,
  className,
}: {
  kind: ArtKind;
  accent: string;
  className?: string;
}) {
  const seed = MATERIAL_SEEDS[kind] * 1000 + hashSeed(accent);
  return (
    <Frame accent={accent} seed={seed} className={className}>
      {kind === "lattice" && <Lattice accent={accent} seed={seed} />}
      {kind === "tube" && <Tube accent={accent} />}
      {kind === "cluster" && <Cluster accent={accent} seed={seed} />}
      {kind === "crystal" && <Crystal accent={accent} seed={seed} />}
      {kind === "wire" && <Wires accent={accent} seed={seed} />}
      {kind === "quantum" && <QuantumDots accent={accent} seed={seed} />}
      {kind === "layer" && <Layers accent={accent} />}
      {kind === "rod" && <Rods accent={accent} seed={seed} />}
    </Frame>
  );
}

/* -------------------------------------------------------------------------- */
/*  Research artwork                                                           */
/* -------------------------------------------------------------------------- */

export type { ResearchArt };

export function ResearchThumb({ kind, accent, className }: { kind: ResearchArt; accent: string; className?: string }) {
  const seed = hashSeed(kind + accent);
  return (
    <Frame accent={accent} seed={seed} className={className}>
      {kind === "energy" && (
        <g transform="translate(160,104)">
          <circle r="44" fill={`url(#glow-${seed})`} opacity="0.5" />
          <g stroke={accent} strokeWidth="4" strokeLinecap="round" opacity="0.9">
            <path d="M0 0 L0 -46" />
            <path d="M0 0 L40 24" />
            <path d="M0 0 L-40 24" />
          </g>
          <circle r="9" fill="#ffffff" opacity="0.9" />
          <g stroke={accent} strokeOpacity="0.5" strokeWidth="2" fill="none">
            <circle r="72" strokeDasharray="6 10" />
          </g>
        </g>
      )}
      {kind === "graphene" && (
        <g transform="translate(30,-6) scale(0.86)">
          <g stroke={accent} strokeOpacity="0.5" strokeWidth="1.6" fill="none">
            {Array.from({ length: 36 }, (_, i) => {
              const col = i % 6;
              const row = Math.floor(i / 6);
              return <polygon key={i} points={hexPoints(30 + col * 52 + (row % 2 ? 26 : 0), 40 + row * 45, 26)} />;
            })}
          </g>
          <g fill={accent}>
            <circle cx="82" cy="85" r="7" />
            <circle cx="186" cy="40" r="5" />
          </g>
        </g>
      )}
      {kind === "medicine" && (
        <g transform="translate(160,100)">
          <circle r="58" fill={accent} opacity="0.14" />
          <circle r="58" fill="none" stroke={accent} strokeOpacity="0.7" strokeWidth="2.5" />
          <circle r="20" cx="-8" cy="-6" fill={accent} opacity="0.85" />
          <g transform="translate(46,44) rotate(-32)">
            <rect x="-34" y="-13" width="68" height="26" rx="13" fill="#ffffff" opacity="0.92" />
            <path d="M0 -13 h21 a13 13 0 0 1 0 26 H0 z" fill={accent} />
          </g>
          <g fill={accent} opacity="0.7">
            <circle cx="-52" cy="34" r="5" />
            <circle cx="34" cy="-46" r="4" />
          </g>
        </g>
      )}
      {kind === "future" && (
        <g transform="translate(160,100)">
          <circle r="34" fill={accent} opacity="0.28" />
          <circle r="18" fill={accent} opacity="0.9" />
          <g stroke={accent} strokeWidth="2.4" fill="none" opacity="0.85">
            <ellipse rx="76" ry="30" />
            <ellipse rx="76" ry="30" transform="rotate(60)" />
            <ellipse rx="76" ry="30" transform="rotate(-60)" />
          </g>
          <g fill="#ffffff">
            <circle cx="76" cy="0" r="5" />
            <circle cx="-38" cy="-26" r="4" />
          </g>
        </g>
      )}
      {kind === "quantum" && (
        <g transform="translate(160,100)">
          {[64, 46, 30, 16].map((r, i) => (
            <circle key={r} r={r} fill="none" stroke={accent} strokeOpacity={0.25 + i * 0.16} strokeWidth="3" />
          ))}
          <circle r="9" fill="#ffffff" opacity="0.95" />
          <circle cx="64" cy="0" r="7" fill={accent} />
          <circle cx="-32" cy="-39" r="5" fill="#22d3ee" />
        </g>
      )}
      {kind === "coating" && (
        <g transform="translate(160,104)">
          <g fill={accent}>
            <rect x="-96" y="10" width="192" height="16" rx="8" opacity="0.55" />
            <rect x="-96" y="-14" width="192" height="16" rx="8" opacity="0.75" />
            <rect x="-96" y="-38" width="192" height="16" rx="8" opacity="0.95" />
          </g>
          <g transform="translate(52,-64)">
            <path d="M0 0 C 16 20, 24 30, 24 42 a24 24 0 0 1 -48 0 C -24 30, -16 20, 0 0 z" fill="#ffffff" opacity="0.9" />
          </g>
        </g>
      )}
    </Frame>
  );
}

/* -------------------------------------------------------------------------- */
/*  Avatar + promo                                                             */
/* -------------------------------------------------------------------------- */

const AVATAR_GRADIENTS: [string, string, string][] = [
  ["#38bdf8", "#6366f1", "#a855f7"],
  ["#34d399", "#10b981", "#059669"],
  ["#fbbf24", "#f59e0b", "#d97706"],
  ["#fb7185", "#e11d48", "#be123c"],
  ["#22d3ee", "#0ea5e9", "#2563eb"],
];

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function Avatar({ name = "Guest", className, size = 40 }: { name?: string; className?: string; size?: number }) {
  const seed = Math.abs(hashSeed(name));
  const grad = AVATAR_GRADIENTS[seed % AVATAR_GRADIENTS.length];
  const gradientId = `avatar-grad-${seed}`;
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={cn("rounded-full", className)} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={grad[0]} />
          <stop offset="55%" stopColor={grad[1]} />
          <stop offset="100%" stopColor={grad[2]} />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="32" fill={`url(#${gradientId})`} />
      <text
        x="32"
        y="33"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#0b1224"
        fontSize="24"
        fontWeight="700"
        fontFamily="Inter, system-ui, sans-serif"
      >
        {initialsOf(name)}
      </text>
    </svg>
  );
}

export function PromoMolecule({ className }: { className?: string }) {
  const nodes = useMemo(() => {
    const rnd = seededRandom(7);
    return Array.from({ length: 10 }, (_, i) => ({
      x: 20 + rnd() * 200,
      y: 16 + rnd() * 120,
      r: 4 + rnd() * 7,
      i,
    }));
  }, []);
  const links = useMemo(() => {
    const out: [number, number][] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
        if (d < 84) out.push([i, j]);
      }
    }
    return out;
  }, [nodes]);

  return (
    <svg viewBox="0 0 240 150" className={className} aria-hidden="true">
      <g stroke="#60a5fa" strokeOpacity="0.45" strokeWidth="1.6">
        {links.map(([a, b], i) => (
          <line key={i} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y} />
        ))}
      </g>
      <g fill="#38bdf8">
        {nodes.map((n) => (
          <g key={n.i}>
            <circle cx={n.x} cy={n.y} r={n.r * 2.4} fill="#3b82f6" opacity="0.16" />
            <circle cx={n.x} cy={n.y} r={n.r} opacity="0.95" />
          </g>
        ))}
      </g>
    </svg>
  );
}
