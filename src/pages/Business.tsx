import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Factory, Plus, Trash2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PageHeader } from "@/components/shell/AppLayout";
import { Card, Button, Field, Input, Select, Modal, Badge } from "@/components/ui";
import { MATERIALS } from "@/data/materials";
import { api, getToken } from "@/lib/api";
import { readLS, writeLS } from "@/lib/storage";
import { useApp } from "@/store/app";
import { cn } from "@/lib/utils";

interface Batch {
  id: string;
  name: string;
  materialId: string;
  kg: number;
  yieldPct: number;
  qcPass: boolean;
  createdAt: string;
}

const PRICE_PER_KG: Record<string, number> = {
  graphene: 180, "carbon-nanotube": 320, "silver-nanoparticles": 850, "titanium-dioxide": 45,
  "gold-nanoparticles": 4200, "quantum-dots": 1200, "silicon-nanowires": 260, "graphene-oxide": 140,
  mos2: 210, "zinc-oxide-nanorods": 60, "carbon-nanodots": 90, "iron-oxide-nanoparticles": 75,
};

export default function BusinessPage() {
  const { pushToast, logActivity, user } = useApp();
  const navigate = useNavigate();
  const isMember = !!user && !user.guest && !!getToken();
  const [batches, setBatches] = useState<Batch[]>(() => readLS("batches", [
    { id: "b1", name: "CNT ink lot #41", materialId: "carbon-nanotube", kg: 12, yieldPct: 92, qcPass: true, createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
    { id: "b2", name: "Ag trace paste #12", materialId: "silver-nanoparticles", kg: 5, yieldPct: 88, qcPass: true, createdAt: new Date(Date.now() - 86400000 * 5).toISOString() },
    { id: "b3", name: "TiO2 sunscreen base #7", materialId: "titanium-dioxide", kg: 40, yieldPct: 76, qcPass: false, createdAt: new Date(Date.now() - 86400000 * 9).toISOString() },
  ] as Batch[]));
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", materialId: "graphene", kg: "10", yieldPct: "90", qcPass: true });

  // Cost estimator
  const [estMat, setEstMat] = useState("silver-nanoparticles");
  const [estKg, setEstKg] = useState("5");
  const [estYield, setEstYield] = useState("90");

  const persist = (next: Batch[]) => {
    setBatches(next);
    writeLS("batches", next);
  };

  // Backend owns batches when online; browser cache is the offline fallback.
  useEffect(() => {
    if (!isMember) return;
    api
      .batches()
      .then((res) => {
        const mapped: Batch[] = res.batches.map((b) => ({
          id: b.id,
          name: b.name,
          materialId: b.material_id,
          kg: b.kg,
          yieldPct: b.yieldPct,
          qcPass: b.qcPass,
          createdAt: b.createdAt,
        }));
        setBatches(mapped);
        writeLS("batches", mapped);
      })
      .catch(() => {});
  }, [isMember]);

  const needEmail = () => {
    if (!isMember) {
      pushToast("Batches need an email account — please sign in.", "info");
      navigate("/login", { state: { from: { pathname: "/business" } } });
      return true;
    }
    return false;
  };

  const removeBatch = (id: string, name: string) => {
    if (needEmail()) return;
    if (isMember) void api.deleteBatch(id).catch(() => {});
    persist(batches.filter((x) => x.id !== id));
    pushToast(`Deleted “${name}”`, "info");
  };

  const submitBatch = async () => {
    if (needEmail()) return;
    const payload = {
      name: form.name.trim(),
      material_id: form.materialId,
      kg: Number(form.kg) || 0,
      yield_pct: Math.min(100, Number(form.yieldPct) || 0),
      qc_pass: form.qcPass,
    };
    if (isMember) {
      try {
        const saved = await api.createBatch(payload);
        persist([
          { id: saved.id, name: saved.name, materialId: saved.material_id, kg: saved.kg, yieldPct: saved.yieldPct, qcPass: saved.qcPass, createdAt: saved.createdAt },
          ...batches,
        ]);
      } catch (e) {
        pushToast(e instanceof Error ? e.message : "Could not save batch", "info");
        return;
      }
    } else {
      const b: Batch = {
        id: `b${Date.now().toString(36)}`, name: payload.name, materialId: payload.material_id,
        kg: payload.kg, yieldPct: payload.yield_pct, qcPass: payload.qc_pass,
        createdAt: new Date().toISOString(),
      };
      persist([b, ...batches]);
    }
    logActivity("project", `Batch “${payload.name}” created`, `${payload.kg} kg`);
    pushToast(`Batch “${payload.name}” added`, "success");
    setOpen(false);
    setForm({ name: "", materialId: "graphene", kg: "10", yieldPct: "90", qcPass: true });
  };

  const stats = useMemo(() => {
    const totalKg = batches.reduce((a, b) => a + b.kg, 0);
    const cost = batches.reduce((a, b) => a + b.kg * (PRICE_PER_KG[b.materialId] ?? 100), 0);
    const qc = batches.length ? Math.round((batches.filter((b) => b.qcPass).length / batches.length) * 100) : 0;
    const avgYield = batches.length ? Math.round(batches.reduce((a, b) => a + b.yieldPct, 0) / batches.length) : 0;
    return { totalKg, cost, qc, avgYield };
  }, [batches]);

  const chartData = useMemo(() => batches.map((b) => ({ name: b.name.split(" ").slice(0, 2).join(" "), cost: Math.round(b.kg * (PRICE_PER_KG[b.materialId] ?? 100)) })), [batches]);

  const estCost = useMemo(() => {
    const kg = Number(estKg) || 0;
    const y = Math.min(100, Math.max(1, Number(estYield) || 100));
    return Math.round(((PRICE_PER_KG[estMat] ?? 100) * kg) / (y / 100));
  }, [estMat, estKg, estYield]);

  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader
        title="Business & Industrial"
        subtitle="Pilot-line SaaS: batches live in the backend database (email account required) — QC, costing and throughput for nano manufacturing."
        actions={<Button variant="gradient" onClick={() => setOpen(true)}><Plus className="size-4" /> New batch</Button>}
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Active batches", value: String(batches.length) },
          { label: "Material throughput", value: `${stats.totalKg.toFixed(0)} kg` },
          { label: "QC pass rate", value: `${stats.qc}%` },
          { label: "Material cost", value: `$${stats.cost.toLocaleString()}` },
        ].map((k) => (
          <Card key={k.label} className="p-5">
            <p className="text-[12px] text-ink-muted">{k.label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-ink">{k.value}</p>
            <p className="mt-0.5 text-[11.5px] text-ink-muted">Avg yield {stats.avgYield}%</p>
          </Card>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <h2 className="flex items-center gap-2 border-b border-line px-5 py-4 text-[15px] font-semibold text-ink"><Factory className="size-4 text-blue-soft" /> Production batches</h2>
          <ul className="space-y-2 p-3">
            {batches.map((b) => {
              const mat = MATERIALS.find((m) => m.id === b.materialId);
              return (
                <li key={b.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-panel/50 px-3.5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium text-ink">{b.name}</p>
                    <p className="text-[12px] text-ink-muted">{mat?.name ?? b.materialId} · {b.kg} kg · yield {b.yieldPct}%</p>
                  </div>
                  <Badge tone={b.qcPass ? "blue" : "neutral"}>{b.qcPass ? "QC pass" : "QC hold"}</Badge>
                  <button
                    onClick={() => removeBatch(b.id, b.name)}
                    aria-label={`Delete ${b.name}`}
                    className="grid size-8 place-items-center rounded-lg text-ink-muted transition hover:bg-rose/12 hover:text-rose"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              );
            })}
            {batches.length === 0 && <p className="py-6 text-center text-[13px] text-ink-muted">No batches — create your first production lot.</p>}
          </ul>
        </Card>

        <div className="space-y-5 lg:col-span-5">
          <Card className="p-5">
            <h2 className="text-[15px] font-semibold text-ink">Batch cost estimator</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Material">
                <Select value={estMat} onChange={(e) => setEstMat(e.target.value)}>
                  {MATERIALS.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} (${PRICE_PER_KG[m.id] ?? 100}/kg)</option>
                  ))}
                </Select>
              </Field>
              <Field label="Quantity (kg)">
                <Input type="number" min={0} value={estKg} onChange={(e) => setEstKg(e.target.value)} />
              </Field>
              <Field label="Expected yield %">
                <Input type="number" min={1} max={100} value={estYield} onChange={(e) => setEstYield(e.target.value)} />
              </Field>
            </div>
            <p className="mt-4 rounded-xl border border-blue/30 bg-blue/8 px-4 py-3 text-[14px] text-ink">
              Estimated batch cost: <span className="font-bold tabular-nums text-blue-soft">${estCost.toLocaleString()}</span>
            </p>
            <p className="mt-2 text-[11.5px] text-ink-muted">Illustrative catalogue pricing — confirm with suppliers before quoting.</p>
          </Card>

          <Card className="p-5">
            <h2 className="text-[15px] font-semibold text-ink">Cost by batch</h2>
            <div className="mt-2 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid stroke="#1a2540" strokeDasharray="3 6" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "#6d7b93", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6d7b93", fontSize: 11 }} axisLine={false} tickLine={false} width={56} />
                  <Tooltip contentStyle={{ background: "#111c31", border: "1px solid #1a2540", borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="cost" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New production batch"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              variant="gradient"
              disabled={!form.name.trim()}
              onClick={() => void submitBatch()}
            >
              Create batch
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Batch name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. ZnO sensor lot #8" />
          </Field>
          <Field label="Material">
            <Select value={form.materialId} onChange={(e) => setForm({ ...form, materialId: e.target.value })}>
              {MATERIALS.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Quantity (kg)">
            <Input type="number" value={form.kg} onChange={(e) => setForm({ ...form, kg: e.target.value })} />
          </Field>
          <Field label="Yield %">
            <Input type="number" value={form.yieldPct} onChange={(e) => setForm({ ...form, yieldPct: e.target.value })} />
          </Field>
        </div>
        <label className={cn("mt-4 flex items-center gap-2.5 text-[13px] text-ink-soft")}>
          <input type="checkbox" checked={form.qcPass} onChange={(e) => setForm({ ...form, qcPass: e.target.checked })} className="size-4 accent-blue-500" />
          QC passed
        </label>
      </Modal>
    </div>
  );
}
