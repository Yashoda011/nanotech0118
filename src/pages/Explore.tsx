import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Bookmark, SlidersHorizontal, Atom, GitCompareArrows, X } from "lucide-react";
import { PageHeader } from "@/components/shell/AppLayout";
import { Card, Button, Badge, Select, EmptyState, Skeleton, Modal, categoryTone } from "@/components/ui";
import { MaterialArt } from "@/art";
import { MATERIALS, CATEGORIES, type Category, type Material, type ArtKind } from "@/data/materials";
import { api } from "@/lib/api";
import { useApp } from "@/store/app";
import { cn } from "@/lib/utils";

type SortKey = "name" | "conductivity" | "bandgap" | "newest";

const SORTS: { value: SortKey; label: string }[] = [
  { value: "name", label: "Name (A–Z)" },
  { value: "conductivity", label: "Conductivity (high → low)" },
  { value: "bandgap", label: "Band gap (low → high)" },
  { value: "newest", label: "Newest first" },
];

export default function ExplorePage() {
  const [params] = useSearchParams();
  const { saved, toggleSaved, pushSearch, backendOnline, pushToast } = useApp();
  const initialQ = params.get("q") ?? "";
  const shouldFocus = params.get("focus") === "1";

  const [query, setQuery] = useState(initialQ);
  const [category, setCategory] = useState<Category | "All">("All");
  const [minElectrical, setMinElectrical] = useState(0);
  const [sort, setSort] = useState<SortKey>("name");
  const [savedOnly, setSavedOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dbList, setDbList] = useState<Material[] | null>(null);
  const [dbFailed, setDbFailed] = useState(false);
  const [compare, setCompare] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Database-backed catalogue when online; bundled fallback offline.
  useEffect(() => {
    let cancelled = false;
    if (!backendOnline) {
      setDbList(null);
      return;
    }
    api
      .dbMaterials()
      .then((res) => {
        if (cancelled) return;
        setDbList(
          res.materials.map(
            (m) =>
              ({
                ...m,
                art: m.art as ArtKind,
                category: m.category as Category,
              }) as Material,
          ),
        );
        setDbFailed(false);
      })
      .catch(() => {
        if (!cancelled) {
          setDbList(null);
          setDbFailed(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [backendOnline]);

  const catalogue = dbList ?? MATERIALS;

  const toggleCompare = (id: string, name: string) => {
    setCompare((prev) => {
      if (prev.includes(id)) return prev.filter((c) => c !== id);
      if (prev.length >= 3) {
        pushToast("Compare up to 3 materials — remove one first", "info");
        return prev;
      }
      pushToast(`Added ${name} to compare`, "success");
      return [...prev, id];
    });
  };

  const compared = compare
    .map((id) => catalogue.find((m) => m.id === id))
    .filter((m): m is Material => Boolean(m));

  useEffect(() => {
    if (shouldFocus) inputRef.current?.focus();
  }, [shouldFocus]);

  useEffect(() => {
    setLoading(true);
    const t = window.setTimeout(() => setLoading(false), 280);
    return () => window.clearTimeout(t);
  }, [query, category, minElectrical, sort, savedOnly]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = catalogue.filter((m) => {
      if (category !== "All" && m.category !== category) return false;
      if (minElectrical > 0 && m.index.electrical < minElectrical) return false;
      if (savedOnly && !saved.includes(m.id)) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.formula.toLowerCase().includes(q) ||
        m.tagline.toLowerCase().includes(q) ||
        m.applications.some((a) => a.toLowerCase().includes(q))
      );
    });
    return [...list].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "conductivity") return b.numbers.conductivity - a.numbers.conductivity;
      if (sort === "bandgap") return a.numbers.bandGap - b.numbers.bandGap;
      return b.year - a.year;
    });
  }, [query, category, minElectrical, sort, savedOnly, saved, catalogue]);

  const reset = () => {
    setQuery("");
    setCategory("All");
    setMinElectrical(0);
    setSort("name");
    setSavedOnly(false);
  };

  return (
    <div className="mx-auto max-w-[1440px]">
      <PageHeader
        title="Explore Nanomaterials"
        subtitle={
          dbList
            ? "Live from the Postgres catalogue — search, filter and compare stored properties."
            : dbFailed
              ? "Backend unreachable — showing the bundled offline catalogue."
              : "Browse the bundled catalogue, filter by category and property index, then open any material for the full property sheet."
        }
        actions={
          <Link to="/simulation">
            <Button variant="secondary">
              <Atom className="size-4" /> Open simulation console
            </Button>
          </Link>
        }
      />

      <Card className="p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-ink-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && pushSearch(query)}
                placeholder="Search by name, formula or application…"
                aria-label="Search the material catalogue"
                className="h-11 w-full rounded-xl border border-line bg-panel/80 pl-11 pr-4 text-sm text-ink placeholder:text-ink-muted focus:border-blue-soft/50 focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Sort materials" className="w-56">
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
              <Button variant={savedOnly ? "soft" : "secondary"} onClick={() => setSavedOnly((v) => !v)}>
                <Bookmark className="size-4" /> Saved ({saved.length})
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(["All", ...CATEGORIES] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium transition-colors",
                  category === c
                    ? "border-blue/45 bg-blue/18 text-blue-soft"
                    : "border-line bg-panel/60 text-ink-muted hover:border-blue-soft/30 hover:text-ink-soft",
                )}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <span className="inline-flex items-center gap-2 text-[12.5px] font-medium text-ink-soft">
              <SlidersHorizontal className="size-4 text-ink-muted" /> Min electrical index
            </span>
            <input
              type="range"
              min={0}
              max={80}
              step={5}
              value={minElectrical}
              onChange={(e) => setMinElectrical(Number(e.target.value))}
              className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-panel"
              aria-label="Minimum electrical conductivity index"
            />
            <span className="w-16 text-right text-[12.5px] font-semibold tabular-nums text-blue-soft">{minElectrical}</span>
          </div>
        </div>
      </Card>

      <p className="mt-5 text-[12.5px] text-ink-muted">
        {loading ? "Loading materials…" : `${results.length} material${results.length === 1 ? "" : "s"} found`}
      </p>

      {loading ? (
        <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="mt-3">
          <EmptyState
            title="No materials match those filters"
            description="Try widening the category or lowering the minimum electrical index. The sample catalogue ships with 12 engineered nanomaterials."
            action={
              <Button variant="gradient" onClick={reset}>
                Reset filters
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {results.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.3) }}
            >
              <Card lift className="group h-full overflow-hidden">
                <Link to={`/materials/${m.id}`} className="block">
                  <div className="h-28 overflow-hidden">
                    <MaterialArt kind={m.art} accent={m.accent} className="transition-transform duration-500 group-hover:scale-105" />
                  </div>
                </Link>
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/materials/${m.id}`} className="min-w-0">
                      <p className="truncate text-[14.5px] font-semibold text-ink transition-colors group-hover:text-blue-soft">{m.name}</p>
                      <p className="mt-0.5 text-[11.5px] text-ink-muted">{m.formula}</p>
                    </Link>
                    <div className="flex shrink-0 gap-1">
                      <button
                        onClick={() => toggleCompare(m.id, m.name)}
                        aria-label={compare.includes(m.id) ? `Remove ${m.name} from compare` : `Add ${m.name} to compare`}
                        title="Compare side-by-side"
                        className={cn(
                          "grid size-8 place-items-center rounded-lg border transition-colors",
                          compare.includes(m.id)
                            ? "border-blue/50 bg-blue/15 text-blue-soft"
                            : "border-line text-ink-muted hover:border-blue-soft/40 hover:text-blue-soft",
                        )}
                      >
                        <GitCompareArrows className="size-4" />
                      </button>
                      <button
                        onClick={() => toggleSaved(m.id)}
                        aria-label={saved.includes(m.id) ? `Remove ${m.name} from saved` : `Save ${m.name}`}
                        className={cn(
                          "grid size-8 shrink-0 place-items-center rounded-lg border transition-colors",
                          saved.includes(m.id)
                            ? "border-gold/40 bg-gold/15 text-gold"
                            : "border-line text-ink-muted hover:border-blue-soft/40 hover:text-blue-soft",
                        )}
                      >
                        <Bookmark className="size-4" fill={saved.includes(m.id) ? "currentColor" : "none"} />
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-ink-muted">{m.tagline}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Badge tone={categoryTone(m.category)}>{m.category}</Badge>
                    {m.biocompatible && <Badge tone="green">Biocompatible</Badge>}
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-line pt-3 text-[11.5px]">
                    <div>
                      <dt className="text-ink-muted">Conductivity</dt>
                      <dd className="mt-0.5 font-medium text-ink-soft">{m.properties.conductivity}</dd>
                    </div>
                    <div>
                      <dt className="text-ink-muted">Band gap</dt>
                      <dd className="mt-0.5 font-medium text-ink-soft">{m.properties.bandGap}</dd>
                    </div>
                  </dl>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {compare.length > 0 && (
        <div className="fixed bottom-4 left-1/2 z-40 flex w-[min(36rem,calc(100vw-2rem))] -translate-x-1/2 items-center gap-3 rounded-2xl border border-line bg-elevated/95 px-4 py-3 shadow-2xl shadow-black/60 backdrop-blur">
          <span className="min-w-0 flex-1 truncate text-[13px] text-ink-soft">
            Comparing {compare.length}/3: {compared.map((m) => m.name).join(" · ")}
          </span>
          <button
            onClick={() => setCompare([])}
            aria-label="Clear compare selection"
            className="grid size-8 shrink-0 place-items-center rounded-lg text-ink-muted hover:text-ink"
          >
            <X className="size-4" />
          </button>
          <Button variant="gradient" size="sm" onClick={() => setCompareOpen(true)}>
            Compare now
          </Button>
        </div>
      )}

      <Modal
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        title="Side-by-side comparison"
        description="Stored properties from the catalogue — identical data on every device."
        size="lg"
        footer={<Button onClick={() => setCompareOpen(false)}>Close</Button>}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[30rem] border-collapse text-[12.5px]">
            <thead>
              <tr>
                <th className="sticky left-0 bg-elevated px-3 py-2.5 text-left font-medium text-ink-muted">Property</th>
                {compared.map((m) => (
                  <th key={m.id} className="px-3 py-2.5 text-left font-semibold text-ink">
                    {m.name}
                    <span className="block text-[11px] font-normal text-ink-muted">{m.formula} · {m.category}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ["Conductivity", (m: Material) => m.properties.conductivity],
                  ["Thermal conductivity", (m: Material) => m.properties.thermalConductivity],
                  ["Tensile strength", (m: Material) => m.properties.tensileStrength],
                  ["Band gap", (m: Material) => m.properties.bandGap],
                  ["Density", (m: Material) => m.properties.density],
                  ["Size", (m: Material) => m.properties.size],
                  ["Melting point", (m: Material) => m.properties.meltingPoint],
                  ["Electrical index", (m: Material) => `${m.index.electrical}/100`],
                  ["Thermal index", (m: Material) => `${m.index.thermal}/100`],
                  ["Tensile index", (m: Material) => `${m.index.tensile}/100`],
                ] as [string, (m: Material) => string][]
              ).map(([label, get]) => (
                <tr key={label} className="border-t border-line/60">
                  <td className="sticky left-0 bg-elevated px-3 py-2 font-medium text-ink-muted">{label}</td>
                  {compared.map((m) => (
                    <td key={m.id} className="px-3 py-2 text-ink-soft">{get(m)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
}
