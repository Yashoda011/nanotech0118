import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Play, UploadCloud, FolderPlus, Sparkles, ArrowLeft, Activity as ActivityIcon } from "lucide-react";
import { PageHeader } from "@/components/shell/AppLayout";
import { Card, EmptyState } from "@/components/ui";
import { useApp } from "@/store/app";
import { relativeTime, cn } from "@/lib/utils";
import type { ActivityKind } from "@/data/seeds";

const KIND_ICON: Record<ActivityKind, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  search: Search,
  simulation: Play,
  dataset: UploadCloud,
  project: FolderPlus,
  system: Sparkles,
};

const KIND_STYLE: Record<ActivityKind, string> = {
  search: "bg-blue/15 text-blue-soft",
  simulation: "bg-violet/15 text-violet",
  dataset: "bg-mint/15 text-mint",
  project: "bg-gold/15 text-gold",
  system: "bg-cyan/15 text-cyan",
};

const FILTERS: { id: ActivityKind | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "search", label: "Searches" },
  { id: "simulation", label: "Simulations" },
  { id: "dataset", label: "Datasets" },
  { id: "project", label: "Projects" },
  { id: "system", label: "System" },
];

export default function ActivityPage() {
  const { activities } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<ActivityKind | "all">("all");
  const [query, setQuery] = useState("");

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return activities.filter((a) => {
      if (filter !== "all" && a.kind !== filter) return false;
      if (q && !`${a.title} ${a.meta ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [activities, filter, query]);

  return (
    <div className="mx-auto max-w-[900px]">
      <PageHeader
        title="Activity"
        subtitle={`${activities.length} events — searches, simulations, datasets, projects and system notices.`}
      />

      <Card>
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-4">
          <button
            onClick={() => navigate(-1)}
            className="mr-1 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ink-muted transition hover:text-ink"
          >
            <ArrowLeft className="size-4" /> Back
          </button>
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors",
                  filter === f.id ? "border-blue/50 bg-blue/12 text-ink" : "border-line text-ink-muted hover:text-ink",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative ml-auto w-full sm:w-56">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter activity…"
              aria-label="Filter activity"
              className="h-9 w-full rounded-xl border border-line bg-panel/80 pl-9 pr-3 text-[13px] text-ink placeholder:text-ink-muted focus:border-blue-soft/50 focus:outline-none"
            />
          </div>
        </div>

        {items.length === 0 ? (
          <EmptyState
            icon={ActivityIcon}
            title="No activity found"
            description={activities.length === 0 ? "Use the workspace and events will appear here." : "Try a different filter or search term."}
          />
        ) : (
          <ul className="space-y-0.5 p-3">
            {items.map((a) => {
              const Icon = KIND_ICON[a.kind];
              return (
                <li key={a.id} className="flex items-start gap-3 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-white/4">
                  <span className={cn("grid size-9 shrink-0 place-items-center rounded-full", KIND_STYLE[a.kind])}>
                    <Icon className="size-4" strokeWidth={1.9} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium leading-snug text-ink">{a.title}</span>
                    <span className="mt-0.5 block text-[11.5px] text-ink-muted">
                      {relativeTime(a.at)}
                      {a.meta ? ` · ${a.meta}` : ""}
                    </span>
                  </span>
                  <span className="mt-1 shrink-0 rounded-full border border-line px-2 py-0.5 text-[10.5px] capitalize text-ink-muted">
                    {a.kind}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
