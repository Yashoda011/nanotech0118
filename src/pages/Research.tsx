import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock, Calendar, ShieldCheck, Satellite, Search, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/shell/AppLayout";
import { Card, Badge, EmptyState, Button, SegmentedControl } from "@/components/ui";
import { ResearchThumb } from "@/art";
import { ARTICLES, getArticle, type Article } from "@/data/research";
import { api, type DbArticle, type LivePaper } from "@/lib/api";
import { useApp } from "@/store/app";
import { shortDate, cn } from "@/lib/utils";

export function ResearchIndexPage() {
  const { backendOnline, pushToast } = useApp();
  const [tab, setTab] = useState<"verified" | "live">("verified");
  const [items, setItems] = useState<Article[] | null>(null);
  const [query, setQuery] = useState("");
  const [liveQuery, setLiveQuery] = useState("");
  const [papers, setPapers] = useState<LivePaper[] | null>(null);
  const [liveBusy, setLiveBusy] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!backendOnline) {
      setItems(null);
      return;
    }
    api
      .dbArticles()
      .then((res) => {
        if (cancelled) return;
        setItems(
          res.articles.map(
            (a: DbArticle): Article => ({
              id: a.id,
              title: a.title,
              source: a.source,
              date: a.date,
              readMinutes: a.readMinutes,
              art: a.art as Article["art"],
              accent: a.accent,
              excerpt: a.excerpt,
              tags: a.tags,
              body: a.body,
            }),
          ),
        );
      })
      .catch(() => {
        if (!cancelled) setItems(null);
      });
    return () => {
      cancelled = true;
    };
  }, [backendOnline]);

  const catalogue = items ?? ARTICLES;
  const q = query.trim().toLowerCase();
  const shown = q
    ? catalogue.filter(
        (a) => a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q) || a.tags.some((t) => t.toLowerCase().includes(q)),
      )
    : catalogue;

  const lookup = async () => {
    if (liveQuery.trim().length < 3) {
      pushToast("Type at least 3 characters to search live literature", "info");
      return;
    }
    setLiveBusy(true);
    setLiveError(null);
    try {
      const res = await api.livePapers(liveQuery.trim());
      setPapers(res.papers);
    } catch (e) {
      setLiveError(e instanceof Error ? e.message : "Live lookup failed");
      setPapers(null);
    } finally {
      setLiveBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1440px]">
      <PageHeader
        title="Latest Research"
        subtitle={
          items
            ? "Verified summaries from the database — curated sources, identical on every device."
            : "Demo summaries of recent nanotechnology literature — connect the backend for the verified catalogue."
        }
        actions={
          <SegmentedControl
            options={[
              { value: "verified", label: "Verified" },
              { value: "live", label: "Live lookup" },
            ]}
            value={tab}
            onChange={(v) => setTab(v as typeof tab)}
          />
        }
      />

      {tab === "verified" ? (
        <>
          <div className="relative mb-4 max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter verified summaries…"
              aria-label="Filter research summaries"
              className="h-10 w-full rounded-xl border border-line bg-panel/80 pl-10 pr-3 text-sm text-ink placeholder:text-ink-muted focus:border-blue-soft/50 focus:outline-none"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {shown.map((a) => (
              <Link key={a.id} to={`/research/${a.id}`}>
                <Card lift className="group h-full overflow-hidden">
                  <div className="h-36 overflow-hidden">
                    <ResearchThumb kind={a.art} accent={a.accent} className="transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-5">
                    <div className="flex flex-wrap gap-1.5">
                      {items && (
                        <Badge tone="green"><ShieldCheck className="size-3" /> Verified</Badge>
                      )}
                      {a.tags.slice(0, 2).map((t) => (
                        <Badge key={t} tone="violet">
                          {t}
                        </Badge>
                      ))}
                    </div>
                    <h2 className="mt-2.5 text-[15px] font-semibold leading-snug text-ink transition-colors group-hover:text-blue-soft">
                      {a.title}
                    </h2>
                    <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-ink-muted">{a.excerpt}</p>
                    <p className="mt-3 flex items-center gap-3 text-[11.5px] text-ink-muted">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="size-3.5" /> {shortDate(a.date)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3.5" /> {a.readMinutes} min read
                      </span>
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
          {shown.length === 0 && (
            <EmptyState title="No summaries match" description="Try a different keyword." />
          )}
        </>
      ) : (
        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
            <Satellite className="size-4 text-cyan" /> Live literature lookup
          </h2>
          <p className="mt-1 text-[12.5px] text-ink-muted">
            Proxied through the backend to Semantic Scholar (verified external source). Falls back to the catalogue if unreachable.
          </p>
          <div className="mt-3 flex gap-2">
            <input
              value={liveQuery}
              onChange={(e) => setLiveQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void lookup()}
              placeholder="e.g. perovskite quantum dot solar…"
              aria-label="Search live literature"
              className="h-11 flex-1 rounded-xl border border-line bg-panel/80 px-4 text-sm text-ink placeholder:text-ink-muted focus:border-blue-soft/50 focus:outline-none"
            />
            <Button variant="gradient" onClick={() => void lookup()} disabled={liveBusy || !backendOnline}>
              {liveBusy ? "Searching…" : "Search"}
            </Button>
          </div>
          {!backendOnline && <p className="mt-2 text-[12px] text-gold">Backend offline — live lookup needs the FastAPI server.</p>}
          {liveError && <p className="mt-2 text-[12.5px] text-rose">{liveError}</p>}
          {papers && (
            <ul className="mt-4 space-y-2.5">
              {papers.map((p) => (
                <li key={p.paperId || p.title} className="rounded-xl border border-line px-4 py-3">
                  <p className="text-[13.5px] font-semibold leading-snug text-ink">{p.title}</p>
                  <p className="mt-1 text-[12px] text-ink-muted">
                    {p.authors}{p.year ? ` · ${p.year}` : ""}{p.venue ? ` · ${p.venue}` : ""} · cited {p.citations}×
                  </p>
                  {p.abstract && <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-ink-soft">{p.abstract}</p>}
                  {p.url && (
                    <a href={p.url} target="_blank" rel="noreferrer" className={cn("mt-1.5 inline-flex items-center gap-1 text-[12px] font-medium text-blue-soft hover:underline")}>
                      Open paper <ExternalLink className="size-3" />
                    </a>
                  )}
                </li>
              ))}
              {papers.length === 0 && <p className="py-3 text-center text-[12.5px] text-ink-muted">No papers found for that query.</p>}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}

export function ResearchArticlePage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const article = getArticle(id);

  if (!article) {
    return (
      <div className="mx-auto max-w-3xl pt-10">
        <EmptyState
          title="Article not found"
          description="That research entry does not exist in the bundled demo library."
          action={
            <Link to="/research">
              <Button variant="gradient">Browse all research</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const related = ARTICLES.filter((a) => a.id !== article.id).slice(0, 3);

  return (
    <div className="mx-auto max-w-[1100px]">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ink-muted transition hover:text-ink"
      >
        <ArrowLeft className="size-4" /> Back
      </button>

      <Card className="overflow-hidden">
        <div className="h-56 sm:h-72">
          <ResearchThumb kind={article.art} accent={article.accent} />
        </div>
        <article className="px-6 py-7 sm:px-9 sm:py-9">
          <div className="flex flex-wrap gap-1.5">
            {article.tags.map((t) => (
              <Badge key={t} tone="violet">
                {t}
              </Badge>
            ))}
          </div>
          <h1 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-ink sm:text-3xl">{article.title}</h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-ink-muted">
            <span className="font-medium text-ink-soft">{article.source}</span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="size-3.5" /> {shortDate(article.date)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5" /> {article.readMinutes} min read
            </span>
          </p>
          <p className="mt-6 text-[15px] leading-relaxed text-ink-soft">{article.excerpt}</p>
          <div className="mt-5 space-y-4 border-t border-line pt-5">
            {article.body.map((p, i) => (
              <p key={i} className="text-[14px] leading-[1.75] text-ink-soft">
                {p}
              </p>
            ))}
          </div>
          <p className="mt-6 rounded-xl border border-line bg-panel/60 px-4 py-3 text-[11.5px] leading-relaxed text-ink-muted">
            Demo content notice — this summary is fictional and bundled with the interface for demonstration purposes.
          </p>
        </article>
      </Card>

      <h2 className="mb-3 mt-8 text-[15px] font-semibold text-ink">More research</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {related.map((a) => (
          <Link key={a.id} to={`/research/${a.id}`}>
            <Card lift className="h-full p-4">
              <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-ink">{a.title}</p>
              <p className="mt-2 text-[11.5px] text-ink-muted">
                {shortDate(a.date)} · {a.readMinutes} min read
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
