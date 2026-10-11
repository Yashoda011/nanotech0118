import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Card, SectionHeader, Badge, categoryTone } from "@/components/ui";
import { MaterialArt } from "@/art";
import { Material3D } from "@/components/material/Material3D";
import { MATERIALS, TRENDING_IDS, getMaterial, type Material } from "@/data/materials";
import { cn } from "@/lib/utils";

const DIMENSIONS: { id: string; label: string; hint: string; match: (m: Material) => boolean }[] = [
  { id: "1d", label: "1D Materials", hint: "Tubes, wires & rods", match: (m) => m.category === "1D Material" },
  { id: "2d", label: "2D Materials", hint: "Sheets & layers", match: (m) => m.category === "2D Material" },
  {
    id: "3d",
    label: "3D Bulk Materials",
    hint: "Particles, metals & oxides",
    match: (m) => m.category !== "1D Material" && m.category !== "2D Material",
  },
];

export function TrendingMaterials() {
  const navigate = useNavigate();
  const items = TRENDING_IDS.map((id) => getMaterial(id)).filter((m): m is NonNullable<typeof m> => Boolean(m));
  const [openDim, setOpenDim] = useState<string | null>("1d");

  return (
    <Card className="overflow-hidden">
      <SectionHeader
        title="Trending Nanomaterials"
        action={
          <Link
            to="/explore"
            className="inline-flex items-center gap-1 text-[12.5px] font-medium text-blue-soft transition hover:gap-1.5 hover:underline"
          >
            View All <ArrowRight className="size-3.5" />
          </Link>
        }
      />
      <div className="grid gap-3.5 px-5 pb-5 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((m) => (
          <button
            key={m.id}
            onClick={() => navigate(`/materials/${m.id}`)}
            className="group overflow-hidden rounded-xl border border-line bg-panel/70 text-left transition-all duration-200 hover:-translate-y-1 hover:border-blue-soft/40"
          >
            <div className="relative h-32 overflow-hidden">
              <Material3D kind={m.art} accent={m.accent} className="h-full w-full" />
              <span className="absolute left-2 top-2 rounded-full border border-white/15 bg-black/55 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white backdrop-blur">
                3D
              </span>
            </div>
            <div className="p-3.5">
              <p className="text-[13.5px] font-semibold text-ink">{m.name}</p>
              <p className="mt-1 line-clamp-2 min-h-[32px] text-[12px] leading-relaxed text-ink-muted">{m.tagline}</p>
              <Badge tone={categoryTone(m.category)} className="mt-2.5">
                {m.category}
              </Badge>
            </div>
          </button>
        ))}
      </div>
      <div className="border-t border-line px-5 py-4">
        <p className="mb-3 text-[13px] font-semibold text-ink">
          Browse by dimension <span className="font-normal text-ink-muted">· 1D, 2D and 3D bulk — open any card for its interactive 3D model</span>
        </p>
        <div className="space-y-2.5">
          {DIMENSIONS.map((dim) => {
            const members = MATERIALS.filter(dim.match);
            const expanded = openDim === dim.id;
            return (
              <div key={dim.id} className="overflow-hidden rounded-xl border border-line bg-panel/50">
                <button
                  onClick={() => setOpenDim(expanded ? null : dim.id)}
                  aria-expanded={expanded}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/4"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-blue/12 text-[12px] font-bold text-blue-soft">
                    {dim.id.toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-semibold text-ink">{dim.label}</span>
                    <span className="block text-[11.5px] text-ink-muted">{dim.hint} · {members.length} materials</span>
                  </span>
                  <ChevronDown className={cn("size-4 shrink-0 text-ink-muted transition-transform", expanded && "rotate-180")} />
                </button>
                {expanded && (
                  <div className="grid gap-2.5 border-t border-line p-3 sm:grid-cols-2 xl:grid-cols-4">
                    {members.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => navigate(`/materials/${m.id}`)}
                        className="group overflow-hidden rounded-xl border border-line bg-panel/70 text-left transition-all hover:-translate-y-0.5 hover:border-blue-soft/40"
                      >
                        <div className="relative h-24 overflow-hidden">
                          <MaterialArt kind={m.art} accent={m.accent} />
                        </div>
                        <div className="p-2.5">
                          <p className="truncate text-[12.5px] font-semibold text-ink">{m.name}</p>
                          <p className="truncate text-[11px] text-ink-muted">{m.formula}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <p className="hidden px-5 pb-4 text-[11.5px] text-ink-muted xl:block">
        Based on {MATERIALS.filter((m) => m.trending).length} trending entries in the sample catalogue · updated continuously
      </p>
    </Card>
  );
}
