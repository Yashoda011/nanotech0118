/**
 * Demo science utilities.
 *
 * Everything in this file is an *illustrative* model used for UI demos only.
 * It is not a validated solver and must not be used for real lab decisions.
 */

export const DEMO_DISCLAIMER =
  "Illustrative demo model — results are generated for interface demonstration and are not scientifically validated.";

/** Scherrer equation: crystallite size D = K·λ / (β·cosθ) */
export function scherrerDiameter(opts: { fwhmDeg: number; thetaDeg: number; lambdaNm: number; k?: number }): number {
  const { fwhmDeg, thetaDeg, lambdaNm, k = 0.9 } = opts;
  if (fwhmDeg <= 0 || thetaDeg <= 0 || lambdaNm <= 0) return 0;
  const beta = (fwhmDeg * Math.PI) / 180;
  const theta = (thetaDeg * Math.PI) / 180;
  return (k * lambdaNm) / (beta * Math.cos(theta));
}

/** C1·V1 = C2·V2 → volume of stock required. */
export function dilutionVolume(opts: { c1: number; v1: number; c2: number }): number {
  const { c1, v1, c2 } = opts;
  if (c1 <= 0 || c2 <= 0) return 0;
  return (c2 * v1) / c1;
}

/** Photon energy (eV) ↔ wavelength (nm). */
export function evToWavelength(ev: number): number {
  if (ev <= 0) return 0;
  return 1239.841984 / ev;
}

export function wavelengthToEv(nm: number): number {
  if (nm <= 0) return 0;
  return 1239.841984 / nm;
}

export type SimulationModel = "electron" | "thermal" | "tensile";

export interface SimulationSeries {
  x: number;
  demo: number;
  control: number;
}

export interface SimulationResult {
  model: SimulationModel;
  materialId: string;
  temperatureK: number;
  sizeNm: number;
  iterations: number;
  peak: number;
  mean: number;
  series: SimulationSeries[];
  unit: string;
}

/**
 * Deterministic demo series. Same inputs always produce the same curve so
 * screenshots and tests stay stable.
 */
export function runDemoSimulation(opts: {
  materialId: string;
  electricalIndex: number;
  model: SimulationModel;
  temperatureK: number;
  sizeNm: number;
  iterations: number;
}): SimulationResult {
  const { materialId, electricalIndex, model, temperatureK, sizeNm, iterations } = opts;
  const seed =
    [...materialId].reduce((a, c) => a + c.charCodeAt(0), 0) +
    Math.round(temperatureK) +
    Math.round(sizeNm) +
    iterations +
    model.length * 17;
  let s = seed >>> 0;
  const rand = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const points = 24;
  const thermalFactor = 1 + (temperatureK - 300) / 1400;
  const sizeFactor = 1 + Math.log10(Math.max(sizeNm, 1) + 1) / 3;

  const series: SimulationSeries[] = [];
  for (let i = 0; i < points; i++) {
    const x = (i / (points - 1)) * 100;
    const base =
      model === "electron"
        ? electricalIndex * thermalFactor * Math.exp(-x / 160)
        : model === "thermal"
          ? electricalIndex * 0.72 * sizeFactor * (1 - Math.exp(-x / 55))
          : electricalIndex * 0.9 * Math.tanh(x / 42);
    const noise = (rand() - 0.5) * electricalIndex * 0.08;
    const demo = Math.max(0, base + noise);
    const control = Math.max(0, base * (model === "electron" ? 0.62 : 0.8) + (rand() - 0.5) * 2);
    series.push({ x: Math.round(x), demo: Number(demo.toFixed(2)), control: Number(control.toFixed(2)) });
  }

  const values = series.map((p) => p.demo);
  const peak = Math.max(...values);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;

  const unit = model === "electron" ? "S/cm (index)" : model === "thermal" ? "W/m·K (index)" : "GPa (index)";

  return {
    model,
    materialId,
    temperatureK,
    sizeNm,
    iterations,
    peak: Number(peak.toFixed(2)),
    mean: Number(mean.toFixed(2)),
    series,
    unit,
  };
}
