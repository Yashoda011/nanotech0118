import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { UploadCloud, Trash2, Database, Download, FileText, Printer, RotateCcw } from "lucide-react";
import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, CartesianGridProps } from "recharts";
import { PageHeader } from "@/components/shell/AppLayout";
import { Card, Button, Field, Select, EmptyState, Badge, Modal } from "@/components/ui";
import { useApp } from "@/store/app";
import { api, type SimRun } from "@/lib/api";
import { fileContentToDataset } from "@/lib/parse";
import { cn, shortDate, relativeTime } from "@/lib/utils";

type ChartKind = "area" | "line" | "bar";

function ChartTooltip({ active, payload, label, unit }: { active?: boolean; payload?: { name?: string; value?: number | string; color?: string }[]; label?: string; unit?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-elevated px-3.5 py-2.5 shadow-xl shadow-black/50">
      <p className="text-[11.5px] text-ink-muted">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="mt-1 text-[12px] font-medium" style={{ color: p.color }}>
          {p.name}: <span className="tabular-nums">{String(p.value)}</span> {unit}
        </p>
      ))}
    </div>
  );
}

export default function AnalysisPage() {
  const [params] = useSearchParams();
  const { datasets, addDataset, setDatasets, removeDataset, pushToast, backendOnline, syncFromBackend } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);

  const [activeId, setActiveId] = useState(() => datasets[0]?.id ?? "");
  const [seriesName, setSeriesName] = useState("");
  const [chartKind, setChartKind] = useState<ChartKind>("area");
  const [reportOpen, setReportOpen] = useState(false);
  const [runs, setRuns] = useState<SimRun[]>([]);

  useEffect(() => {
    if (!backendOnline) {
      setRuns([]);
      return;
    }
    api.simRuns().then((r) => setRuns(r.runs)).catch(() => setRuns([]));
  }, [backendOnline, datasets]);

  useEffect(() => {
    if (params.get("upload") === "1") fileRef.current?.click();
  }, [params]);

  useEffect(() => {
    if (!datasets.find((d) => d.id === activeId)) setActiveId(datasets[0]?.id ?? "");
  }, [datasets, activeId]);

  const active = datasets.find((d) => d.id === activeId) ?? datasets[0];
  const series = active?.series ?? [];
  const activeSeries = series.find((s) => s.name === seriesName) ?? series[0];

  useEffect(() => {
    if (activeSeries && activeSeries.name !== seriesName) setSeriesName(activeSeries.name);
  }, [activeSeries, seriesName]);

  const chartData = useMemo(
    () =>
      (activeSeries?.points ?? []).map((p) => ({
        name: p.label,
        value: p.value,
      })),
    [activeSeries],
  );

  const stats = useMemo(() => {
    const vals = chartData.map((d) => Number(d.value)).filter((v) => Number.isFinite(v));
    if (!vals.length) return null;
    const sum = vals.reduce((a, b) => a + b, 0);
    return {
      min: Math.min(...vals),
      max: Math.max(...vals),
      avg: sum / vals.length,
      count: vals.length,
    };
  }, [chartData]);

  const onUpload = async (file: File | undefined) => {
    if (!file) return;
    // Prefer backend (pandas stats + persistent storage) when online
    if (backendOnline) {
      try {
        const { api } = await import("@/lib/api");
        const bd = await api.uploadDataset(file);
        await syncFromBackend();
        setActiveId(bd.id);
        const total = bd.series.reduce((a, s) => a + s.points.length, 0);
        pushToast(`“${file.name}” stored on server — ${total} rows`, "success");
        return;
      } catch (err) {
        // fall through to local parse
        if (err instanceof Error && !/failed to fetch|network/i.test(err.message)) {
          pushToast(err.message, "info");
          if (fileRef.current) fileRef.current.value = "";
          return;
        }
      }
    }
    try {
      const text = await file.text();
      const dataset = fileContentToDataset(file.name, text);
      addDataset(dataset);
      setActiveId(dataset.id);
      pushToast(`“${file.name}” parsed — ${dataset.series.length} series`, "success");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Could not parse that file", "info");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const gridProps: CartesianGridProps = { stroke: "#1a2540", strokeDasharray: "3 6", vertical: false };

  const download = (filename: string, text: string, mime = "text/csv") => {
    const url = URL.createObjectURL(new Blob([text], { type: mime }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCsv = () => {
    if (!active) return;
    const lines = ["series,label,value"];
    active.series.forEach((s) =>
      s.points.forEach((p) => lines.push([JSON.stringify(s.name), JSON.stringify(p.label), String(p.value)].join(","))),
    );
    download(`${active.name.replace(/\.[^.]+$/, "") || "dataset"}.csv`, lines.join("\n"));
    pushToast("Dataset exported as CSV", "success");
  };

  const exportRunsCsv = () => {
    const lines = ["at,material,model,temperatureK,sizeNm,iterations,peak,mean"];
    runs.forEach((r) =>
      lines.push([r.at, r.materialId, r.model, String(r.temperatureK), String(r.sizeNm), String(r.iterations), String(r.peak), String(r.mean)].join(",")),
    );
    download("simulation-runs.csv", lines.join("\n"));
    pushToast("Run history exported as CSV", "success");
  };

  return (
    <div className="mx-auto max-w-[1440px]">
      <PageHeader
        title="Data & Analysis"
        subtitle={backendOnline ? "Upload a CSV or JSON — parsed with pandas on the FastAPI server and stored in Postgres." : "Upload a CSV or JSON file from your device — parsing happens locally in the browser and nothing is sent anywhere."}
        actions={
          <>
            <Button variant="secondary" onClick={() => setReportOpen(true)} disabled={!active}>
              <FileText className="size-4" /> Report
            </Button>
            <Button variant="secondary" onClick={exportCsv} disabled={!active}>
              <Download className="size-4" /> CSV
            </Button>
            <Button variant="gradient" onClick={() => fileRef.current?.click()}>
              <UploadCloud className="size-4" /> Upload dataset
            </Button>
          </>
        }
      />
      <input
        ref={fileRef}
        type="file"
        accept=".csv,.tsv,.json,text/csv,application/json"
        className="hidden"
        onChange={(e) => onUpload(e.target.files?.[0])}
      />

      {datasets.length === 0 ? (
        <EmptyState
          icon={Database}
          title="No datasets yet"
          description="Upload a CSV with a label column plus one or more numeric columns (or a JSON array of objects) to build your first chart."
          action={
            <Button variant="gradient" onClick={() => fileRef.current?.click()}>
              <UploadCloud className="size-4" /> Upload your first dataset
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-12">
          <Card className="lg:col-span-4">
            <h2 className="border-b border-line px-5 py-4 text-[15px] font-semibold text-ink">Datasets</h2>
            <ul className="space-y-2 p-3">
              {datasets.map((d) => (
                <li key={d.id}>
                  <button
                    onClick={() => setActiveId(d.id)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors",
                      d.id === active?.id ? "border-blue/45 bg-blue/10" : "border-line bg-panel/50 hover:border-blue-soft/30",
                    )}
                  >
                    <span className={cn("mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg", d.id === active?.id ? "bg-blue/20 text-blue-soft" : "bg-white/5 text-ink-muted")}>
                      <Database className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-ink">{d.name}</span>
                      <span className="mt-0.5 block text-[11.5px] text-ink-muted">
                        {d.series.length} series · {relativeTime(d.uploadedAt)}
                      </span>
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label={`Delete ${d.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeDataset(d.id);
                        pushToast(`Removed “${d.name}”`, "info");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.stopPropagation();
                          removeDataset(d.id);
                        }
                      }}
                      className="grid size-7 shrink-0 place-items-center rounded-lg text-ink-muted transition hover:bg-rose/12 hover:text-rose"
                    >
                      <Trash2 className="size-3.5" />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="border-t border-line px-5 py-3 text-[11.5px] leading-relaxed text-ink-muted">
              Accepted: <span className="text-ink-soft">.csv</span>, <span className="text-ink-soft">.tsv</span>,{" "}
              <span className="text-ink-soft">.json</span> · processed on-device only
            </p>
          </Card>

          <Card className="lg:col-span-8">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
              <div>
                <h2 className="text-[15px] font-semibold text-ink">{active?.name ?? "Chart"}</h2>
                <p className="mt-0.5 text-[12px] text-ink-muted">
                  {active ? `Uploaded ${shortDate(active.uploadedAt)}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <Select
                  value={activeSeries?.name ?? ""}
                  onChange={(e) => setSeriesName(e.target.value)}
                  aria-label="Series"
                  className="h-9 w-48 text-[12.5px]"
                >
                  {series.map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </Select>
                <div className="inline-flex rounded-xl border border-line bg-panel/70 p-1">
                  {(["area", "line", "bar"] as ChartKind[]).map((k) => (
                    <button
                      key={k}
                      onClick={() => setChartKind(k)}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-[12px] font-medium capitalize transition-colors",
                        chartKind === k ? "bg-blue/80 text-white" : "text-ink-muted hover:text-ink-soft",
                      )}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="h-[300px] px-3 py-4">
              <ResponsiveContainer width="100%" height="100%">
                {chartKind === "bar" ? (
                  <BarChart data={chartData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="name" tick={{ fill: "#6d7b93", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#6d7b93", fontSize: 11 }} axisLine={false} tickLine={false} width={52} />
                    <Tooltip content={<ChartTooltip unit={activeSeries?.unit} />} cursor={{ fill: "rgba(96,165,250,0.07)" }} />
                    <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} animationDuration={800} />
                  </BarChart>
                ) : chartKind === "line" ? (
                  <LineChart data={chartData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="name" tick={{ fill: "#6d7b93", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#6d7b93", fontSize: 11 }} axisLine={false} tickLine={false} width={52} />
                    <Tooltip content={<ChartTooltip unit={activeSeries?.unit} />} />
                    <Line type="monotone" dataKey="value" stroke="#60a5fa" strokeWidth={2.4} dot={{ r: 3, fill: "#60a5fa" }} animationDuration={900} />
                  </LineChart>
                ) : (
                  <AreaChart data={chartData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                    <defs>
                      <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="name" tick={{ fill: "#6d7b93", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#6d7b93", fontSize: 11 }} axisLine={false} tickLine={false} width={52} />
                    <Tooltip content={<ChartTooltip unit={activeSeries?.unit} />} />
                    <Area type="monotone" dataKey="value" stroke="#60a5fa" strokeWidth={2.4} fill="url(#areaFill)" animationDuration={900} />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>

            {stats && (
              <dl className="grid gap-3 border-t border-line px-5 py-4 sm:grid-cols-4">
                <div>
                  <dt className="text-[11.5px] text-ink-muted">Points</dt>
                  <dd className="text-[14px] font-semibold tabular-nums text-ink">{stats.count}</dd>
                </div>
                <div>
                  <dt className="text-[11.5px] text-ink-muted">Min</dt>
                  <dd className="text-[14px] font-semibold tabular-nums text-ink">{stats.min}</dd>
                </div>
                <div>
                  <dt className="text-[11.5px] text-ink-muted">Max</dt>
                  <dd className="text-[14px] font-semibold tabular-nums text-ink">{stats.max}</dd>
                </div>
                <div>
                  <dt className="text-[11.5px] text-ink-muted">Average</dt>
                  <dd className="text-[14px] font-semibold tabular-nums text-blue-soft">{stats.avg.toFixed(2)}</dd>
                </div>
              </dl>
            )}
            <p className="border-t border-line px-5 py-3 text-[11px] text-ink-muted">
              Example CSV header: <Badge tone="neutral" className="ml-1">cycle,value_a,value_b</Badge>
            </p>
          </Card>
        </div>
      )}

      <Card className="mt-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
            <RotateCcw className="size-4 text-violet" /> Experiment history
            <span className="text-[11.5px] font-normal text-ink-muted">
              {backendOnline ? "timestamped server records" : "connect backend to record runs"}
            </span>
          </h2>
          {runs.length > 0 && (
            <Button variant="ghost" size="sm" onClick={exportRunsCsv}>
              <Download className="size-3.5" /> Runs CSV
            </Button>
          )}
        </div>
        {runs.length === 0 ? (
          <p className="px-5 py-6 text-center text-[12.5px] text-ink-muted">
            {backendOnline ? "No backend runs yet — complete a simulation while online." : "Run history needs the FastAPI backend."}
          </p>
        ) : (
          <ul className="divide-y divide-line/60 px-2 py-1">
            {runs.slice(0, 8).map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5 text-[12.5px]">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-ink">{r.materialId} · {r.model}</span>
                  <span className="block text-[11.5px] text-ink-muted">{relativeTime(r.at)} · {r.temperatureK}K · {r.sizeNm}nm · {r.iterations} iters</span>
                </span>
                <Badge tone="blue">peak {r.peak}</Badge>
                <Badge tone="neutral">mean {r.mean}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title="Research report"
        description={active ? `${active.name} · generated ${new Date().toLocaleString()}` : ""}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={exportCsv}><Download className="size-4" /> CSV</Button>
            <Button variant="gradient" onClick={() => window.print()}><Printer className="size-4" /> Print / PDF</Button>
          </>
        }
      >
        <div className="space-y-3 text-[13px] text-ink-soft">
          <p><span className="font-semibold text-ink">Dataset:</span> {active?.name} ({active?.series.length} series, uploaded {active ? relativeTime(active.uploadedAt) : "—"})</p>
          {stats && (
            <p><span className="font-semibold text-ink">Active series “{activeSeries?.name}”:</span> {stats.count} points · min {stats.min} · max {stats.max} · avg {stats.avg.toFixed(2)} {activeSeries?.unit}</p>
          )}
          <p><span className="font-semibold text-ink">Experiment runs on record:</span> {runs.length} timestamped backend runs.</p>
          <p className="text-[12px] text-ink-muted">Tip: Print → “Save as PDF” produces a shareable research report. Values are illustrative demo data.</p>
        </div>
      </Modal>
    </div>
  );
}
