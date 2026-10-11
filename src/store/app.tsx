import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  SEED_ACTIVITIES,
  SEED_DATASETS,
  SEED_NOTIFICATIONS,
  SEED_PROJECTS,
  type Activity,
  type ActivityKind,
  type AppNotification,
  type Dataset,
  type Project,
  type ProjectStatus,
  type ProjectTask,
} from "@/data/seeds";
import type { ChartMetricKey } from "@/data/materials";
import { clearAllLS, readLS, removeLS, writeLS } from "@/lib/storage";
import { api, getToken, setToken } from "@/lib/api";
import { uid } from "@/lib/utils";

export type ThemeMode = "dark" | "light" | "system";
export type AccentKey = "blue" | "cyan" | "violet" | "mint" | "gold" | "rose";

export interface Settings {
  name: string;
  email: string;
  role: string;
  density: "comfortable" | "compact";
  defaultMetric: ChartMetricKey;
  emailDigest: boolean;
  theme: ThemeMode;
  accent: AccentKey;
  language: string;
  pushNotifications: boolean;
  simAlerts: boolean;
  datasetAlerts: boolean;
}

export interface AuthUser {
  name: string;
  email: string;
  guest: boolean;
  emailVerified: boolean;
  isAdmin: boolean;
}

interface Account {
  name: string;
  email: string;
  password: string;
}

export interface Toast {
  id: string;
  message: string;
  tone: "default" | "success" | "info";
}

interface AppState {
  user: AuthUser | null;
  backendOnline: boolean;
  isPro: boolean;
  plan: "starter" | "pro" | "team";
  activities: Activity[];
  notifications: AppNotification[];
  datasets: Dataset[];
  projects: Project[];
  saved: string[];
  searchHistory: string[];
  settings: Settings;
  toasts: Toast[];
  login: (email: string, password: string) => Promise<string | null>;
  signup: (input: { name: string; email: string; password: string }) => Promise<string | null>;
  googleSignup: (input: { name: string; email: string; password: string }) => Promise<string | null>;
  continueAsGuest: () => Promise<void>;
  logout: () => void;
  syncFromBackend: () => Promise<void>;
  refreshBilling: () => Promise<void>;
  logActivity: (kind: ActivityKind, title: string, meta?: string) => void;
  markAllRead: () => void;
  clearNotifications: () => void;
  addDataset: (dataset: Dataset) => void;
  setDatasets: (d: Dataset[]) => void;
  removeDataset: (id: string) => void;
  createProject: (input: { name: string; description: string; status: ProjectStatus }) => Promise<Project>;
  updateProject: (id: string, patch: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  toggleTask: (projectId: string, taskId: string) => void;
  addTask: (projectId: string, title: string) => void;
  toggleSaved: (materialId: string) => void;
  pushSearch: (term: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  pushToast: (message: string, tone?: Toast["tone"]) => void;
  dismissToast: (id: string) => void;
  resetWorkspace: () => void;
}

const AppContext = createContext<AppState | null>(null);

const DEFAULT_SETTINGS: Settings = {
  name: "Researcher",
  email: "researcher@nanosphere.io",
  role: "Principal Researcher",
  density: "comfortable",
  defaultMetric: "electrical",
  emailDigest: true,
  theme: "dark",
  accent: "blue",
  language: "en",
  pushNotifications: true,
  simAlerts: true,
  datasetAlerts: true,
};

function isNetworkError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /failed to fetch|networkerror|load failed|fetch/i.test(msg);
}

function toLocalUser(bu: { name: string; email: string; email_verified?: boolean; is_admin?: boolean }): AuthUser {
  const guest = bu.email.includes("nanosphere.local");
  return {
    name: bu.name,
    email: bu.email,
    guest,
    emailVerified: guest ? true : !!bu.email_verified,
    isAdmin: !!bu.is_admin && !guest,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readLS("user", null as AuthUser | null));
  const [accounts, setAccounts] = useState<Account[]>(() => readLS("accounts", [] as Account[]));
  const [activities, setActivities] = useState<Activity[]>(() => readLS("activities", SEED_ACTIVITIES));
  const [notifications, setNotifications] = useState<AppNotification[]>(() => readLS("notifications", SEED_NOTIFICATIONS));
  const [datasets, setDatasets] = useState<Dataset[]>(() => readLS("datasets", SEED_DATASETS));
  const [projects, setProjects] = useState<Project[]>(() => readLS("projects", SEED_PROJECTS));
  const [saved, setSaved] = useState<string[]>(() => readLS("saved", ["graphene"] as string[]));
  const [searchHistory, setSearchHistory] = useState<string[]>(() => readLS("searchHistory", ["Carbon Nanotube"] as string[]));
  const [settings, setSettings] = useState<Settings>(() => ({ ...DEFAULT_SETTINGS, ...readLS("settings", {} as Partial<Settings>) }));
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [backendOnline, setBackendOnline] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [plan, setPlan] = useState<"starter" | "pro" | "team">("starter");

  const refreshBilling = useCallback(async () => {
    if (!getToken()) {
      setIsPro(false);
      setPlan("starter");
      return;
    }
    try {
      const s = await api.billingStatus();
      setIsPro(s.is_pro);
      setPlan(s.plan === "team" ? "team" : s.plan === "pro" ? "pro" : "starter");
    } catch {
      /* guests/offline stay on Starter UI */
    }
  }, []);

  useEffect(() => writeLS("user", user), [user]);
  useEffect(() => writeLS("accounts", accounts), [accounts]);
  useEffect(() => writeLS("activities", activities), [activities]);
  useEffect(() => writeLS("notifications", notifications), [notifications]);
  useEffect(() => writeLS("datasets", datasets), [datasets]);
  useEffect(() => writeLS("projects", projects), [projects]);
  useEffect(() => writeLS("saved", saved), [saved]);
  useEffect(() => writeLS("searchHistory", searchHistory), [searchHistory]);
  useEffect(() => writeLS("settings", settings), [settings]);

  // Apply theme + accent globally (covers login/signup outside AppLayout too).
  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.dataset.accent = settings.accent;
    document.documentElement.style.colorScheme = settings.theme === "light" ? "light" : "dark";
    document.documentElement.lang = settings.language;
  }, [settings.theme, settings.accent, settings.language]);

  const applyBackendSnapshot = useCallback(
    async (bu: { name: string; email: string; role: string; density: string; default_metric: string; email_digest: boolean }) => {
      const [bProjects, bDatasets, bActivities, bNotifs, bSaved, bHistory] = await Promise.all([
        api.projects(),
        api.datasets(),
        api.activities(),
        api.notifications(),
        api.saved(),
        api.searchHistory(),
      ]);
      setProjects(
        bProjects.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          status: p.status as ProjectStatus,
          createdAt: p.createdAt,
          tasks: p.tasks,
        })),
      );
      setDatasets(
        bDatasets.map((d) => ({
          id: d.id,
          name: d.name,
          source: (d.source === "seed" ? "seed" : "upload") as Dataset["source"],
          uploadedAt: d.uploadedAt,
          series: d.series,
        })),
      );
      setActivities(
        bActivities.map((a) => ({ id: a.id, kind: a.kind as ActivityKind, title: a.title, meta: a.meta, at: a.at })),
      );
      setNotifications(
        bNotifs.map((n) => ({ id: n.id, title: n.title, body: n.body, read: n.read, at: n.at })),
      );
      setSaved(bSaved.saved);
      setSearchHistory(bHistory.history);
      setSettings((prev) => ({
        ...prev,
        name: bu.name,
        email: bu.email,
        role: bu.role || prev.role,
        density: (bu.density === "compact" ? "compact" : "comfortable") as Settings["density"],
        defaultMetric: (bu.default_metric as ChartMetricKey) || prev.defaultMetric,
        emailDigest: bu.email_digest,
      }));
      setBackendOnline(true);
    },
    [],
  );

  const syncFromBackend = useCallback(async () => {
    if (!getToken()) return;
    try {
      const me = await api.me();
      setUser(toLocalUser(me));
      await applyBackendSnapshot(me);
      await refreshBilling();
    } catch {
      setBackendOnline(false);
    }
  }, [applyBackendSnapshot, refreshBilling]);

  // Restore backend session on load (token may exist from previous login)
  useEffect(() => {
    if (getToken()) void syncFromBackend();
    else {
      // probe backend availability for science features
      api.health().then(() => setBackendOnline(true)).catch(() => setBackendOnline(false));
    }
  }, [syncFromBackend]);

  const pushToast = useCallback((message: string, tone: Toast["tone"] = "default") => {
    const id = uid("toast");
    setToasts((prev) => [...prev.slice(-2), { id, message, tone }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3600);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const loginLocal = useCallback(
    (email: string, password: string): string | null => {
      const e = email.trim().toLowerCase();
      if (!e || !password) return "Email and password are required.";
      const acct = accounts.find((a) => a.email === e);
      if (!acct) return "No account found for that email. Create one first.";
      if (acct.password !== password) return "Incorrect password. Try again.";
      const u: AuthUser = { name: acct.name, email: acct.email, guest: false, emailVerified: true, isAdmin: false };
      setUser(u);
      setSettings((prev) => ({ ...prev, name: u.name, email: u.email }));
      return null;
    },
    [accounts],
  );

  const login = useCallback(
    async (email: string, password: string): Promise<string | null> => {
      try {
        const res = await api.login(email.trim().toLowerCase(), password);
        setToken(res.access_token);
        const u = toLocalUser(res.user);
        setUser(u);
        setSettings((prev) => ({ ...prev, name: res.user.name, email: res.user.email }));
        await applyBackendSnapshot(res.user);
        await refreshBilling();
        return null;
      } catch (e) {
        if (isNetworkError(e)) {
          setBackendOnline(false);
          return loginLocal(email, password);
        }
        return e instanceof Error ? e.message : "Login failed.";
      }
    },
    [applyBackendSnapshot, loginLocal],
  );

  const signup = useCallback(
    async (input: { name: string; email: string; password: string }): Promise<string | null> => {
      const name = input.name.trim();
      const email = input.email.trim().toLowerCase();
      if (!name) return "Name is required.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address.";
      if (input.password.length < 6) return "Password must be at least 6 characters.";
      try {
        const res = await api.signup(name, email, input.password);
        setToken(res.access_token);
        const u = toLocalUser(res.user);
        setUser(u);
        setSettings((prev) => ({ ...prev, name: res.user.name, email: res.user.email }));
        await applyBackendSnapshot(res.user);
        await refreshBilling();
        return null;
      } catch (e) {
        if (isNetworkError(e)) {
          setBackendOnline(false);
          if (accounts.some((a) => a.email === email)) return "An account with this email already exists — sign in instead.";
          const acct: Account = { name, email, password: input.password };
          setAccounts((prev) => [...prev, acct]);
          const u: AuthUser = { name, email, guest: false, emailVerified: false, isAdmin: false };
          setUser(u);
          setSettings((prev) => ({ ...prev, name: u.name, email: u.email }));
          return null;
        }
        return e instanceof Error ? e.message : "Signup failed.";
      }
    },
    [accounts, applyBackendSnapshot, refreshBilling],
  );

  const googleSignup = useCallback(
    async (input: { name: string; email: string; password: string }): Promise<string | null> => {
      const name = input.name.trim();
      const email = input.email.trim().toLowerCase();
      if (!name) return "Name is required.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address.";
      if (input.password.length < 6) return "Password must be at least 6 characters.";
      try {
        const res = await api.googleSignup(name, email, input.password);
        setToken(res.access_token);
        const u = toLocalUser(res.user);
        setUser(u);
        setSettings((prev) => ({ ...prev, name: res.user.name, email: res.user.email }));
        await applyBackendSnapshot(res.user);
        await refreshBilling();
        return null;
      } catch (e) {
        if (isNetworkError(e)) {
          setBackendOnline(false);
          return "Backend unreachable — connect to create your Google account.";
        }
        return e instanceof Error ? e.message : "Google sign-up failed.";
      }
    },
    [applyBackendSnapshot, refreshBilling],
  );

  const continueAsGuest = useCallback(async () => {    try {
      const res = await api.guest();
      setToken(res.access_token);
      setUser({ name: "Guest", email: res.user.email, guest: true, emailVerified: true, isAdmin: false });
      await applyBackendSnapshot(res.user);
      await refreshBilling();
    } catch {
      setBackendOnline(false);
      const u: AuthUser = { name: "Guest", email: "guest@nanosphere.local", guest: true, emailVerified: true, isAdmin: false };
      setUser(u);
      setSettings((prev) => ({ ...prev, name: u.name, email: u.email }));
    }
  }, [applyBackendSnapshot]);

  const logout = useCallback(() => {
    setToken(null);
    setBackendOnline(false);
    setIsPro(false);
    setPlan("starter");
    setUser(null);
  }, []);

  const logActivity = useCallback((kind: ActivityKind, title: string, meta?: string) => {
    setActivities((prev) => [{ id: uid("act"), kind, title, meta, at: new Date().toISOString() }, ...prev].slice(0, 40));
    if (getToken()) void api.logActivity(kind, title, meta ?? "").catch(() => {});
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (getToken()) void api.readAllNotifications().catch(() => {});
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    if (getToken()) void api.clearNotifications().catch(() => {});
  }, []);

  const addDataset = useCallback((dataset: Dataset) => {
    setDatasets((prev) => [dataset, ...prev]);
    // server upload is handled in Analysis.tsx via api.uploadDataset (needs File)
  }, []);

  const removeDataset = useCallback((id: string) => {
    setDatasets((prev) => prev.filter((d) => d.id !== id));
    if (getToken()) void api.deleteDataset(id).catch(() => {});
  }, []);

  const createProject = useCallback(
    async (input: { name: string; description: string; status: ProjectStatus }) => {
      if (getToken()) {
        try {
          const p = await api.createProject(input);
          const proj: Project = {
            id: p.id,
            name: p.name,
            description: p.description,
            status: p.status as ProjectStatus,
            createdAt: p.createdAt,
            tasks: p.tasks,
          };
          setProjects((prev) => [proj, ...prev]);
          return proj;
        } catch {
          /* fall through to local */
        }
      }
      const project: Project = {
        id: uid("proj"),
        name: input.name,
        description: input.description,
        status: input.status,
        createdAt: new Date().toISOString(),
        tasks: [],
      };
      setProjects((prev) => [project, ...prev]);
      return project;
    },
    [],
  );

  const updateProject = useCallback((id: string, patch: Partial<Project>) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    if (getToken()) {
      const b: Record<string, string> = {};
      if (patch.name !== undefined) b.name = patch.name;
      if (patch.description !== undefined) b.description = patch.description;
      if (patch.status !== undefined) b.status = patch.status;
      void api.updateProject(id, b).catch(() => {});
    }
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (getToken()) void api.deleteProject(id).catch(() => {});
  }, []);

  const toggleTask = useCallback((projectId: string, taskId: string) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, tasks: p.tasks.map((t: ProjectTask) => (t.id === taskId ? { ...t, done: !t.done } : t)) }
          : p,
      ),
    );
    if (getToken()) void api.toggleTask(projectId, taskId).catch(() => {});
  }, []);

  const addTask = useCallback((projectId: string, title: string) => {
    if (getToken()) {
      api.addTask(projectId, title)
        .then((t) => {
          setProjects((prev) =>
            prev.map((p) => (p.id === projectId ? { ...p, tasks: [...p.tasks, t] } : p)),
          );
        })
        .catch(() => {
          setProjects((prev) =>
            prev.map((p) => (p.id === projectId ? { ...p, tasks: [...p.tasks, { id: uid("task"), title, done: false }] } : p)),
          );
        });
      return;
    }
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, tasks: [...p.tasks, { id: uid("task"), title, done: false }] } : p)),
    );
  }, []);

  const toggleSaved = useCallback((materialId: string) => {
    setSaved((prev) => (prev.includes(materialId) ? prev.filter((s) => s !== materialId) : [...prev, materialId]));
    if (getToken()) void api.toggleSaved(materialId).catch(() => {});
  }, []);

  const pushSearch = useCallback((term: string) => {
    const clean = term.trim();
    if (!clean) return;
    setSearchHistory((prev) => [clean, ...prev.filter((s) => s.toLowerCase() !== clean.toLowerCase())].slice(0, 8));
    if (getToken()) void api.pushSearch(clean).catch(() => {});
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
    if (patch.name !== undefined || patch.email !== undefined) {
      setUser((prev) =>
        prev
          ? {
              ...prev,
              name: (patch.name ?? prev.name).trim() || prev.name,
              email: (patch.email ?? prev.email).trim() || prev.email,
            }
          : prev,
      );
    }
    if (getToken()) {
      const b: Record<string, unknown> = {};
      if (patch.name !== undefined) b.name = patch.name;
      if (patch.email !== undefined) b.email = patch.email;
      if (patch.role !== undefined) b.role = patch.role;
      if (patch.density !== undefined) b.density = patch.density;
      if (patch.defaultMetric !== undefined) b.default_metric = patch.defaultMetric;
      if (patch.emailDigest !== undefined) b.email_digest = patch.emailDigest;
      void api.updateSettings(b).catch(() => {});
    }
  }, []);

  const resetWorkspace = useCallback(() => {
    if (getToken()) void api.resetWorkspace().then(() => void syncFromBackend()).catch(() => {});
    clearAllLS();
    setToken(null);
    setActivities(SEED_ACTIVITIES);
    setNotifications(SEED_NOTIFICATIONS);
    setDatasets(SEED_DATASETS);
    setProjects(SEED_PROJECTS);
    setSaved(["graphene"]);
    setSearchHistory(["Carbon Nanotube"]);
    setSettings((prev) => (user ? { ...DEFAULT_SETTINGS, name: user.name, email: user.email } : { ...DEFAULT_SETTINGS, name: prev.name, email: prev.email }));
    writeLS("user", user);
    writeLS("accounts", accounts);
    pushToast("Demo workspace reset to defaults", "info");
  }, [pushToast, user, accounts, syncFromBackend]);

  const value = useMemo<AppState>(
    () => ({
      user,
      backendOnline,
      isPro,
      plan,
      activities,
      notifications,
      datasets,
      projects,
      saved,
      searchHistory,
      settings,
      toasts,
      login,
      signup,
      googleSignup,
      continueAsGuest,
      logout,
      syncFromBackend,
      refreshBilling,
      logActivity,
      markAllRead,
      clearNotifications,
      addDataset,
      setDatasets,
      removeDataset,
      createProject,
      updateProject,
      deleteProject,
      toggleTask,
      addTask,
      toggleSaved,
      pushSearch,
      updateSettings,
      pushToast,
      dismissToast,
      resetWorkspace,
    }),
    [
      user,
      backendOnline,
      isPro,
      plan,
      activities,
      notifications,
      datasets,
      projects,
      saved,
      searchHistory,
      settings,
      toasts,
      login,
      signup,
      googleSignup,
      continueAsGuest,
      logout,
      syncFromBackend,
      refreshBilling,
      logActivity,
      markAllRead,
      clearNotifications,
      addDataset,
      removeDataset,
      createProject,
      updateProject,
      deleteProject,
      toggleTask,
      addTask,
      toggleSaved,
      pushSearch,
      updateSettings,
      pushToast,
      dismissToast,
      resetWorkspace,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}

export { DEFAULT_SETTINGS, removeLS };
