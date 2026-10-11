import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Play, RotateCcw, Trash2, Atom } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { PageHeader } from "@/components/shell/AppLayout";
import { Card, Button, Field, Select, Badge, EmptyState, ProgressBar } from "@/components/ui";
import { ProCheckoutModal } from "@/components/billing/ProCheckoutModal";
import { MATERIALS, getMaterial } from "@/data/materials";
import { runDemoSimulation, DEMO_DISCLAIMER, type SimulationModel, type SimulationResult } from "@/lib/science";
import { api, getToken } from "@/lib/api";
import { useApp } from "@/store/app";
import { uid, relativeTime } from "@/lib/utils";

type RunStatus = "idle" | "queued" | "running" | "completed";

interface RunRecord {
  id: string;
  materialId: string;
  model: SimulationModel;
  temperatureK: number;
  sizeNm: number;
  iterations: number;
  at: string;
  result: SimulationResult;
}

const MODEL_LABEL: Record<SimulationModel, string> = {
  electron: "Electron transport",
  thermal: "Thermal transport",
  tensile: "Tensile behaviour",
};

function SeriesTooltip({ active, payload, label }: { active?: boolean; payload?: { name?: string; value?: number | string; color?: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-elevated px-3.5 py-2.5 shadow-xl shadow-black/50">
      <p className="text-[11.5px] text-ink-muted">x = {label}</p>
      {payload.map((p) => (
        <p key={p.name} className="mt-1 text-[12px] font-medium" style={{ color: p.color }}>
          {p.name}: <span className="tabular-nums">{String(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

export default function SimulationPage() {
  const [params] = useSearchParams();
  const { logActivity, pushToast, isPro, backendOnline } = useApp();

  const [materialId, setMaterialId] = useState(params.get("material") ?? "graphene");
  const [model, setModel] = useState<SimulationModel>((params.get("model") as SimulationModel) ?? "electron");
  const [temperature, setTemperature] = useState(300);
  const [size, setSize] = useState(25);
  const [iterations, setIterations] = useState(500);
  const [quota, setQuota] = useState<{ used: number; limit: number | null; pro: boolean } | null>(null);
  const [proOpen, setProOpen] = useState(false);

  const [status, setStatus] = useState<RunStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [history, setHistory] = useState<RunRecord[]>([]);
  const timers = useRef<number[]>([]);

  const material = getMaterial(materialId) ?? MATERIALS[0];

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearInterval(t));
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  useEffect(() => clearTimers, []);

  const startRun = useCallback(() => {
    clearTimers();
    setStatus("queued");
    setProgress(0);
    setResult(null);

    // Pro runs skip the queue; Starter waits for a priority slot.
    const queueMs = isPro ? 60 : 420;

    timers.current.push(
      window.setTimeout(() => {
        setStatus("running");
        let pct = 0;
        const interval = window.setInterval(() => {
          pct += 4 + Math.random() * 7;
          if (pct >= 100) {
            window.clearInterval(interval);
            setProgress(100);
            const finishLocal = (res: SimulationResult) => {
              setResult(res);
              setStatus("completed");
              setHistory((prev) =>
                [
                  {
                    id: uid("run"),
                    materialId,
                    model,
                    temperatureK: temperature,
                    sizeNm: size,
                    iterations,
                    at: new Date().toISOString(),
                    result: res,
                  },
                  ...prev,
                ].slice(0, 12),
              );
              logActivity("simulation", `Simulation completed · ${material.name}`, MODEL_LABEL[model]);
              pushToast(`${material.name} ${MODEL_LABEL[model].toLowerCase()} run completed`, "success");
            };
            // Online: run through the backend so the Starter 5/day quota is enforced.
            if (backendOnline && getToken()) {
              api
                .simulate({
                  materialId,
                  electricalIndex: material.index.electrical,
                  model,
                  temperatureK: temperature,
                  sizeNm: size,
                  iterations,
                })
                .then((r) => {
                  const q = r.quota as { used: number; limit: number | null; pro: boolean } | undefined;
                  if (q) setQuota(q);
                  finishLocal({
                    model: r.model as SimulationModel,
                    materialId: r.materialId as string,
                    temperatureK: r.temperatureK as number,
                    sizeNm: r.sizeNm as number,
                    iterations: r.iterations as number,
                    peak: r.peak as number,
                    mean: r.mean as number,
                    series: r.series as SimulationResult["series"],
                    unit: r.unit as string,
                  });
                })
                .catch((e: unknown) => {
                  setStatus("idle");
                  const msg = e instanceof Error ? e.message : "Run failed";
                  if (/402|Daily limit|upgrade to Pro/i.test(msg)) {
                    pushToast(msg, "info");
                    setProOpen(true);
                  } else {
                    // Backend hiccup — fall back to the local demo solver.
                    finishLocal(
                      runDemoSimulation({
                        materialId,
                        electricalIndex: material.index.electrical,
                        model,
                        temperatureK: temperature,
                        sizeNm: size,
                        iterations,
                      }),
                    );
                  }
                });
            } else {
              finishLocal(
                runDemoSimulation({
                  materialId,
                  electricalIndex: material.index.electrical,
                  model,
                  temperatureK: temperature,
                  sizeNm: size,
                  iterations,
                }),
              );
            }
          } else {
            setProgress(pct);
          }
        });
        timers.current.push(interval);
      }, queueMs),
    );
  }, [material, materialId, model, temperature, size, iterations, logActivity, pushToast, isPro, backendOnline]);

  const autoStarted = useRef(false);
  useEffect(() => {
    if (params.get("auto") === "1" && !autoStarted.current) {
      autoStarted.current = true;
      startRun();
    }
  }, [params, startRun]);

  const chartData = useMemo(
    () => (result ? result.series.map((s) => ({ name: String(s.x), Demo: s.demo, Control: s.control })) : []),
    [result],
  );

  return (
    <div className="mx-auto max-w-[1440px]">
      <PageHeader
        title="Simulation Console"
        subtitle="Configure a demo nanoscale model, watch the run progress, and inspect the resulting curve. Runs are stored in this session only."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {isPro ? (
              <Badge tone="blue">Pro · Unlimited</Badge>
            ) : quota ? (
              <Badge tone={quota.used >= (quota.limit ?? 5) ? "amber" : "neutral"}>
                {quota.used}/{quota.limit ?? 5} runs today
              </Badge>
            ) : (
              <Badge tone="neutral">Starter · 5 runs/day</Badge>
            )}
            <Badge tone={status === "completed" ? "green" : status === "running" ? "blue" : status === "queued" ? "amber" : "neutral"}>
              {status === "idle" ? "Ready" : status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-12">
        <Card className="lg:col-span-4">
          <h2 className="border-b border-line px-5 py-4 text-[15px] font-semibold text-ink">Configuration</h2>
          <div className="space-y-4 px-5 py-4">
            <Field label="Material">
              <Select value={materialId} onChange={(e) => setMaterialId(e.target.value)}>
                {MATERIALS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Model" hint="Illustrative demo solver — not a physical engine.">
              <Select value={model} onChange={(e) => setModel(e.target.value as SimulationModel)}>
                <option value="electron">Electron transport</option>
                <option value="thermal">Thermal transport</option>
                <option value="tensile">Tensile behaviour</option>
              </Select>
            </Field>
            <Field label={`Temperature · ${temperature} K`}>
              <input
                type="range"
                min={200}
                max={1200}
                step={25}
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-panel"
                aria-label="Temperature in kelvin"
              />
            </Field>
            <Field label={`Particle size · ${size} nm`}>
              <input
                type="range"
                min={1}
                max={100}
                step={1}
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-panel"
                aria-label="Particle size in nanometres"
              />
            </Field>
            <Field label="Iterations">
              <Select value={String(iterations)} onChange={(e) => setIterations(Number(e.target.value))}>
                <option value="100">100</option>
                <option value="500">500</option>
                <option value="1000">1000</option>
                {isPro && <option value="5000">5000 (Pro deep run)</option>}
              </Select>
            </Field>
            {!isPro && (
              <button
                onClick={() => setProOpen(true)}
                className="rounded-xl border border-gold/30 bg-gold/8 px-4 py-3 text-left text-[12px] leading-relaxed text-ink-muted transition-colors hover:border-gold/50"
              >
                <span className="font-semibold text-gold">Starter limit: 5 runs/day.</span> Upgrade to Pro for unlimited runs, 5000-iteration deep runs and priority queue.
              </button>
            )}
            <Button variant="gradient" className="w-full" onClick={startRun} disabled={status === "running" || status === "queued"}>
              <Play className="size-4" /> {status === "running" || status === "queued" ? "Running…" : "Run simulation"}
            </Button>
          </div>
        </Card>

        <div className="space-y-5 lg:col-span-8">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
              <h2 className="text-[15px] font-semibold text-ink">Results</h2>
              {result && (
                <div className="flex flex-wrap gap-2">
                  <Badge tone="blue">Peak {result.peak}</Badge>
                  <Badge tone="violet">Mean {result.mean}</Badge>
                  <Badge tone="neutral">{result.unit}</Badge>
                </div>
              )}
            </div>

            {(status === "running" || status === "queued") && (
              <div className="px-5 py-6">
                <div className="mb-2 flex items-center justify-between text-[12.5px] text-ink-muted">
                  <span>{status === "queued" ? "Queued — allocating demo solver…" : `Simulating ${material.name}…`}</span>
                  <span className="tabular-nums">{Math.round(progress)}%</span>
                </div>
                <ProgressBar value={progress} tone="violet" />
              </div>
            )}

            {status === "idle" && (
              <div className="px-5 py-6">
                <EmptyState
                  icon={Atom}
                  title="No results yet"
                  description="Pick a material and model on the left, then press Run simulation. The deterministic demo curve appears here."
                />
              </div>
            )}

            {status === "completed" && result && (
              <div className="px-3 pb-4 pt-4">
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 8, right: 14, left: -12, bottom: 0 }}>
                      <CartesianGrid stroke="#1a2540" strokeDasharray="3 6" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: "#6d7b93", fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: "step", position: "insideBottomRight", fill: "#6d7b93", fontSize: 11 }} />
                      <YAxis tick={{ fill: "#6d7b93", fontSize: 11 }} axisLine={false} tickLine={false} width={52} />
                      <Tooltip content={<SeriesTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12, color: "#a9b6cc" }} iconType="circle" iconSize={8} />
                      <Line type="monotone" dataKey="Demo" stroke="#60a5fa" strokeWidth={2.4} dot={false} animationDuration={900} />
                      <Line type="monotone" dataKey="Control" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" dot={false} animationDuration={900} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <dl className="grid gap-3 border-t border-line px-4 pt-4 sm:grid-cols-4">
                  <div>
                    <dt className="text-[11.5px] text-ink-muted">Material</dt>
                    <dd className="text-[13px] font-semibold text-ink">{material.name}</dd>
                  </div>
                  <div>
                    <dt className="text-[11.5px] text-ink-muted">Model</dt>
                    <dd className="text-[13px] font-semibold text-ink">{MODEL_LABEL[result.model]}</dd>
                  </div>
                  <div>
                    <dt className="text-[11.5px] text-ink-muted">Temperature</dt>
                    <dd className="text-[13px] font-semibold tabular-nums text-ink">{result.temperatureK} K</dd>
                  </div>
                  <div>
                    <dt className="text-[11.5px] text-ink-muted">Particle size</dt>
                    <dd className="text-[13px] font-semibold tabular-nums text-ink">{result.sizeNm} nm</dd>
                  </div>
                </dl>
                <p className="px-4 pt-3 text-[11px] leading-relaxed text-ink-muted">{DEMO_DISCLAIMER}</p>
              </div>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="text-[15px] font-semibold text-ink">Run history</h2>
              {history.length > 0 && (
                <button
                  onClick={() => setHistory([])}
                  className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-muted transition hover:text-rose"
                >
                  <Trash2 className="size-3.5" /> Clear
                </button>
              )}
            </div>
            {history.length === 0 ? (
              <p className="px-5 py-6 text-center text-[12.5px] text-ink-muted">Runs you complete will be listed here.</p>
            ) : (
              <ul className="divide-y divide-line/60 px-2 py-1">
                {history.map((run) => (
                  <li key={run.id} className="flex flex-wrap items-center gap-3 px-3 py-3">
                    <span className="grid size-9 place-items-center rounded-xl bg-blue/12 text-blue-soft">
                      <Atom className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-ink">
                        {getMaterial(run.materialId)?.name ?? run.materialId} · {MODEL_LABEL[run.model]}
                      </p>
                      <p className="text-[11.5px] text-ink-muted">
                        {run.temperatureK} K · {run.sizeNm} nm · {run.iterations} iters · {relativeTime(run.at)}
                      </p>
                    </div>
                    <Badge tone="green">peak {run.result.peak}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setMaterialId(run.materialId);
                        setModel(run.model);
                        setTemperature(run.temperatureK);
                        setSize(run.sizeNm);
                        setIterations(run.iterations);
                        pushToast("Settings restored from that run", "info");
                      }}
                    >
                      <RotateCcw className="size-3.5" /> Restore
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <ProCheckoutModal open={proOpen} onClose={() => setProOpen(false)} />
    </div>
  );
}
