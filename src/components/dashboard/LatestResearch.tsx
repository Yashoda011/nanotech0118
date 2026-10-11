import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Card, SectionHeader } from "@/components/ui";
import { ResearchThumb } from "@/art";
import { ARTICLES } from "@/data/research";
import { shortDate } from "@/lib/utils";

export function LatestResearch() {
  const navigate = useNavigate();
  const items = ARTICLES.slice(0, 4);

  return (
    <Card className="overflow-hidden">
      <SectionHeader
        title="Latest Research"
        action={
          <Link
            to="/research"
            className="inline-flex items-center gap-1 text-[12.5px] font-medium text-blue-soft transition hover:gap-1.5 hover:underline"
          >
            View All <ArrowRight className="size-3.5" />
          </Link>
        }
      />
      <ul className="space-y-1 px-3 pb-3">
        {items.map((a) => (
          <li key={a.id}>
            <button
              onClick={() => navigate(`/research/${a.id}`)}
              className="group flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-white/5"
            >
              <span className="size-11 shrink-0 overflow-hidden rounded-lg border border-line">
                <ResearchThumb kind={a.art} accent={a.accent} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 block text-[12.5px] font-semibold leading-snug text-ink transition-colors group-hover:text-blue-soft">
                  {a.title}
                </span>
                <span className="mt-1.5 block text-[11px] text-ink-muted">
                  {shortDate(a.date)} · {a.readMinutes} min read
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
