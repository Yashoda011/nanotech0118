import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Compass,
  Atom,
  GraduationCap,
  Brain,
  Factory,
  Boxes,
  FlaskConical,
  BarChart3,
  Folder,
  BookOpen,
  FileText,
  Users,
  ShieldCheck,
  Settings as SettingsIcon,
  Hexagon,
  X,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";
import { useApp } from "@/store/app";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/explore", label: "Explore Nanomaterials", icon: Compass },
  { to: "/simulation", label: "Simulation", icon: Atom },
  { to: "/modeling", label: "Modeling", icon: Boxes },
  { to: "/learn", label: "Learn", icon: GraduationCap },
  { to: "/ai", label: "AI Platform", icon: Brain },
  { to: "/business", label: "Business", icon: Factory },
  { to: "/lab-tools", label: "Lab Tools", icon: FlaskConical },
  { to: "/analysis", label: "Data & Analysis", icon: BarChart3 },
  { to: "/projects", label: "Projects", icon: Folder },
  { to: "/resources", label: "Resources", icon: BookOpen },
  { to: "/docs", label: "Documents", icon: FileText },
  { to: "/community", label: "Community", icon: Users },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export function Logo({ compact = false }: { compact?: boolean }) {
  const logoSrc = `${import.meta.env.BASE_URL}nanotech-logo.jpg`;
  return (
    <div className="flex items-center gap-3">
      <img
        src={logoSrc}
        alt="NanoTech logo — atom orbits over NANOTECH wordmark"
        className="size-10 shrink-0 rounded-xl bg-white object-cover shadow-lg shadow-blue-900/40 ring-1 ring-white/20"
      />
      {!compact && (
        <span className="min-w-0">
          <span className="block text-[19px] font-bold leading-none tracking-tight text-ink">
            Nano<span className="grad-text">Sphere</span>
          </span>
        </span>
      )}
    </div>
  );
}

function SidebarBody({ onNavigate, onCloseDrawer }: { onNavigate?: () => void; onCloseDrawer?: () => void }) {
  const { user } = useApp();
  const items = user?.isAdmin ? [...NAV_ITEMS, { to: "/admin", label: "Admin Panel", icon: ShieldCheck }] : NAV_ITEMS;
  return (
    <div className="flex h-full flex-col gap-6 px-4 py-5">
      <div className="flex items-start justify-between">
        <NavLink to="/" onClick={onNavigate} aria-label="NanoSphere dashboard">
          <Logo />
        </NavLink>
        {onCloseDrawer && (
          <button
            onClick={onCloseDrawer}
            aria-label="Close navigation"
            className="grid size-9 place-items-center rounded-lg text-ink-muted transition hover:bg-white/6 hover:text-ink lg:hidden"
          >
            <X className="size-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto scrollbar-thin" aria-label="Primary">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} onClick={onNavigate} className="block">
            {({ isActive }) => (
              <span
                className={cn(
                  "relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors duration-200",
                  isActive ? "text-blue-soft" : "text-ink-soft hover:bg-white/5 hover:text-ink",
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl border border-blue/35 bg-blue/14"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <Icon className={cn("relative z-10 size-[18px]", isActive ? "text-blue-soft" : "text-ink-muted")} strokeWidth={1.9} />
                <span className="relative z-10 truncate">{label}</span>
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="rounded-2xl border border-line bg-gradient-to-b from-elevated to-panel p-4">
        <span className="grid size-9 place-items-center rounded-xl bg-blue/15 text-blue-soft">
          <Hexagon className="size-5" strokeWidth={1.8} />
        </span>
        <p className="mt-3 text-sm font-semibold text-ink">Upgrade to Pro</p>
        <p className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">
          Get advanced simulation tools, higher limits and priority support.
        </p>
        <GoProButton />
      </div>
    </div>
  );
}

export function GoProButton() {
  const navigate = useNavigate();
  const { isPro, pushToast, refreshBilling } = useApp();

  const cancel = async () => {
    try {
      const { api } = await import("@/lib/api");
      await api.cancelPro();
      await refreshBilling();
      pushToast("Pro cancelled — back to Starter", "info");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Cancel failed", "info");
    }
  };

  if (isPro) {
    return (
      <Button variant="secondary" size="sm" className="mt-3.5 w-full" onClick={() => void cancel()}>
        Pro active — Manage
      </Button>
    );
  }

  return (
    <Button variant="gradient" size="sm" className="mt-3.5 w-full" onClick={() => navigate("/pricing")}>
      Go Pro <ArrowRight className="size-3.5" />
    </Button>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-line bg-panel/70 lg:block">
      <SidebarBody />
    </aside>
  );
}

export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[17rem] border-r border-line bg-panel transition-transform duration-300 lg:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <SidebarBody onCloseDrawer={onClose} onNavigate={onClose} />
      </aside>
    </>
  );
}
