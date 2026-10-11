import { useNavigate } from "react-router-dom";
import { GraduationCap, Brain, Factory, Boxes, ArrowRight } from "lucide-react";
import { Hero } from "@/components/dashboard/Hero";
import { QuickAccess } from "@/components/dashboard/QuickAccess";
import { TrendingMaterials } from "@/components/dashboard/TrendingMaterials";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { LatestResearch } from "@/components/dashboard/LatestResearch";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { ComparisonChart } from "@/components/dashboard/ComparisonChart";
import { PromoCard } from "@/components/dashboard/PromoCard";

const MODULES = [
  { to: "/learn", title: "Learning & Education", desc: "Courses, lessons & quizzes", icon: GraduationCap, color: "#38bdf8" },
  { to: "/ai", title: "AI Platform", desc: "Recommender & predictors", icon: Brain, color: "#f472b6" },
  { to: "/business", title: "Business & Industrial", desc: "Batches, QC & costing", icon: Factory, color: "#fbbf24" },
  { to: "/modeling", title: "Modeling", desc: "Unit cells & lattices", icon: Boxes, color: "#22d3ee" },
];

function PlatformStrip() {
  const navigate = useNavigate();
  return (
    <section aria-label="Platform modules" className="mt-5">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {MODULES.map(({ to, title, desc, icon: Icon, color }) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            className="card card-lift group flex items-center gap-3.5 p-4 text-left"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-xl" style={{ background: `${color}22`, color }}>
              <Icon className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-semibold text-ink">{title}</span>
              <span className="block truncate text-[12px] text-ink-muted">{desc}</span>
            </span>
            <ArrowRight className="size-4 shrink-0 text-ink-muted transition-transform group-hover:translate-x-0.5 group-hover:text-ink" />
          </button>
        ))}
      </div>
    </section>
  );
}

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-[1440px]">
      <Hero />

      <div className="mt-5">
        <QuickAccess />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-12">
        <div className="space-y-5 xl:col-span-9">
          <div className="grid gap-5 lg:grid-cols-12">
            <div className="lg:col-span-8 xl:col-span-8">
              <TrendingMaterials />
            </div>
            <div className="lg:col-span-4 xl:col-span-4">
              <QuickActions />
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-12">
            <div className="lg:col-span-5 xl:col-span-4">
              <RecentActivity />
            </div>
            <div className="lg:col-span-7 xl:col-span-8">
              <ComparisonChart />
            </div>
          </div>
        </div>

        <aside className="space-y-5 xl:col-span-3">
          <LatestResearch />
          <PromoCard />
        </aside>
      </div>

      <PlatformStrip />
    </div>
  );
}
