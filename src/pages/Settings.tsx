import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Bell,
  CalendarClock,
  Check,
  Copy,
  Cpu,
  CreditCard,
  Download,
  FileText,
  Gauge,
  Info,
  KeyRound,
  Languages,
  LifeBuoy,
  Lock,
  LogOut,
  Mail,
  Moon,
  Palette,
  Play,
  Plug,
  Plus,
  RefreshCw,
  ScrollText,
  Search,
  ShieldCheck,
  Smartphone,
  Sun,
  Monitor,
  Trash2,
  User,
  Sliders,
  Database,
} from "lucide-react";
import { PageHeader } from "@/components/shell/AppLayout";
import { Card, Button, Field, Input, Select, Modal, Badge, SegmentedControl } from "@/components/ui";
import Pricing from "@/components/ui/pricing";
import { ProCheckoutModal } from "@/components/billing/ProCheckoutModal";
import { useApp, type AccentKey, type ThemeMode } from "@/store/app";
import { downloadJson } from "@/lib/utils";
import { readLS, writeLS } from "@/lib/storage";
import { initialsOf } from "@/art";
import { CHART_METRICS, type ChartMetricKey } from "@/data/materials";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

function Section({ icon: Icon, title, description, children }: { icon: React.ComponentType<{ className?: string }>; title: string; description: string; children: ReactNode }) {
  return (
    <Card>
      <div className="flex items-start gap-3 border-b border-line px-5 py-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-blue/12 text-blue-soft">
          <Icon className="size-4.5" />
        </span>
        <div>
          <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
          <p className="mt-0.5 text-[12px] text-ink-muted">{description}</p>
        </div>
      </div>
      <div className="px-5 py-5">{children}</div>
    </Card>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={checked ? "relative h-6 w-11 shrink-0 rounded-full bg-blue transition-colors" : "relative h-6 w-11 shrink-0 rounded-full bg-white/10 transition-colors"}
    >
      <span className={checked ? "absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform translate-x-5" : "absolute left-0.5 top-0.5 size-5 rounded-full bg-ink-muted shadow transition-transform"} />
    </button>
  );
}

function Row({ title, sub, control }: { title: string; sub?: string; control: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 first:border-0 first:pt-0">
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-ink">{title}</p>
        {sub && <p className="mt-0.5 text-[12px] text-ink-muted">{sub}</p>}
      </div>
      {control}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Static data                                                         */
/* ------------------------------------------------------------------ */

const LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "ne", label: "Nepali", native: "नेपाली" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "es", label: "Spanish", native: "Español" },
  { code: "fr", label: "French", native: "Français" },
  { code: "de", label: "German", native: "Deutsch" },
  { code: "pt", label: "Portuguese", native: "Português" },
  { code: "it", label: "Italian", native: "Italiano" },
  { code: "nl", label: "Dutch", native: "Nederlands" },
  { code: "ru", label: "Russian", native: "Русский" },
  { code: "zh", label: "Chinese (Simplified)", native: "简体中文" },
  { code: "ja", label: "Japanese", native: "日本語" },
  { code: "ko", label: "Korean", native: "한국어" },
  { code: "ar", label: "Arabic", native: "العربية" },
  { code: "tr", label: "Turkish", native: "Türkçe" },
  { code: "vi", label: "Vietnamese", native: "Tiếng Việt" },
  { code: "th", label: "Thai", native: "ไทย" },
  { code: "id", label: "Indonesian", native: "Bahasa Indonesia" },
  { code: "ms", label: "Malay", native: "Bahasa Melayu" },
  { code: "bn", label: "Bengali", native: "বাংলা" },
  { code: "ta", label: "Tamil", native: "தமிழ்" },
  { code: "ur", label: "Urdu", native: "اردو" },
  { code: "fa", label: "Persian", native: "فارسی" },
  { code: "sw", label: "Swahili", native: "Kiswahili" },
];

const ACCENTS: { key: AccentKey; label: string; swatch: string }[] = [
  { key: "blue", label: "Science Blue", swatch: "linear-gradient(135deg,#3b82f6,#6366f1)" },
  { key: "cyan", label: "Lab Cyan", swatch: "linear-gradient(135deg,#06b6d4,#22d3ee)" },
  { key: "violet", label: "Quantum Violet", swatch: "linear-gradient(135deg,#7c3aed,#a855f7)" },
  { key: "mint", label: "Bio Mint", swatch: "linear-gradient(135deg,#059669,#34d399)" },
  { key: "gold", label: "Aurum Gold", swatch: "linear-gradient(135deg,#b45309,#f59e0b)" },
  { key: "rose", label: "Plasma Rose", swatch: "linear-gradient(135deg,#e11d48,#fb7185)" },
];

const CONNECTORS = [
  { id: "github", name: "GitHub", desc: "Sync project files & simulation scripts." },
  { id: "drive", name: "Google Drive", desc: "Import / export datasets as sheets." },
  { id: "dropbox", name: "Dropbox", desc: "Backup workspace snapshots." },
  { id: "slack", name: "Slack", desc: "Post simulation & digest alerts." },
];

type TabId = "profile" | "appearance" | "language" | "email" | "notifications" | "billing" | "capabilities" | "connectors" | "usage" | "schedules" | "privacy" | "security" | "about";

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "language", label: "Language", icon: Languages },
  { id: "email", label: "Email", icon: Mail },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "capabilities", label: "Capabilities", icon: Cpu },
  { id: "connectors", label: "Connectors", icon: Plug },
  { id: "usage", label: "Usage", icon: Gauge },
  { id: "schedules", label: "Schedules", icon: CalendarClock },
  { id: "privacy", label: "Privacy", icon: Lock },
  { id: "security", label: "Security & Login", icon: ShieldCheck },
  { id: "about", label: "About", icon: Info },
];

type AboutDoc = "help" | "terms" | "privacy" | "licenses" | "android" | "security" | "usage" | null;

const ABOUT_DOCS: Record<Exclude<AboutDoc, null>, { title: string; body: string[] }> = {
  help: {
    title: "Help Center",
    body: [
      "Dashboard → Quick-access cards jump into exploring materials, simulations, analysis and projects.",
      "Search (top bar): arrow keys move between suggestions, Enter opens the highlighted result.",
      "Analysis: upload a .csv with a label column + numeric columns, or a JSON array of objects. When the backend is online the file is parsed with pandas and stored in Postgres.",
      "Something empty? Look for the illustrated empty states — they contain the button that creates the first item.",
      "Settings → Privacy → Reset demo data restores the sample workspace at any time.",
    ],
  },
  terms: {
    title: "Terms of Use",
    body: [
      "NanoSphere is a demonstration workspace. Scientific values, indices and simulation curves are illustrative and must not be used for engineering, medical or safety decisions.",
      "You may explore, reorganise and reset the workspace freely. The Pro upgrade flow is a visual mock and processes no payment.",
      "Sample research articles are fictional summaries written for the demo content model.",
    ],
  },
  privacy: {
    title: "Privacy Policy",
    body: [
      "Your workspace (projects, datasets, settings, saved materials) is stored in your FastAPI + Postgres backend account, plus a local browser cache under the nanosphere: prefix for offline use.",
      "Passwords are bcrypt-hashed and sessions use signed JWTs. No analytics are collected in this build.",
      "Deleting your local data (Privacy section) clears this browser only — use Reset workspace to reseed server data, or contact support for full account erasure.",
    ],
  },
  licenses: {
    title: "Licenses",
    body: [
      "NanoSphere demo UI — all rights reserved by the workspace owner.",
      "Open-source libraries: React (MIT), Vite (MIT), TypeScript (Apache-2.0), Tailwind CSS (MIT), Framer Motion (MIT), Recharts (MIT), React Three Fiber (MIT), three.js (MIT), FastAPI (MIT), SQLAlchemy (MIT), NumPy / SciPy / pandas / scikit-learn (BSD).",
      "NanoTech mark: Pinterest reference artwork used as a placeholder brand image (public/nanotech-logo.jpg) — replace with your own logo before publishing.",
    ],
  },
  android: {
    title: "NanoTech for Android",
    body: [
      "Companion app (coming soon): scan a sample QR to import datasets, get simulation-finished push alerts, and browse saved materials offline.",
      "Requires Android 10+. Sign in with the same NanoSphere account — workspaces sync through the FastAPI backend.",
      "Join the waitlist from the Billing → Pro section and we will notify you at release.",
    ],
  },
  security: {
    title: "Security",
    body: [
      "Transport: all API traffic should run over HTTPS in production (TLS 1.2+).",
      "Storage: bcrypt password hashes, 32+ char JWT secret, 24h token expiry by default.",
      "Uploads: 10 MB cap, text decode only, CSV/JSON structural validation before parsing.",
      "Report issues: security@nanosphere.io — please include endpoint, timestamp and a redacted token.",
    ],
  },
  usage: {
    title: "Usage Policy (Fair Use)",
    body: [
      "Starter (free): 5 simulations/day, 10 MB max upload, 20 projects, 50 datasets. Community datasets included.",
      "Pro ($199): unlimited simulations, 500 MB uploads, unlimited projects/datasets, private sharing, priority queue.",
      "Automated / scheduled runs count toward the same daily simulation quota as manual runs.",
      "Abuse (scraping, credential sharing, bypassing quotas) may lead to throttling or suspension after a warning email.",
      "Scientific outputs are illustrative demo models — do not use them for engineering, medical or safety decisions.",
    ],
  },
};

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function SettingsPage() {
  const { settings, user, updateSettings, pushToast, resetWorkspace, projects, datasets, saved, activities, logout, backendOnline, isPro, plan, refreshBilling } = useApp();
  const [checkoutPlan, setCheckoutPlan] = useState<"pro" | "team" | null>(null);

  const cancelPro = async () => {
    try {
      const { api } = await import("@/lib/api");
      await api.cancelPro();
      await refreshBilling();
      pushToast("Pro cancelled — back to Starter", "info");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Cancel failed", "info");
    }
  };
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const validTabs: TabId[] = ["profile", "appearance", "language", "email", "notifications", "billing", "capabilities", "connectors", "usage", "schedules", "privacy", "security", "about"];
  const initialTab = validTabs.includes(params.get("tab") as TabId) ? (params.get("tab") as TabId) : "profile";
  const [tab, setTab] = useState<TabId>(initialTab);

  // Follow ?tab= links even when Settings is already open (e.g. sidebar Go Pro).
  useEffect(() => {
    const t = params.get("tab") as TabId;
    if (t && validTabs.includes(t)) setTab(t);
  }, [params]);

  const [name, setName] = useState(settings.name);
  const [email, setEmail] = useState(settings.email);
  const [role, setRole] = useState(settings.role);
  const [confirmReset, setConfirmReset] = useState(false);
  const [langQuery, setLangQuery] = useState("");
  const [aboutDoc, setAboutDoc] = useState<AboutDoc>(null);
  const [apiToken, setApiToken] = useState<string | null>(() => readLS("apiToken", null as string | null));

  // Capabilities + connectors persist locally (device-level feature flags)
  const [caps, setCaps] = useState<Record<string, boolean>>(() =>
    readLS("capabilities", { viewer3d: true, advancedCharts: true, batchSim: false, apiAccess: false } as Record<string, boolean>),
  );
  const [connected, setConnected] = useState<Record<string, boolean>>(() =>
    readLS("connectors", { github: false, drive: false, dropbox: false, slack: false } as Record<string, boolean>),
  );
  const [twoFa, setTwoFa] = useState(() => readLS("twoFa", false));
  const [analytics, setAnalytics] = useState(() => readLS("analytics", false));
  const [emailVerified, setEmailVerified] = useState(() => readLS("emailVerified", false));
  const [emailFreq, setEmailFreq] = useState(() => readLS("emailFreq", "weekly" as string));
  const [productEmails, setProductEmails] = useState(() => readLS("productEmails", true));

  interface Schedule {
    id: string;
    name: string;
    kind: "simulation" | "digest" | "export" | "backup";
    frequency: "daily" | "weekly" | "monthly";
    time: string;
    enabled: boolean;
  }

  const [schedules, setSchedules] = useState<Schedule[]>(() =>
    readLS("schedules", [
      { id: "sch1", name: "Weekly digest", kind: "digest", frequency: "weekly", time: "08:00", enabled: true },
      { id: "sch2", name: "Nightly backup", kind: "backup", frequency: "daily", time: "02:00", enabled: false },
    ] as Schedule[]),
  );
  const [schOpen, setSchOpen] = useState(false);
  const [schName, setSchName] = useState("");
  const [schKind, setSchKind] = useState<Schedule["kind"]>("simulation");
  const [schFreq, setSchFreq] = useState<Schedule["frequency"]>("weekly");
  const [schTime, setSchTime] = useState("08:00");

  const persistSchedules = (next: Schedule[]) => {
    setSchedules(next);
    writeLS("schedules", next);
  };

  const [curPwd, setCurPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");

  const persistCaps = (next: Record<string, boolean>) => {
    setCaps(next);
    writeLS("capabilities", next);
  };
  const persistConnected = (next: Record<string, boolean>) => {
    setConnected(next);
    writeLS("connectors", next);
  };

  const filteredLangs = useMemo(() => {
    const q = langQuery.trim().toLowerCase();
    if (!q) return LANGUAGES;
    return LANGUAGES.filter((l) => l.label.toLowerCase().includes(q) || l.native.toLowerCase().includes(q) || l.code.includes(q));
  }, [langQuery]);

  const doLogout = () => {
    logout();
    pushToast("Signed out — see you soon", "info");
    navigate("/login");
  };

  return (
    <div className="mx-auto max-w-[1100px]">
      <PageHeader
        title="Settings"
        subtitle={backendOnline ? "Synced with the FastAPI backend when online — theme, accent and language stay on this device." : "Profile, appearance, language, billing, privacy and about. Nothing here leaves your browser while offline."}
        actions={
          <Button variant="secondary" onClick={doLogout}>
            <LogOut className="size-4" /> Log out
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
        {/* Tab nav */}
        <nav aria-label="Settings sections" className="flex gap-2 overflow-x-auto lg:sticky lg:top-20 lg:flex-col lg:self-start">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex shrink-0 items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-[13px] font-medium transition-colors",
                tab === id ? "border-blue/45 bg-blue/10 text-ink" : "border-line bg-panel/50 text-ink-soft hover:text-ink",
              )}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </nav>

        <div className="min-w-0 space-y-5">
          {tab === "profile" && (
            <Section icon={User} title="Profile" description="Used for the welcome message, avatar and workspace identity.">
              <div className="mb-5 flex items-center gap-4">
                <span className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-blue to-violet text-lg font-bold text-white">
                  {initialsOf(settings.name)}
                </span>
                <div>
                  <p className="text-[15px] font-semibold text-ink">{settings.name}</p>
                  <p className="text-[12.5px] text-ink-muted">{settings.email} · {user?.guest ? "Guest session" : settings.role}</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Display name">
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </Field>
                <Field label="Email">
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </Field>
                <Field label="Role">
                  <Input value={role} onChange={(e) => setRole(e.target.value)} />
                </Field>
              </div>
              <Button
                variant="gradient"
                className="mt-4"
                onClick={() => {
                  updateSettings({ name: name.trim() || "Researcher", email: email.trim(), role: role.trim() });
                  pushToast("Profile saved", "success");
                }}
              >
                Save changes
              </Button>
            </Section>
          )}

          {tab === "appearance" && (
            <>
              <Section icon={Palette} title="Color mode" description="Dark, light, or follow your system (Normal).">
                <SegmentedControl
                  options={[
                    { value: "dark", label: "Dark" },
                    { value: "light", label: "Light" },
                    { value: "system", label: "Normal (System)" },
                  ]}
                  value={settings.theme}
                  onChange={(v) => {
                    updateSettings({ theme: v as ThemeMode });
                    pushToast(v === "system" ? "Following system appearance" : `Switched to ${v} mode`, "success");
                  }}
                />
                <div className="mt-4 flex items-center gap-2 text-[12px] text-ink-muted">
                  <Moon className="size-4" /> <Sun className="size-4" /> <Monitor className="size-4" />
                  <span>Preview applies instantly across dashboard, sidebar and login.</span>
                </div>
              </Section>

              <Section icon={Palette} title="Accent color" description="Recolors buttons, highlights and active states.">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {ACCENTS.map((a) => (
                    <button
                      key={a.key}
                      onClick={() => {
                        updateSettings({ accent: a.key });
                        pushToast(`${a.label} accent applied`, "success");
                      }}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors",
                        settings.accent === a.key ? "border-blue/50 bg-blue/10" : "border-line bg-panel/50 hover:border-blue-soft/30",
                      )}
                    >
                      <span className="size-8 shrink-0 rounded-full" style={{ background: a.swatch }} />
                      <span className="flex min-w-0 items-center gap-1.5 text-[13px] font-medium text-ink">
                        <span className="truncate">{a.label}</span>
                        {settings.accent === a.key && <Check className="size-4 shrink-0 text-blue-soft" />}
                      </span>
                    </button>
                  ))}
                </div>
              </Section>

              <Section icon={Sliders} title="Preferences" description="Tune how the workspace behaves.">
                <div className="space-y-4">
                  <Row
                    title="Interface density"
                    sub="Compact tightens page padding across all routes."
                    control={
                      <SegmentedControl
                        options={[
                          { value: "comfortable", label: "Comfortable" },
                          { value: "compact", label: "Compact" },
                        ]}
                        value={settings.density}
                        onChange={(v) => updateSettings({ density: v })}
                      />
                    }
                  />
                  <Row
                    title="Default comparison metric"
                    sub="Preselects a metric on the dashboard chart."
                    control={
                      <Select
                        value={settings.defaultMetric}
                        onChange={(e) => updateSettings({ defaultMetric: e.target.value as ChartMetricKey })}
                        className="w-56"
                        aria-label="Default chart metric"
                      >
                        {CHART_METRICS.map((m) => (
                          <option key={m.key} value={m.key}>
                            {m.label}
                          </option>
                        ))}
                      </Select>
                    }
                  />
                </div>
              </Section>
            </>
          )}

          {tab === "language" && (
            <Section icon={Languages} title="Language" description={`${LANGUAGES.length} languages — applies to shell labels on this device.`}>
              <div className="relative mb-4">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
                <Input value={langQuery} onChange={(e) => setLangQuery(e.target.value)} placeholder="Search languages…" className="pl-10" aria-label="Search languages" />
              </div>
              <ul className="max-h-96 space-y-1.5 overflow-y-auto scrollbar-thin pr-1">
                {filteredLangs.map((l) => (
                  <li key={l.code}>
                    <button
                      onClick={() => {
                        updateSettings({ language: l.code });
                        pushToast(`Language set to ${l.label}`, "success");
                      }}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-colors",
                        settings.language === l.code ? "border-blue/45 bg-blue/10" : "border-line bg-panel/50 hover:border-blue-soft/30",
                      )}
                    >
                      <span>
                        <span className="block text-[13.5px] font-medium text-ink">{l.label}</span>
                        <span className="block text-[12px] text-ink-muted">{l.native} · {l.code}</span>
                      </span>
                      {settings.language === l.code && <Check className="size-4 shrink-0 text-blue-soft" />}
                    </button>
                  </li>
                ))}
                {filteredLangs.length === 0 && <p className="py-6 text-center text-[13px] text-ink-muted">No languages match “{langQuery}”.</p>}
              </ul>
            </Section>
          )}

          {tab === "notifications" && (
            <Section icon={Bell} title="Notifications" description="Choose which alerts reach you.">
              <div className="space-y-4">
                <Row title="Push notifications" sub="Simulation-finished and mention alerts on this device." control={<Toggle checked={settings.pushNotifications} onChange={(v) => updateSettings({ pushNotifications: v })} label="Push notifications" />} />
                <Row title="Simulation finished" sub="Notify when a simulation run completes." control={<Toggle checked={settings.simAlerts} onChange={(v) => updateSettings({ simAlerts: v })} label="Simulation finished alerts" />} />
                <Row title="Dataset processed" sub="Notify when an upload finishes parsing." control={<Toggle checked={settings.datasetAlerts} onChange={(v) => updateSettings({ datasetAlerts: v })} label="Dataset processed alerts" />} />
                <Row title="Weekly research digest" sub="Demo preference — no email is ever sent." control={<Toggle checked={settings.emailDigest} onChange={(v) => updateSettings({ emailDigest: v })} label="Weekly research digest" />} />
              </div>
            </Section>
          )}

          {tab === "email" && (
            <>
              <Section icon={Mail} title="Email address" description="Where digests, security alerts and receipts go.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Email">
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </Field>
                  <Field label="Status">
                    <div className="flex h-11 items-center">
                      {emailVerified ? <Badge tone="blue">Verified</Badge> : <Badge tone="neutral">Unverified</Badge>}
                    </div>
                  </Field>
                </div>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  <Button
                    variant="gradient"
                    onClick={() => {
                      updateSettings({ email: email.trim() });
                      pushToast("Email saved", "success");
                    }}
                  >
                    Save email
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setEmailVerified(true);
                      writeLS("emailVerified", true);
                      pushToast("Verification email sent — address marked verified (demo)", "success");
                    }}
                  >
                    Send verification email
                  </Button>
                </div>
              </Section>
              <Section icon={Mail} title="Email preferences" description="Frequency and categories for mailbox delivery.">
                <div className="space-y-4">
                  <Row
                    title="Digest frequency"
                    sub="How often the research digest lands in your inbox."
                    control={
                      <Select
                        value={emailFreq}
                        onChange={(e) => {
                          setEmailFreq(e.target.value);
                          writeLS("emailFreq", e.target.value);
                          updateSettings({ emailDigest: e.target.value !== "off" });
                        }}
                        className="w-48"
                        aria-label="Digest frequency"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="off">Off</option>
                      </Select>
                    }
                  />
                  <Row title="Research digest" sub="New papers matching your interests." control={<Toggle checked={settings.emailDigest} onChange={(v) => updateSettings({ emailDigest: v })} label="Research digest emails" />} />
                  <Row title="Product updates" sub="New features, Android app launch, changelog." control={<Toggle checked={productEmails} onChange={(v) => { setProductEmails(v); writeLS("productEmails", v); }} label="Product update emails" />} />
                  <Row title="Security alerts" sub="Logins, password changes, API token events. Always on." control={<Toggle checked={true} onChange={() => pushToast("Security alerts cannot be disabled", "info")} label="Security alert emails" />} />
                </div>
              </Section>
            </>
          )}

          {tab === "billing" && (
            <>
              <Section icon={CreditCard} title="Billing" description={isPro ? "Pro is active — unlocked by payment on this account." : "Starter plan — Pro unlocks only after payment."}>
                <Pricing
                  title={false}
                  description={false}
                  plans={[
                    {
                      name: "Starter",
                      description: "For everyone starting out with nanomaterials",
                      price: 0,
                      priceNote: "Free forever. 5 simulations/day.",
                      cta: isPro
                        ? { variant: "default", label: "Downgrade to Starter", onClick: () => void cancelPro() }
                        : { variant: "default", label: "Current plan", onClick: () => pushToast("You're on Starter", "info") },
                      features: ["5 simulations / day", "Community datasets", "6 lab calculators", "4 free courses (limited offer)"],
                      variant: "default",
                    },
                    {
                      name: "Pro",
                      description: "For researchers running serious simulation workloads",
                      price: 199,
                      priceNote: "One-time payment. Unlocks only after payment.",
                      cta: plan === "pro"
                        ? { variant: "glow-brand", label: "Current plan", onClick: () => pushToast("Pro is active", "success") }
                        : plan === "team"
                          ? { variant: "glow-brand", label: "Included in Team", onClick: () => pushToast("Your Team plan already includes Pro", "info") }
                          : { variant: "glow-brand", label: "Buy Pro — $199", onClick: () => setCheckoutPlan("pro") },
                      features: ["Unlimited simulations", "5000-iteration deep runs", "Private datasets & sharing", "Advanced property models"],
                      variant: "glow-brand",
                    },
                    {
                      name: "Pro Team",
                      description: "For labs and pilot lines working together",
                      price: 999,
                      priceNote: "One-time payment. 5 seats included.",
                      cta: plan === "team"
                        ? { variant: "glow", label: "Current plan", onClick: () => pushToast("Team is active", "success") }
                        : { variant: "glow", label: "Buy Team — $999", onClick: () => setCheckoutPlan("team") },
                      features: ["Everything in Pro, for your entire team", "Shared workspace & roles", "Priority support"],
                      variant: "glow",
                    },
                  ]}
                />
                {isPro && (
                  <div className="mt-3 text-center">
                    <button onClick={() => void cancelPro()} className="text-[12.5px] text-ink-muted underline-offset-4 transition hover:text-rose hover:underline">
                      Cancel {plan === "team" ? "Team" : "Pro"} subscription
                    </button>
                  </div>
                )}
              </Section>
              <Section icon={FileText} title="Billing history" description="Receipts for this account.">
                <ul className="space-y-2 text-[13px] text-ink-muted">
                  <li className="flex justify-between rounded-xl border border-line px-4 py-3"><span>Starter plan — workspace created</span><span className="text-ink-soft">$0.00</span></li>
                  {plan === "pro"
                    ? <li className="flex justify-between rounded-xl border border-line px-4 py-3"><span>Pro — active</span><span className="text-ink-soft">$199.00</span></li>
                    : plan === "team"
                      ? <li className="flex justify-between rounded-xl border border-line px-4 py-3"><span>Pro Team — active</span><span className="text-ink-soft">$999.00</span></li>
                      : <li className="flex justify-between rounded-xl border border-line px-4 py-3"><span>No charges yet</span><span className="text-ink-soft">—</span></li>}
                </ul>
              </Section>
              <ProCheckoutModal open={checkoutPlan !== null} onClose={() => setCheckoutPlan(null)} planKind={checkoutPlan ?? "pro"} />
            </>
          )}

          {tab === "capabilities" && (
            <Section icon={Cpu} title="Capabilities" description="Device-level feature flags for heavy modules.">
              <div className="space-y-4">
                {[
                  { key: "viewer3d", title: "3D molecule viewer", sub: "React Three Fiber canvas on material pages." },
                  { key: "advancedCharts", title: "Advanced charts", sub: "Comparison overlays and log scales." },
                  { key: "batchSim", title: "Batch simulations", sub: "Queue up to 10 runs (Pro)." },
                  { key: "apiAccess", title: "API access", sub: "Personal token for the FastAPI backend." },
                ].map((c) => (
                  <Row
                    key={c.key}
                    title={c.title}
                    sub={c.sub}
                    control={
                      <Toggle
                        checked={!!caps[c.key]}
                        label={c.title}
                        onChange={(v) => {
                          const next = { ...caps, [c.key]: v };
                          persistCaps(next);
                          pushToast(`${c.title} ${v ? "enabled" : "disabled"}`, "info");
                        }}
                      />
                    }
                  />
                ))}
              </div>
            </Section>
          )}

          {tab === "connectors" && (
            <Section icon={Plug} title="Connectors" description="Third-party integrations for import, backup and alerts.">
              <div className="space-y-3">
                {CONNECTORS.map((c) => (
                  <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line px-4 py-3.5">
                    <div>
                      <p className="text-[13.5px] font-semibold text-ink">{c.name}</p>
                      <p className="text-[12px] text-ink-muted">{c.desc}</p>
                    </div>
                    <Button
                      variant={connected[c.id] ? "secondary" : "gradient"}
                      size="sm"
                      onClick={() => {
                        const next = { ...connected, [c.id]: !connected[c.id] };
                        persistConnected(next);
                        pushToast(`${c.name} ${next[c.id] ? "connected" : "disconnected"}`, next[c.id] ? "success" : "info");
                      }}
                    >
                      {connected[c.id] ? "Disconnect" : "Connect"}
                    </Button>
                  </div>
                ))}
                <div className="rounded-xl border border-line px-4 py-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[13.5px] font-semibold text-ink">API token</p>
                      <p className="font-mono text-[12px] text-ink-muted">{apiToken ?? "No token generated yet"}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          const t = `nsk_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
                          setApiToken(t);
                          writeLS("apiToken", t);
                          pushToast("API token generated", "success");
                        }}
                      >
                        <KeyRound className="size-3.5" /> Generate
                      </Button>
                      {apiToken && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(apiToken);
                              pushToast("Token copied", "success");
                            } catch {
                              pushToast("Copy blocked by browser", "info");
                            }
                          }}
                        >
                          <Copy className="size-3.5" /> Copy
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Section>
          )}

          {tab === "usage" && (
            <>
              <Section icon={Gauge} title="Current usage" description="Starter plan quotas — resets daily.">
                {(() => {
                  const today = new Date().toDateString();
                  const simsToday = activities.filter((a) => a.kind === "simulation" && new Date(a.at).toDateString() === today).length;
                  const simLimit = 5;
                  const dsLimit = 50;
                  const projLimit = 20;
                  const meter = (used: number, limit: number) => (
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-blue transition-all" style={{ width: `${Math.min(100, (used / limit) * 100)}%` }} />
                    </div>
                  );
                  return (
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-[13px]"><span className="font-medium text-ink">Simulations today</span><span className="tabular-nums text-ink-muted">{simsToday} / {simLimit}</span></div>
                        {meter(simsToday, simLimit)}
                      </div>
                      <div>
                        <div className="flex justify-between text-[13px]"><span className="font-medium text-ink">Datasets</span><span className="tabular-nums text-ink-muted">{datasets.length} / {dsLimit}</span></div>
                        {meter(datasets.length, dsLimit)}
                      </div>
                      <div>
                        <div className="flex justify-between text-[13px]"><span className="font-medium text-ink">Projects</span><span className="tabular-nums text-ink-muted">{projects.length} / {projLimit}</span></div>
                        {meter(projects.length, projLimit)}
                      </div>
                    </div>
                  );
                })()}
                <p className="mt-4 text-[12px] text-ink-muted">Need more? Billing → Upgrade to Pro for unlimited simulations.</p>
              </Section>
              <Section icon={ScrollText} title="Usage policy" description="Fair-use limits for the shared demo backend.">
                <ul className="space-y-1.5 text-[13px] text-ink-muted">
                  <li>· Starter: 5 simulations/day · 10 MB uploads · 20 projects · 50 datasets</li>
                  <li>· Pro: unlimited simulations · 500 MB uploads · unlimited projects</li>
                  <li>· Scheduled runs count toward the same daily quota</li>
                </ul>
                <Button variant="secondary" className="mt-4" onClick={() => setAboutDoc("usage")}>
                  Read full usage policy
                </Button>
              </Section>
            </>
          )}

          {tab === "schedules" && (
            <Section icon={CalendarClock} title="Scheduled setups" description="Automate digests, backups, exports and simulation batches. Stored on this device.">
              <div className="mb-4 flex justify-end">
                <Button variant="gradient" size="sm" onClick={() => { setSchName(""); setSchOpen(true); }}>
                  <Plus className="size-4" /> New schedule
                </Button>
              </div>
              {schedules.length === 0 ? (
                <p className="rounded-xl border border-line px-4 py-6 text-center text-[13px] text-ink-muted">No schedules yet — create one to automate digests or backups.</p>
              ) : (
                <ul className="space-y-2.5">
                  {schedules.map((s) => (
                    <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line px-4 py-3">
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 text-[13.5px] font-medium text-ink">
                          {s.name}
                          <Badge tone={s.enabled ? "blue" : "neutral"}>{s.enabled ? "On" : "Off"}</Badge>
                        </p>
                        <p className="mt-0.5 text-[12px] capitalize text-ink-muted">{s.kind} · {s.frequency} · {s.time}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => pushToast(`“${s.name}” ran now (demo)`, "success")} aria-label={`Run ${s.name} now`}>
                          <Play className="size-3.5" /> Run
                        </Button>
                        <Toggle checked={s.enabled} label={`Enable ${s.name}`} onChange={(v) => persistSchedules(schedules.map((x) => (x.id === s.id ? { ...x, enabled: v } : x)))} />
                        <button
                          onClick={() => {
                            persistSchedules(schedules.filter((x) => x.id !== s.id));
                            pushToast(`Deleted “${s.name}”`, "info");
                          }}
                          aria-label={`Delete ${s.name}`}
                          className="grid size-8 place-items-center rounded-lg text-ink-muted transition hover:bg-rose/12 hover:text-rose"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          )}

          {tab === "privacy" && (
            <>
              <Section icon={Lock} title="Privacy" description="Control what stays on this device.">
                <div className="space-y-4">
                  <Row title="Anonymous usage analytics" sub="Off in this build — toggle is a placeholder." control={<Toggle checked={analytics} onChange={(v) => { setAnalytics(v); writeLS("analytics", v); }} label="Anonymous usage analytics" />} />
                  <Row title="Export workspace" sub="Download projects, datasets and settings as JSON." control={<Button variant="secondary" size="sm" onClick={() => { downloadJson("nanosphere-workspace.json", { exportedAt: new Date().toISOString(), settings, projects, datasets, saved, activities }); pushToast("Workspace exported as JSON", "success"); }}><Download className="size-4" /> Export</Button>} />
                </div>
              </Section>
              <Section icon={Database} title="Local data" description={`${projects.length} projects · ${datasets.length} datasets · ${saved.length} saved materials · ${activities.length} activities`}>
                <div className="flex flex-wrap gap-3">
                  <Button variant="danger" onClick={() => setConfirmReset(true)}>
                    <RefreshCw className="size-4" /> Reset demo data
                  </Button>
                </div>
                <p className="mt-4 text-[12px] leading-relaxed text-ink-muted">
                  Cache lives under the <span className="font-mono text-ink-soft">nanosphere:</span> prefix in this browser. Server data reseeds via the FastAPI <span className="font-mono text-ink-soft">/workspace/reset</span> endpoint when online.
                </p>
              </Section>
            </>
          )}

          {tab === "security" && (
            <>
              <Section icon={ShieldCheck} title="Security & Login" description="Password, sessions and two-factor sign-in.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Current password">
                    <Input type="password" value={curPwd} onChange={(e) => setCurPwd(e.target.value)} autoComplete="current-password" />
                  </Field>
                  <Field label="New password (min 6 chars)">
                    <Input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} autoComplete="new-password" />
                  </Field>
                </div>
                <Button
                  variant="gradient"
                  className="mt-4"
                  onClick={() => {
                    if (newPwd.length < 6) return pushToast("New password must be at least 6 characters", "info");
                    pushToast("Password updated on this device — use it next sign-in", "success");
                    setCurPwd("");
                    setNewPwd("");
                  }}
                >
                  Update password
                </Button>
                <div className="mt-5 space-y-4">
                  <Row title="Two-factor authentication" sub="Mock toggle — codes via authenticator app (coming soon)." control={<Toggle checked={twoFa} onChange={(v) => { setTwoFa(v); writeLS("twoFa", v); pushToast(`2FA ${v ? "enabled" : "disabled"}`, "info"); }} label="Two-factor authentication" />} />
                  <Row title="Sign out everywhere" sub="Clears the JWT on this device and returns to login." control={<Button variant="secondary" size="sm" onClick={doLogout}><LogOut className="size-4" /> Log out</Button>} />
                </div>
              </Section>
              <Section icon={Monitor} title="Active sessions" description="Devices signed into this account.">
                <ul className="space-y-2 text-[13px]">
                  <li className="flex items-center justify-between rounded-xl border border-line px-4 py-3">
                    <span><span className="block font-medium text-ink">This browser — Windows</span><span className="text-[12px] text-ink-muted">Current session · {backendOnline ? "JWT via FastAPI" : "local session"}</span></span>
                    <Badge tone="blue">Active</Badge>
                  </li>
                </ul>
              </Section>
            </>
          )}

          {tab === "about" && (
            <Section icon={Info} title="About" description="Build info, legal docs and the Android companion.">
              <div className="mb-4 space-y-2 text-[13px] text-ink-muted">
                <p><Badge tone="blue" className="mr-2">NanoSphere</Badge>Version 1.0 · FastAPI + Postgres build</p>
                <p>React, Vite, TypeScript, Tailwind, Framer Motion, Recharts, React Three Fiber. Scientific values are sample data.</p>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {[
                  { id: "help" as const, icon: LifeBuoy, label: "Help Center", sub: "Guides & FAQ" },
                  { id: "terms" as const, icon: ScrollText, label: "Terms of Use", sub: "Demo terms" },
                  { id: "privacy" as const, icon: Lock, label: "Privacy Policy", sub: "Data & storage" },
                  { id: "licenses" as const, icon: FileText, label: "Licenses", sub: "Open-source notices" },
                  { id: "android" as const, icon: Smartphone, label: "NanoTech for Android", sub: "Companion app" },
                  { id: "security" as const, icon: ShieldCheck, label: "Security", sub: "Practices & contact" },
                  { id: "usage" as const, icon: Gauge, label: "Usage Policy", sub: "Fair-use limits" },
                ].map(({ id, icon: Icon, label, sub }) => (
                  <button
                    key={id}
                    onClick={() => setAboutDoc(id)}
                    className="flex items-center gap-3 rounded-xl border border-line bg-panel/50 px-4 py-3.5 text-left transition-colors hover:border-blue-soft/30"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-blue/12 text-blue-soft"><Icon className="size-4" /></span>
                    <span><span className="block text-[13.5px] font-medium text-ink">{label}</span><span className="block text-[12px] text-ink-muted">{sub}</span></span>
                  </button>
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="Reset demo workspace?" size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => { resetWorkspace(); setConfirmReset(false); setName(user?.name ?? "Researcher"); setEmail(user?.email ?? "researcher@nanosphere.io"); setRole("Principal Researcher"); }}>
              Reset everything
            </Button>
          </>
        }
      >
        <p className="text-[13.5px] leading-relaxed text-ink-soft">
          All projects, datasets, saved materials, search history and settings stored in this browser will be replaced with the original sample workspace.
        </p>
      </Modal>

      <Modal open={aboutDoc !== null} onClose={() => setAboutDoc(null)} title={aboutDoc ? ABOUT_DOCS[aboutDoc].title : ""}
        footer={<Button onClick={() => setAboutDoc(null)}>Got it</Button>}
      >
        <div className="space-y-3">
          {(aboutDoc ? ABOUT_DOCS[aboutDoc].body : []).map((p, i) => (
            <p key={i} className="text-[13.5px] leading-relaxed text-ink-soft">{p}</p>
          ))}
        </div>
      </Modal>

      <Modal open={schOpen} onClose={() => setSchOpen(false)} title="New schedule" size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setSchOpen(false)}>Cancel</Button>
            <Button
              variant="gradient"
              disabled={!schName.trim()}
              onClick={() => {
                const s = { id: `sch_${Date.now().toString(36)}`, name: schName.trim(), kind: schKind, frequency: schFreq, time: schTime, enabled: true };
                persistSchedules([...schedules, s]);
                setSchOpen(false);
                pushToast(`Schedule “${s.name}” created`, "success");
              }}
            >
              Create schedule
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Name">
            <Input value={schName} onChange={(e) => setSchName(e.target.value)} placeholder="e.g. Morning simulation batch" />
          </Field>
          <Field label="Task">
            <Select value={schKind} onChange={(e) => setSchKind(e.target.value as typeof schKind)}>
              <option value="simulation">Simulation batch</option>
              <option value="digest">Research digest email</option>
              <option value="export">Workspace export</option>
              <option value="backup">Backup snapshot</option>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Frequency">
              <Select value={schFreq} onChange={(e) => setSchFreq(e.target.value as typeof schFreq)}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </Select>
            </Field>
            <Field label="Time">
              <Input type="time" value={schTime} onChange={(e) => setSchTime(e.target.value)} />
            </Field>
          </div>
          <p className="text-[12px] text-ink-muted">Runs count toward the daily simulation quota (see Usage policy).</p>
        </div>
      </Modal>
    </div>
  );
}
