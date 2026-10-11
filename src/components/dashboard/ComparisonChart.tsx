import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";
import { ChevronDown } from "lucide-react";
import { Card } from "@/components/ui";
import { getMaterial, TRENDING_IDS, CHART_METRICS, type ChartMetricKey } from "@/data/materials";
import { useApp } from "@/store/app";
import { cn } from "@/lib/utils";

const BAR_COLORS = ["#3b82f6", "#34d399", "#8b5cf6", "#60a5fa"];
const SHORT_NAMES: Record<string, string> = {
  graphene: "Graphene",
  "carbon-nanotube": "Carbon Nanotube",
  "silver-nanoparticles": "Silver NP",
  "titanium-dioxide": "TiO₂",
};

interface AxisTickProps {
  x?: number;
  y?: number;
  payload?: { value?: string };
}

function WrappedTick({ x = 0, y = 0, payload }: AxisTickProps) {
  const value = String(payload?.value ?? "");
  const words = value.split(" ");
  if (words.length === 1 || value.length <= 10) {
    return (
      <text x={x} y={y} dy={16} textAnchor="middle" fill="#8ea0bb" fontSize={11}>
        {value}
      </text>
    );
  }
  const mid = Math.ceil(words.length / 2);
  const line1 = words.slice(0, mid).join(" ");
  const line2 = words.slice(mid).join(" ");
  return (
    <text x={x} y={y} dy={14} textAnchor="middle" fill="#8ea0bb" fontSize={11}>
      <tspan x={x} dy={0}>
        {line1}
      </tspan>
      <tspan x={x} dy={13}>
        {line2}
      </tspan>
    </text>
  );
}

interface TooltipPayloadItem {
  name?: string;
  value?: number | string;
  color?: string;
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadItem[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const material = getMaterial(String(label));
  return (
    <div className="rounded-xl border border-line bg-elevated px-3.5 py-2.5 shadow-xl shadow-black/50">
      <p className="text-[12.5px] font-semibold text-ink">{material?.name ?? label}</p>
      <p className="mt-1 text-[12px] text-ink-soft">
        Index: <span className="font-semibold text-blue-soft">{String(payload[0]?.value)}</span> / 100
      </p>
      {material && <p className="mt-0.5 text-[11px] text-ink-muted">{material.category}</p>}
    </div>
  );
}

export function ComparisonChart() {
  const navigate = useNavigate();
  const { settings, updateSettings } = useApp();
  const [metric, setMetric] = useState<ChartMetricKey>(settings.defaultMetric);

  const data = TRENDING_IDS.map((id) => {
    const m = getMaterial(id);
    return {
      id,
      name: SHORT_NAMES[id] ?? m?.name ?? id,
      value: m ? m.index[metric] : 0,
    };
  });

  const niceMax = Math.max(20, Math.ceil(Math.max(...data.map((d) => d.value)) / 20) * 20);
  const metricLabel = CHART_METRICS.find((m) => m.key === metric)?.label ?? "Index";

  return (
    <Card className="h-full">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4 pb-1">
        <h3 className="text-[15px] font-semibold tracking-tight text-ink">Material Properties Comparison</h3>
        <div className="relative">
          <select
            value={metric}
            onChange={(e) => {
              const next = e.target.value as ChartMetricKey;
              setMetric(next);
              updateSettings({ defaultMetric: next });
            }}
            aria-label="Comparison metric"
            className="h-9 cursor-pointer appearance-none rounded-lg border border-line bg-panel pl-3 pr-8 text-[12.5px] font-medium text-ink-soft transition-colors hover:border-blue-soft/40 focus:border-blue-soft/60 focus:outline-none"
          >
            {CHART_METRICS.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-muted" />
        </div>
      </div>

      <div className="h-[248px] px-2 pb-2 pt-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 14, right: 8, left: -14, bottom: 0 }} barCategoryGap="30%">
            <CartesianGrid vertical={false} stroke="#1a2540" strokeDasharray="3 6" />
            <XAxis
              dataKey="name"
              tick={<WrappedTick />}
              axisLine={false}
              tickLine={false}
              interval={0}
              height={44}
            />
            <YAxis
              domain={[0, niceMax]}
              tick={{ fill: "#6d7b93", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={44}
            />
            <Tooltip
              cursor={{ fill: "rgba(96,165,250,0.07)" }}
              content={<ChartTooltip />}
              wrapperStyle={{ outline: "none" }}
            />
            <Bar
              dataKey="value"
              radius={[7, 7, 0, 0]}
              animationDuration={900}
              onClick={(entry: { id?: string }) => {
                const id = entry?.id ?? data.find((d) => d.name === entry)?.id;
                if (id) navigate(`/materials/${id}`);
              }}
              className="cursor-pointer"
            >
              <LabelList dataKey="value" position="top" fill="#c7d2e5" fontSize={12} fontWeight={600} />
              {data.map((d, i) => (
                <Cell key={d.id} fill={BAR_COLORS[i % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className={cn("px-5 pb-4 text-[11.5px] text-ink-muted")}>
        {metricLabel} · normalised 0–100 comparison index (demo data) · click a bar to open the material
      </p>
    </Card>
  );
}
