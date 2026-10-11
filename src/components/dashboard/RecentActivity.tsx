import { Search, Play, UploadCloud, FolderPlus, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, SectionHeader } from "@/components/ui";
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

export function RecentActivity() {
  const { activities } = useApp();
  const navigate = useNavigate();
  const items = activities.slice(0, 4);

  return (
    <Card className="h-full">
      <SectionHeader
        title="Recent Activity"
        action={
          <button
            onClick={() => navigate("/activity")}
            className="inline-flex items-center gap-1 text-[12.5px] font-medium text-blue-soft transition hover:gap-1.5 hover:underline"
          >
            View All
            <span aria-hidden="true">→</span>
          </button>
        }
      />
      <ul className="space-y-0.5 px-3 pb-4">
        {items.map((a) => {
          const Icon = KIND_ICON[a.kind];
          return (
            <li key={a.id} className="flex items-start gap-3 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-white/4">
              <span className={cn("grid size-9 shrink-0 place-items-center rounded-full", KIND_STYLE[a.kind])}>
                <Icon className="size-4" strokeWidth={1.9} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[12.5px] font-medium leading-snug text-ink">{a.title}</span>
                <span className="mt-0.5 block text-[11px] text-ink-muted">
                  {relativeTime(a.at)}
                  {a.meta ? ` · ${a.meta}` : ""}
                </span>
              </span>
            </li>
          );
        })}
        {items.length === 0 && <p className="px-3 py-6 text-center text-[12.5px] text-ink-muted">No activity yet.</p>}
      </ul>
    </Card>
  );
}
