import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Bell, ChevronDown, Menu, User, Settings, LogOut, CornerDownLeft, Sparkles, Info, FileText, Users, Activity, LogIn, UserPlus, BookOpen, ExternalLink, Mail } from "lucide-react";
import { Avatar } from "@/art";
import { Dropdown, DropdownItem, Modal, Button } from "@/components/ui";
import { api, API_BASE } from "@/lib/api";
import { useApp } from "@/store/app";
import { MATERIALS } from "@/data/materials";
import { ARTICLES } from "@/data/research";
import { cn, relativeTime } from "@/lib/utils";

interface Suggestion {
  id: string;
  label: string;
  meta: string;
  to: string;
  kind: "material" | "article" | "action" | "search";
}

function buildSuggestions(query: string): Suggestion[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const actions: Suggestion[] = [
    { id: "act-sim", label: "Run a simulation", meta: "Action", to: "/simulation", kind: "action" },
    { id: "act-up", label: "Upload a dataset", meta: "Action", to: "/analysis", kind: "action" },
    { id: "act-proj", label: "Create a project", meta: "Action", to: "/projects", kind: "action" },
  ];
  const materials = MATERIALS.filter(
    (m) => m.name.toLowerCase().includes(q) || m.formula.toLowerCase().includes(q) || m.category.toLowerCase().includes(q),
  )
    .slice(0, 5)
    .map<Suggestion>((m) => ({
      id: `mat-${m.id}`,
      label: m.name,
      meta: m.category,
      to: `/materials/${m.id}`,
      kind: "material",
    }));
  const articles = ARTICLES.filter((a) => a.title.toLowerCase().includes(q) || a.tags.some((t) => t.toLowerCase().includes(q)))
    .slice(0, 3)
    .map<Suggestion>((a) => ({ id: `art-${a.id}`, label: a.title, meta: a.source, to: `/research/${a.id}`, kind: "article" }));
  const acts = actions.filter((a) => a.label.toLowerCase().includes(q));
  const exact: Suggestion[] =
    materials.length || articles.length || acts.length
      ? []
      : [{ id: "search-all", label: `Search nanomaterials for “${query.trim()}”`, meta: "Search", to: `/explore?q=${encodeURIComponent(query.trim())}`, kind: "search" }];
  return [...exact, ...materials, ...articles, ...acts].slice(0, 8);
}

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const { notifications, markAllRead, clearNotifications, settings, user, logout, pushSearch, pushToast } = useApp();

  const displayName = user?.name ?? settings.name;
  const displayEmail = user?.email ?? settings.email;
  const isGuest = !!user?.guest;

  const [infoDoc, setInfoDoc] = useState<"status" | null>(null);
  const [health, setHealth] = useState<{ status: string; db: string; version: string; ms: number } | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);

  const openStatus = async () => {
    setInfoDoc("status");
    setHealth(null);
    setHealthError(null);
    const t0 = performance.now();
    try {
      const h = await api.health();
      setHealth({ status: h.status, db: h.db, version: h.version, ms: Math.round(performance.now() - t0) });
    } catch (e) {
      setHealthError(e instanceof Error ? e.message : "Backend unreachable");
    }
  };

  const goAuth = (path: "/login" | "/signup") => {
    logout();
    navigate(path);
    pushToast("Signed out of guest session — sign in to continue", "info");
  };

  const suggestions = useMemo(() => buildSuggestions(query), [query]);
  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => setActiveIndex(0), [query]);

  const go = (s: Suggestion) => {
    setOpen(false);
    setQuery("");
    if (s.kind === "search" || s.kind === "material") pushSearch(query.trim() || s.label);
    navigate(s.to);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!suggestions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const s = suggestions[Math.min(activeIndex, suggestions.length - 1)];
      if (s) go(s);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-void/85 backdrop-blur-md">
      <div className="flex h-[68px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          onClick={onOpenMenu}
          aria-label="Open navigation"
          className="grid size-10 shrink-0 place-items-center rounded-xl border border-line text-ink-soft transition hover:bg-white/5 lg:hidden"
        >
          <Menu className="size-5" />
        </button>

        <div className="relative w-full max-w-2xl">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-ink-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="Search nanomaterials, properties, or keywords..."
            aria-label="Search nanomaterials, properties, or keywords"
            className="h-11 w-full rounded-xl border border-line bg-panel/80 pl-11 pr-4 text-sm text-ink placeholder:text-ink-muted transition-colors focus:border-blue-soft/50 focus:outline-none"
          />
          <AnimatePresence>
            {open && query.trim().length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 right-0 top-[3.25rem] z-50 overflow-hidden rounded-xl border border-line bg-elevated shadow-2xl shadow-black/60"
              >
                {suggestions.length === 0 ? (
                  <p className="px-4 py-3 text-[13px] text-ink-muted">Keep typing to search materials and research…</p>
                ) : (
                  suggestions.map((s, i) => (
                    <button
                      key={s.id}
                      onMouseEnter={() => setActiveIndex(i)}
                      onClick={() => go(s)}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                        i === activeIndex ? "bg-blue/12" : "hover:bg-white/5",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-8 shrink-0 place-items-center rounded-lg",
                          s.kind === "material"
                            ? "bg-cyan/15 text-cyan"
                            : s.kind === "article"
                              ? "bg-violet/15 text-violet"
                              : s.kind === "action"
                                ? "bg-mint/15 text-mint"
                                : "bg-blue/15 text-blue-soft",
                        )}
                      >
                        {s.kind === "article" ? <Sparkles className="size-4" /> : <Search className="size-4" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-ink">{s.label}</span>
                        <span className="block truncate text-[11.5px] text-ink-muted">{s.meta}</span>
                      </span>
                      {i === activeIndex && <CornerDownLeft className="size-3.5 text-ink-muted" />}
                    </button>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <Dropdown
            align="end"
            panelClassName="w-64"
            trigger={({ toggle, open: dopen }) => (
              <button
                onClick={toggle}
                aria-label="Information: documents, community and system status"
                aria-expanded={dopen}
                className="grid size-10 place-items-center rounded-xl border border-line text-ink-soft transition hover:bg-white/5 hover:text-ink"
              >
                <Info className="size-[18px]" />
              </button>
            )}
          >
            {(close) => (
              <div>
                <p className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Documents</p>
                <DropdownItem
                  icon={BookOpen}
                  onClick={() => {
                    close();
                    navigate("/docs");
                  }}
                >
                  Documents & guides
                </DropdownItem>
                <DropdownItem
                  icon={FileText}
                  onClick={() => {
                    close();
                    window.open(`${API_BASE}/docs`, "_blank", "noopener");
                  }}
                >
                  API reference <ExternalLink className="ml-auto size-3.5 opacity-60" />
                </DropdownItem>
                <div className="my-1 border-t border-line" />
                <p className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Community</p>
                <DropdownItem
                  icon={Users}
                  onClick={() => {
                    close();
                    navigate("/community");
                  }}
                >
                  Community discussions
                </DropdownItem>
                <DropdownItem
                  icon={Mail}
                  onClick={() => {
                    close();
                    navigate("/contact");
                  }}
                >
                  Contact support
                </DropdownItem>
                <DropdownItem
                  icon={Activity}
                  onClick={() => {
                    close();
                    void openStatus();
                  }}
                >
                  System status
                </DropdownItem>
              </div>
            )}
          </Dropdown>

          <Dropdown
            align="end"
            panelClassName="w-[min(22rem,calc(100vw-2rem))]"
            trigger={({ toggle, open: dopen }) => (
              <button
                onClick={toggle}
                aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
                aria-expanded={dopen}
                className="relative grid size-10 place-items-center rounded-xl border border-line text-ink-soft transition hover:bg-white/5 hover:text-ink"
              >
                <Bell className="size-[18px]" />
                {unread > 0 && (
                  <span className="absolute right-2 top-2 grid size-4 place-items-center rounded-full bg-rose text-[9px] font-bold text-white">
                    {unread}
                  </span>
                )}
              </button>
            )}
          >
            {(close) => (
              <div>
                <div className="flex items-center justify-between border-b border-line px-3 pb-2.5 pt-1.5">
                  <p className="text-[13px] font-semibold text-ink">Notifications</p>
                  <div className="flex gap-2">
                    <button
                      onClick={markAllRead}
                      className="text-[11.5px] font-medium text-blue-soft transition hover:underline"
                    >
                      Mark all read
                    </button>
                    <button
                      onClick={clearNotifications}
                      className="text-[11.5px] font-medium text-ink-muted transition hover:text-ink"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto scrollbar-thin">
                  {notifications.length === 0 ? (
                    <p className="px-3 py-6 text-center text-[13px] text-ink-muted">You’re all caught up.</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={cn(
                          "flex gap-3 border-b border-line/60 px-3 py-3 last:border-0",
                          !n.read && "bg-blue/6",
                        )}
                      >
                        <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-ink-muted/40" : "bg-blue-soft")} />
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-ink">{n.title}</p>
                          <p className="mt-0.5 text-[12px] leading-relaxed text-ink-muted">{n.body}</p>
                          <p className="mt-1 text-[11px] text-ink-muted/80">{relativeTime(n.at)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <button
                  onClick={() => {
                    close();
                    pushToast("Notification settings live in Settings", "info");
                  }}
                  className="w-full border-t border-line px-3 py-2.5 text-left text-[12.5px] font-medium text-ink-soft transition hover:bg-white/5"
                >
                  Notification preferences
                </button>
              </div>
            )}
          </Dropdown>

          {isGuest ? (
            <>
              <Button variant="secondary" size="sm" onClick={() => goAuth("/login")}>
                <LogIn className="size-4" /> Sign in
              </Button>
              <Button variant="gradient" size="sm" onClick={() => goAuth("/signup")}>
                <UserPlus className="size-4" /> Sign up
              </Button>
            </>
          ) : (
          <Dropdown
            align="end"
            trigger={({ toggle, open: dopen }) => (
              <button
                onClick={toggle}
                aria-expanded={dopen}
                aria-label={`Account: ${displayName}`}
                className="flex items-center gap-2.5 rounded-xl border border-line py-1.5 pl-1.5 pr-2.5 transition hover:bg-white/5"
              >
                <Avatar size={32} name={displayName} className="shrink-0" />
                <span className="hidden text-sm font-medium text-ink sm:block">{displayName}</span>
                <ChevronDown className={cn("size-4 text-ink-muted transition-transform", dopen && "rotate-180")} />
              </button>
            )}
          >
            {(close) => (
              <div>
                <div className="border-b border-line px-3 py-2.5">
                  <p className="text-[13px] font-semibold text-ink">{displayName}</p>
                  <p className="truncate text-[12px] text-ink-muted">{displayEmail}</p>
                </div>
                <DropdownItem
                  icon={User}
                  onClick={() => {
                    close();
                    navigate("/settings");
                  }}
                >
                  Profile
                </DropdownItem>
                <DropdownItem
                  icon={Settings}
                  onClick={() => {
                    close();
                    navigate("/settings");
                  }}
                >
                  Settings
                </DropdownItem>
                <div className="my-1 border-t border-line" />
                <DropdownItem
                  icon={LogIn}
                  onClick={() => {
                    close();
                    goAuth("/login");
                  }}
                >
                  Sign in as different user
                </DropdownItem>
                <DropdownItem
                  icon={UserPlus}
                  onClick={() => {
                    close();
                    goAuth("/signup");
                  }}
                >
                  Create new account
                </DropdownItem>
                <div className="my-1 border-t border-line" />
                <DropdownItem
                  icon={LogOut}
                  danger
                  onClick={() => {
                    close();
                    logout();
                    navigate("/login");
                    pushToast("Signed out — data stays on this device", "info");
                  }}
                >
                  Sign out
                </DropdownItem>
              </div>
            )}
          </Dropdown>
          )}
        </div>
      </div>

      <Modal
        open={infoDoc === "status"}
        onClose={() => setInfoDoc(null)}
        title="System status"
        description="Live health of the NanoSphere stack."
        footer={
          <>
            <Button variant="ghost" onClick={() => void openStatus()}>Refresh</Button>
            <Button onClick={() => setInfoDoc(null)}>Close</Button>
          </>
        }
      >
        <div className="space-y-2.5">
          <div className="flex items-center justify-between rounded-xl border border-line px-4 py-3">
            <span className="text-[13px] font-medium text-ink">Frontend (this app)</span>
            <span className="flex items-center gap-2 text-[12.5px] text-mint"><span className="size-2 rounded-full bg-mint" /> Operational · v1.0</span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-line px-4 py-3">
            <span className="text-[13px] font-medium text-ink">FastAPI backend</span>
            {health ? (
              <span className="flex items-center gap-2 text-[12.5px] text-mint"><span className="size-2 rounded-full bg-mint" /> {health.status} · {health.db} · {health.ms} ms</span>
            ) : healthError ? (
              <span className="flex items-center gap-2 text-[12.5px] text-rose"><span className="size-2 rounded-full bg-rose" /> Offline</span>
            ) : (
              <span className="text-[12.5px] text-ink-muted">Checking…</span>
            )}
          </div>
          {healthError && <p className="text-[12px] text-ink-muted">{healthError}</p>}
        </div>
      </Modal>
    </header>
  );
}
