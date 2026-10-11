import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* Fibonacci-sphere node cloud + proximity bonds → ball-and-stick cluster. */
function buildStructure(nodeCount = 42, radius = 1.65) {
  const nodes: THREE.Vector3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < nodeCount; i++) {
    const y = 1 - (i / (nodeCount - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;
    nodes.push(new THREE.Vector3(Math.cos(theta) * r * radius, y * radius, Math.sin(theta) * r * radius));
  }

  const bonds: { position: [number, number, number]; rotation: [number, number, number]; length: number }[] = [];
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dist = nodes[i].distanceTo(nodes[j]);
      if (dist < radius * 0.62) {
        const dir = new THREE.Vector3().subVectors(nodes[j], nodes[i]);
        const length = dir.length();
        const quat = new THREE.Quaternion().setFromUnitVectors(up, dir.clone().normalize());
        const euler = new THREE.Euler().setFromQuaternion(quat);
        bonds.push({
          position: [
            (nodes[i].x + nodes[j].x) / 2,
            (nodes[i].y + nodes[j].y) / 2,
            (nodes[i].z + nodes[j].z) / 2,
          ],
          rotation: [euler.x, euler.y, euler.z],
          length,
        });
      }
    }
  }
  return { nodes, bonds };
}

function Particles({ count = 140 }: { count?: number }) {
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    let seed = 9;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let i = 0; i < count; i++) {
      const r = 2.1 + rand() * 1.7;
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [count]);

  const pointsRef = useRef<THREE.Points>(null);
  useFrame((state) => {
    if (pointsRef.current) pointsRef.current.rotation.y = state.clock.elapsedTime * 0.03;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.035} color="#7dd3fc" transparent opacity={0.75} sizeAttenuation depthWrite={false} />
    </points>
  );
}

function Structure({ autorotate }: { autorotate: boolean }) {
  const { nodes, bonds } = useMemo(() => buildStructure(), []);
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    const g = groupRef.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    if (autorotate) g.rotation.y += delta * 0.16;
    g.rotation.x = Math.sin(t * 0.18) * 0.14;
    g.position.y = Math.sin(t * 0.5) * 0.06;
  });

  const sphereGeometry = useMemo(() => new THREE.SphereGeometry(0.13, 24, 24), []);
  const bondGeometry = useMemo(() => new THREE.CylinderGeometry(0.035, 0.035, 1, 8), []);
  const blueMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#5b8ff9", metalness: 0.72, roughness: 0.25, emissive: "#1d4ed8", emissiveIntensity: 0.28 }),
    [],
  );
  const violetMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#a78bfa", metalness: 0.68, roughness: 0.28, emissive: "#6d28d9", emissiveIntensity: 0.3 }),
    [],
  );
  const bondMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#8aa4e8", metalness: 0.5, roughness: 0.4, emissive: "#312e81", emissiveIntensity: 0.18 }),
    [],
  );

  return (
    <group ref={groupRef}>
      {bonds.map((b, i) => (
        <mesh key={`b-${i}`} geometry={bondGeometry} material={bondMaterial} position={b.position} rotation={b.rotation} scale={[1, b.length, 1]} />
      ))}
      {nodes.map((n, i) => (
        <mesh key={`n-${i}`} geometry={sphereGeometry} material={i % 4 === 0 ? violetMaterial : blueMaterial} position={[n.x, n.y, n.z]} />
      ))}
    </group>
  );
}

/** Projection fallback when WebGL is unavailable or motion is reduced. */
function StaticMolecule() {
  const { nodes, bonds } = useMemo(() => buildStructure(38, 1.6), []);

  const projected = useMemo(() => {
    const ry = 0.7;
    const rx = 0.32;
    const view = (v: THREE.Vector3) => {
      const x1 = v.x * Math.cos(ry) + v.z * Math.sin(ry);
      const z1 = -v.x * Math.sin(ry) + v.z * Math.cos(ry);
      const y2 = v.y * Math.cos(rx) - z1 * Math.sin(rx);
      const z2 = v.y * Math.sin(rx) + z1 * Math.cos(rx);
      return new THREE.Vector3(x1, y2, z2);
    };
    const project = (v: THREE.Vector3) => {
      const p = 3.4 / Math.max(4.6 - v.z, 0.9);
      return { x: 120 + v.x * 44 * p, y: 90 + v.y * 44 * p, r: 5.2 * p, depth: v.z };
    };

    const spherePoints = nodes.map((n) => project(view(n)));
    const bondLines = bonds.map((b) => {
      const mid = new THREE.Vector3(b.position[0], b.position[1], b.position[2]);
      const rot = new THREE.Euler(b.rotation[0], b.rotation[1], b.rotation[2]);
      const dir = new THREE.Vector3(0, 1, 0).applyEuler(rot).multiplyScalar(b.length / 2);
      const a = project(view(new THREE.Vector3().subVectors(mid, dir)));
      const c = project(view(new THREE.Vector3().addVectors(mid, dir)));
      return { a, c, depth: (a.depth + c.depth) / 2 };
    });

    return { spherePoints, bondLines };
  }, [nodes, bonds]);

  return (
    <svg viewBox="0 0 240 180" className="h-full w-full" aria-hidden="true">
      <g stroke="#64748b" strokeOpacity="0.55" strokeWidth="1.5" strokeLinecap="round">
        {projected.bondLines.map((l, i) => (
          <line key={i} x1={l.a.x} y1={l.a.y} x2={l.c.x} y2={l.c.y} opacity={0.5 + Math.max(0, l.depth) * 0.25} />
        ))}
      </g>
      <g>
        {[...projected.spherePoints]
          .map((p, i) => ({ ...p, i }))
          .sort((a, b) => a.depth - b.depth)
          .map((p) => (
            <g key={p.i}>
              <circle cx={p.x} cy={p.y} r={p.r * 1.9} fill="#3b82f6" opacity="0.16" />
              <circle cx={p.x} cy={p.y} r={p.r} fill={p.i % 4 === 0 ? "#a78bfa" : "#60a5fa"} opacity={0.85 + Math.max(0, p.depth) * 0.1} />
              <circle cx={p.x - p.r * 0.3} cy={p.y - p.r * 0.35} r={p.r * 0.28} fill="#fff" opacity="0.6" />
            </g>
          ))}
      </g>
    </svg>
  );
}

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export function Molecule3D({ className, reduced = false }: { className?: string; reduced?: boolean }) {
  const [webgl] = useState(() => supportsWebGL());

  if (!webgl || reduced) {
    return (
      <div className={className}>
        <StaticMolecule />
      </div>
    );
  }

  return (
    <div className={className}>
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 0, 5.4], fov: 44 }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={1.05} color="#bfdbfe" />
        <directionalLight position={[4, 3, 5]} intensity={2.6} color="#93c5fd" />
        <directionalLight position={[-5, -1.5, 2]} intensity={2.2} color="#c4b5fd" />
        <pointLight position={[0, 2.4, -2.6]} intensity={18} distance={12} decay={2} color="#67e8f9" />
        <Structure autorotate={!reduced} />
        <Particles />
      </Canvas>
    </div>
  );
}
