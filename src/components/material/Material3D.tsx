import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MaterialArt } from "@/art";
import type { ArtKind } from "@/data/materials";

type V3 = [number, number, number];

/* Per-material node layouts (unit-ish coordinates, memoized). */
function layoutFor(kind: ArtKind): V3[] {
  const pts: V3[] = [];
  if (kind === "lattice") {
    // Graphene-like hex sheet (flat, slight ripple)
    const s = 0.62;
    for (let row = -2; row <= 2; row++) {
      for (let col = -3; col <= 3; col++) {
        const x = col * s * 1.5 + (row % 2 ? s * 0.75 : 0);
        const z = row * s * 1.05;
        if (Math.hypot(x, z) > 2.1) continue;
        pts.push([x, Math.sin(x * 2.1) * 0.05, z]);
      }
    }
    return pts;
  }
  if (kind === "tube") {
    // Nanotube: rings around Y axis
    const rings = 9;
    const per = 10;
    const r = 0.85;
    for (let i = 0; i < rings; i++) {
      const y = (i / (rings - 1) - 0.5) * 3.2;
      for (let j = 0; j < per; j++) {
        const a = (j / per) * Math.PI * 2 + (i % 2 ? Math.PI / per : 0);
        pts.push([Math.cos(a) * r, y, Math.sin(a) * r]);
      }
    }
    return pts;
  }
  if (kind === "crystal") {
    // 3x3x3 cube lattice
    const n = 3;
    const s = 0.85;
    for (let x = 0; x < n; x++)
      for (let y = 0; y < n; y++)
        for (let z = 0; z < n; z++)
          pts.push([(x - 1) * s, (y - 1) * s, (z - 1) * s]);
    return pts;
  }
  if (kind === "wire") {
    // Vertical nanowire bundle
    const strands: V3[] = [[-0.5, 0, -0.3], [0.5, 0, -0.3], [0, 0, 0.5], [0, 0, -0.55]];
    for (const [sx, , sz] of strands) {
      for (let i = 0; i < 9; i++) pts.push([sx, (i / 8 - 0.5) * 3.1, sz]);
    }
    return pts;
  }
  if (kind === "quantum") {
    // Scattered glowing dots (deterministic)
    let seed = 42;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let i = 0; i < 26; i++) {
      const r = 0.6 + rand() * 1.5;
      const th = rand() * Math.PI * 2;
      const ph = Math.acos(2 * rand() - 1);
      pts.push([r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph) * 0.8, r * Math.sin(ph) * Math.sin(th)]);
    }
    return pts;
  }
  if (kind === "layer") {
    // 3 stacked sheets
    const s = 0.7;
    for (let layer = 0; layer < 3; layer++) {
      const y = (layer - 1) * 0.75;
      for (let row = -2; row <= 2; row++)
        for (let col = -2; col <= 2; col++) {
          const x = col * s;
          const z = row * s;
          if (Math.hypot(x, z) > 1.7) continue;
          pts.push([x, y, z]);
        }
    }
    return pts;
  }
  if (kind === "rod") {
    // Horizontal nanorod
    for (let i = 0; i < 14; i++) {
      const x = (i / 13 - 0.5) * 3.2;
      pts.push([x, 0, 0]);
      if (i % 2 === 0) {
        pts.push([x, 0.28, 0.12]);
        pts.push([x, -0.28, -0.12]);
      }
    }
    return pts;
  }
  // cluster: fibonacci sphere
  const count = 44;
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const th = golden * i;
    pts.push([Math.cos(th) * r * 1.5, y * 1.5, Math.sin(th) * r * 1.5]);
  }
  return pts;
}

function bondsFor(pts: V3[], cutoff: number): { position: V3; quaternion: THREE.Quaternion; length: number }[] {
  const out: { position: V3; quaternion: THREE.Quaternion; length: number }[] = [];
  const up = new THREE.Vector3(0, 1, 0);
  const va = new THREE.Vector3();
  const vb = new THREE.Vector3();
  for (let i = 0; i < pts.length; i++) {
    va.set(...pts[i]);
    for (let j = i + 1; j < pts.length; j++) {
      vb.set(...pts[j]);
      const d = va.distanceTo(vb);
      if (d < cutoff) {
        const dir = vb.clone().sub(va);
        const len = dir.length();
        out.push({
          position: [(va.x + vb.x) / 2, (va.y + vb.y) / 2, (va.z + vb.z) / 2],
          quaternion: new THREE.Quaternion().setFromUnitVectors(up, dir.normalize()),
          length: len,
        });
      }
    }
  }
  return out.slice(0, 320);
}

function Model({ kind, accent }: { kind: ArtKind; accent: string }) {
  const group = useRef<THREE.Group>(null);
  const drag = useRef<{ x: number; y: number; vx: number; vy: number; active: boolean }>({ x: 0, y: 0, vx: 0, vy: 0, active: false });
  const pts = useMemo(() => layoutFor(kind), [kind]);
  const bonds = useMemo(() => bondsFor(pts, kind === "quantum" ? 0.9 : 1.05), [pts, kind]);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const d = drag.current;
    if (!d.active) {
      g.rotation.y += delta * (0.35 + Math.min(2.5, Math.abs(d.vx)));
      g.rotation.x += d.vy * 0.02;
      d.vx *= 0.94;
      d.vy *= 0.94;
      g.rotation.x += (Math.sin(state.clock.elapsedTime * 0.2) * 0.18 - g.rotation.x) * 0.02;
    }
  });

  const nodeGeo = useMemo(() => new THREE.SphereGeometry(kind === "quantum" ? 0.09 : 0.11, 16, 16), [kind]);
  const bondGeo = useMemo(() => new THREE.CylinderGeometry(0.03, 0.03, 1, 6), []);
  const nodeMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(accent),
        metalness: 0.65,
        roughness: 0.28,
        emissive: new THREE.Color(accent),
        emissiveIntensity: 0.32,
      }),
    [accent],
  );
  const bondMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#8aa4e8", metalness: 0.5, roughness: 0.45, transparent: true, opacity: 0.75 }),
    [],
  );

  return (
    <group
      ref={group}
      onPointerDown={(e) => {
        e.stopPropagation();
        (e.target as Element).setPointerCapture?.(e.pointerId);
        drag.current = { ...drag.current, x: e.clientX, y: e.clientY, active: true, vx: 0, vy: 0 };
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d.active || !group.current) return;
        const dx = e.clientX - d.x;
        const dy = e.clientY - d.y;
        d.x = e.clientX;
        d.y = e.clientY;
        d.vx = dx * 0.02;
        d.vy = dy * 0.02;
        group.current.rotation.y += dx * 0.008;
        group.current.rotation.x += dy * 0.005;
      }}
      onPointerUp={() => {
        drag.current.active = false;
      }}
    >
      {bonds.map((b, i) => (
        <mesh key={`b${i}`} geometry={bondGeo} material={bondMat} position={b.position} quaternion={b.quaternion} scale={[1, b.length, 1]} />
      ))}
      {pts.map((p, i) => (
        <mesh key={`n${i}`} geometry={nodeGeo} material={nodeMat} position={p} />
      ))}
    </group>
  );
}

function supportsWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") ?? c.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Interactive per-material 3D structure. Falls back to 2D art without WebGL. */
export function Material3D({ kind, accent, className }: { kind: ArtKind; accent: string; className?: string }) {
  const [webgl] = useState(() => supportsWebGL());
  if (!webgl) {
    return <MaterialArt kind={kind} accent={accent} className={className} />;
  }
  return (
    <div className={className} style={{ background: "radial-gradient(80% 90% at 50% 40%, rgba(59,130,246,0.14) 0%, rgba(6,10,18,0) 70%)" }}>
      <Canvas dpr={[1, 1.75]} gl={{ antialias: true, alpha: true }} camera={{ position: [0, 0.6, 5.2], fov: 42 }} style={{ background: "transparent" }}>
        <ambientLight intensity={1.1} color="#bfdbfe" />
        <directionalLight position={[4, 3, 5]} intensity={2.4} color="#93c5fd" />
        <directionalLight position={[-5, -1.5, 2]} intensity={1.8} color="#c4b5fd" />
        <Model kind={kind} accent={accent} />
      </Canvas>
    </div>
  );
}
