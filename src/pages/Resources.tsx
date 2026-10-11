import { useMemo, useState } from "react";
import { Search, BookOpen, Clock } from "lucide-react";
import { PageHeader } from "@/components/shell/AppLayout";
import { Card, Modal, Button, Badge, EmptyState } from "@/components/ui";
import { RESOURCES, RESOURCE_BODY } from "@/data/research";
import { cn } from "@/lib/utils";

export default function ResourcesPage() {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("All");
  const [openId, setOpenId] = useState<string | null>(null);

  const tags = useMemo(() => ["All", ...Array.from(new Set(RESOURCES.map((r) => r.tag)))], []);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return RESOURCES.filter((r) => {
      if (tag !== "All" && r.tag !== tag) return false;
      if (!q) return true;
      return r.title.toLowerCase().includes(q) || r.blurb.toLowerCase().includes(q) || r.type.toLowerCase().includes(q);
    });
  }, [query, tag]);

  const open = RESOURCES.find((r) => r.id === openId);

  return (
    <div className="mx-auto max-w-[1440px]">
      <PageHeader
        title="Resources"
        subtitle="Guides, references and playbooks bundled with the workspace — searchable offline."
      />

      <Card className="p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-ink-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search resources…"
              aria-label="Search resources"
              className="h-11 w-full rounded-xl border border-line bg-panel/80 pl-11 pr-4 text-sm text-ink placeholder:text-ink-muted focus:border-blue-soft/50 focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <button
                key={t}
                onClick={() => setTag(t)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium transition-colors",
                  tag === t ? "border-blue/45 bg-blue/18 text-blue-soft" : "border-line bg-panel/60 text-ink-muted hover:text-ink-soft",
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {results.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            title="Nothing matched"
            description="Try a different keyword or switch back to the All tag."
            action={
              <Button
                variant="gradient"
                onClick={() => {
                  setQuery("");
                  setTag("All");
                }}
              >
                Reset search
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {results.map((r) => (
            <Card key={r.id} lift className="flex flex-col p-5">
              <div className="flex items-center justify-between gap-2">
                <Badge tone="blue">{r.type}</Badge>
                <span className="inline-flex items-center gap-1 text-[11.5px] text-ink-muted">
                  <Clock className="size-3.5" /> {r.readMinutes} min
                </span>
              </div>
              <h2 className="mt-3 text-[14.5px] font-semibold leading-snug text-ink">{r.title}</h2>
              <p className="mt-2 flex-1 text-[12.5px] leading-relaxed text-ink-muted">{r.blurb}</p>
              <Button variant="secondary" size="sm" className="mt-4 self-start" onClick={() => setOpenId(r.id)}>
                <BookOpen className="size-3.5" /> Read
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(open)}
        onClose={() => setOpenId(null)}
        title={open?.title ?? ""}
        description={open ? `${open.type} · ${open.tag} · ${open.readMinutes} min read` : ""}
        size="lg"
        footer={<Button onClick={() => setOpenId(null)}>Close</Button>}
      >
        <div className="space-y-4">
          <p className="text-[13.5px] leading-relaxed text-ink-soft">{open?.blurb}</p>
          {RESOURCE_BODY.default.sections.map((s) => (
            <div key={s.heading}>
              <h3 className="text-[13.5px] font-semibold text-ink">{s.heading}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">{s.text}</p>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
