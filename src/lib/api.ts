/* NanoSphere backend API client. Falls back to localStorage when backend offline. */

export const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://127.0.0.1:8000";

const TOKEN_KEY = "nanosphere:token";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      ...(opts.body && !(opts.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const data = await res.json();
      detail = (data as { detail?: string }).detail || detail;
    } catch {
      /* keep default */
    }
    throw new Error(detail);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  health: () => fetch(`${API_BASE}/health`).then((r) => r.json()),
  signup: (name: string, email: string, password: string) =>
    req<{ access_token: string; user: AuthUser }>(`/auth/signup`, {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),
  googleSignup: (name: string, email: string, password: string, phone = "") =>
    req<{ access_token: string; user: AuthUser }>(`/auth/google`, {
      method: "POST",
      body: JSON.stringify({ name, email, password, phone }),
    }),
  login: (email: string, password: string) =>
    req<{ access_token: string; user: AuthUser }>(`/auth/login`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  guest: () => req<{ access_token: string; user: AuthUser }>(`/auth/guest`, { method: "POST" }),
  me: () => req<AuthUser>(`/auth/me`),

  projects: () => req<BackendProject[]>(`/projects`),
  createProject: (b: { name: string; description: string; status: string }) =>
    req<BackendProject>(`/projects`, { method: "POST", body: JSON.stringify(b) }),
  updateProject: (id: string, b: Partial<{ name: string; description: string; status: string }>) =>
    req<BackendProject>(`/projects/${id}`, { method: "PATCH", body: JSON.stringify(b) }),
  deleteProject: (id: string) => req<void>(`/projects/${id}`, { method: "DELETE" }),
  addTask: (pid: string, title: string) =>
    req<{ id: string; title: string; done: boolean }>(`/projects/${pid}/tasks`, {
      method: "POST",
      body: JSON.stringify({ title }),
    }),
  toggleTask: (pid: string, tid: string) =>
    req<{ id: string; title: string; done: boolean }>(`/projects/${pid}/tasks/${tid}`, { method: "PATCH" }),

  datasets: () => req<BackendDataset[]>(`/datasets`),
  uploadDataset: async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return req<BackendDataset>(`/datasets/upload`, { method: "POST", body: fd });
  },
  deleteDataset: (id: string) => req<void>(`/datasets/${id}`, { method: "DELETE" }),

  activities: () => req<BackendActivity[]>(`/workspace/activities`),
  logActivity: (kind: string, title: string, meta = "") =>
    req<void>(`/workspace/activities/log`, { method: "POST", body: JSON.stringify({ kind, title, meta }) }),
  notifications: () => req<BackendNotification[]>(`/workspace/notifications`),
  readAllNotifications: () => req<void>(`/workspace/notifications/read-all`, { method: "POST" }),
  clearNotifications: () => req<void>(`/workspace/notifications`, { method: "DELETE" }),
  saved: () => req<{ saved: string[] }>(`/workspace/saved`),
  toggleSaved: (mid: string) => req<{ saved: boolean }>(`/workspace/saved/${mid}`, { method: "POST" }),
  searchHistory: () => req<{ history: string[] }>(`/workspace/search-history`),
  pushSearch: (term: string) =>
    req<void>(`/workspace/search-history`, { method: "POST", body: JSON.stringify({ term }) }),
  updateSettings: (b: Record<string, unknown>) =>
    req<AuthUser>(`/workspace/settings`, { method: "PATCH", body: JSON.stringify(b) }),
  resetWorkspace: () => req<void>(`/workspace/reset`, { method: "POST" }),

  simulate: (b: { materialId: string; electricalIndex: number; model: string; temperatureK: number; sizeNm: number; iterations: number }) =>
    req<Record<string, unknown>>(`/science/simulate`, { method: "POST", body: JSON.stringify(b) }),
  labCalc: (b: Record<string, unknown>) =>
    req<{ result: number; unit: string }>(`/science/lab-calc`, { method: "POST", body: JSON.stringify(b) }),

  learnCourses: () => req<{ courses: CourseMeta[] }>(`/learn/courses`),
  learnEnrollments: () =>
    req<{ enrollments: { course_id: string; name: string; email: string; at: string }[] }>(`/learn/enrollments`),
  learnEnroll: (course_id: string, name: string, email: string) =>
    req<{ course_id: string; name: string; email: string; at: string }>(`/learn/enroll`, {
      method: "POST",
      body: JSON.stringify({ course_id, name, email }),
    }),
  learnCheckout: (course_id: string, card_last4: string) =>
    req<{ course_id: string; amount_cents: number; at: string }>(`/learn/checkout`, {
      method: "POST",
      body: JSON.stringify({ course_id, card_last4 }),
    }),
  learnProgress: (course_id: string) =>
    req<{ progress: { lesson_id: string; done: boolean; best_score: number; at: string }[] }>(
      `/learn/progress/${course_id}`,
    ),
  learnSaveProgress: (course_id: string, lesson_id: string, done: boolean, score: number) =>
    req<{ lesson_id: string; done: boolean; best_score: number }>(`/learn/progress`, {
      method: "POST",
      body: JSON.stringify({ course_id, lesson_id, done, score }),
    }),

  billingStatus: () =>
    req<{ plan: string; is_pro: boolean; pro_since: string; pro_price_cents: number; team_price_cents: number }>(`/billing/status`),
  checkoutPro: (card_last4: string) =>
    req<{ plan: string; is_pro: boolean; pro_since: string }>(`/billing/checkout-pro`, {
      method: "POST",
      body: JSON.stringify({ card_last4 }),
    }),
  checkoutTeam: (card_last4: string) =>
    req<{ plan: string; is_pro: boolean; pro_since: string }>(`/billing/checkout-team`, {
      method: "POST",
      body: JSON.stringify({ card_last4 }),
    }),
  cancelPro: () =>
    req<{ plan: string; is_pro: boolean; pro_since: string }>(`/billing/cancel`, { method: "POST" }),

  // Email verification
  requestCode: () => req<{ sent: boolean; verified?: boolean; mailed?: boolean; dev_code?: string }>(`/auth/request-code`, { method: "POST" }),
  confirmCode: (code: string) =>
    req<{ verified: boolean }>(`/auth/confirm-code`, { method: "POST", body: JSON.stringify({ code }) }),
  devInbox: () => req<{ code: string; expires_at: string; email: string }>(`/auth/dev-inbox`),
  forgot: (email: string) =>
    req<{ sent: boolean; mailed?: boolean; dev_code?: string }>(`/auth/forgot`, { method: "POST", body: JSON.stringify({ email }) }),
  resetPassword: (email: string, code: string, new_password: string) =>
    req<{ reset: boolean }>(`/auth/reset`, { method: "POST", body: JSON.stringify({ email, code, new_password }) }),

  // DB-backed catalogue
  dbMaterials: (params: { q?: string; category?: string; sort?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.q) qs.set("q", params.q);
    if (params.category) qs.set("category", params.category);
    if (params.sort) qs.set("sort", params.sort);
    const s = qs.toString();
    return req<{ materials: DbMaterial[]; total: number; source: string }>(`/materials${s ? `?${s}` : ""}`);
  },
  dbMaterial: (id: string) => req<DbMaterial>(`/materials/${id}`),

  // Research
  dbArticles: (params: { q?: string; tag?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.q) qs.set("q", params.q);
    if (params.tag) qs.set("tag", params.tag);
    const s = qs.toString();
    return req<{ articles: DbArticle[]; total: number; source: string }>(`/research/articles${s ? `?${s}` : ""}`);
  },
  livePapers: (q: string) =>
    req<{ papers: LivePaper[]; total: number; source: string }>(`/research/live?q=${encodeURIComponent(q)}`),

  // Learning content
  dbLessons: (course_id: string) =>
    req<{ lessons: DbLesson[]; source: string }>(`/learn/lessons/${course_id}`),
  dbGlossary: (q = "") =>
    req<{ terms: { term: string; definition: string; tag: string }[]; total: number; source: string }>(
      `/learn/glossary${q ? `?q=${encodeURIComponent(q)}` : ""}`,
    ),

  // Experiment history
  simRuns: () =>
    req<{ runs: SimRun[] }>(`/science/runs`),

  // Support tickets
  createTicket: (b: { name: string; email: string; subject: string; message: string }) =>
    req<SupportTicket>(`/support/tickets`, { method: "POST", body: JSON.stringify(b) }),
  myTickets: () => req<{ tickets: SupportTicket[] }>(`/support/tickets/mine`),

  // Admin
  adminStats: () => req<Record<string, number>>(`/admin/stats`),
  adminUsers: () =>
    req<{ users: AdminUser[] }>(`/admin/users`),
  adminPatchUser: (id: string, b: { is_pro?: boolean; is_admin?: boolean; email_verified?: boolean }) =>
    req<AdminUser>(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(b) }),
  adminTickets: () => req<{ tickets: SupportTicket[] }>(`/admin/tickets`),
  adminCloseTicket: (id: string) => req<{ id: string; status: string }>(`/admin/tickets/${id}/close`, { method: "POST" }),

  // Industrial batches (backend-owned)
  batches: () => req<{ batches: Batch[] }>(`/batches`),
  createBatch: (b: { name: string; material_id: string; kg: number; yield_pct: number; qc_pass: boolean }) =>
    req<Batch>(`/batches`, { method: "POST", body: JSON.stringify(b) }),
  deleteBatch: (id: string) => req<void>(`/batches/${id}`, { method: "DELETE" }),

  // Community forum (backend-owned)
  threads: (params: { tag?: string; q?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.tag) qs.set("tag", params.tag);
    if (params.q) qs.set("q", params.q);
    const s = qs.toString();
    return req<{ threads: ForumThread[]; total: number; source: string }>(`/community/threads${s ? `?${s}` : ""}`);
  },
  createThread: (b: { title: string; body: string; tag: string }) =>
    req<ForumThread>(`/community/threads`, { method: "POST", body: JSON.stringify(b) }),
  replyThread: (id: string, text: string) =>
    req<{ id: string; author: string; text: string; at: string }>(`/community/threads/${id}/replies`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),
  likeThread: (id: string) =>
    req<{ likes: number; liked: boolean }>(`/community/threads/${id}/like`, { method: "POST" }),
};

export interface Batch {
  id: string;
  name: string;
  material_id: string;
  kg: number;
  yieldPct: number;
  qcPass: boolean;
  createdAt: string;
}

export interface ForumThread {
  id: string;
  title: string;
  body: string;
  tag: string;
  author: string;
  likes: number;
  liked: boolean;
  at: string;
  replies: { id: string; author: string; text: string; at: string }[];
}

export interface CourseMeta {
  id: string;
  price_cents: number;
  free_now: boolean;
  offer_ends_at: string;
  offer_active: boolean;
  enrolled: boolean;
  purchased: boolean;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  density: string;
  default_metric: string;
  email_digest: boolean;
  email_verified?: boolean;
  is_admin?: boolean;
}

export interface DbMaterial {
  id: string;
  name: string;
  formula: string;
  category: string;
  art: string;
  accent: string;
  tagline: string;
  description: string;
  year: number;
  biocompatible: boolean;
  trending: boolean;
  index: { electrical: number; thermal: number; tensile: number; bandgap: number };
  properties: Record<string, string>;
  numbers: { conductivity: number; thermal: number; tensile: number; bandGap: number; density: number };
  applications: string[];
}

export interface DbArticle {
  id: string;
  title: string;
  source: string;
  date: string;
  readMinutes: number;
  art: string;
  accent: string;
  excerpt: string;
  tags: string[];
  body: string[];
  verified: boolean;
}

export interface LivePaper {
  paperId: string;
  title: string;
  authors: string;
  year: number | null;
  venue: string;
  abstract: string;
  citations: number;
  url: string;
}

export interface DbLesson {
  id: string;
  title: string;
  minutes: number;
  body: string[];
  quiz: { q: string; options: string[]; answer: number }[];
}

export interface SimRun {
  id: string;
  materialId: string;
  model: string;
  temperatureK: number;
  sizeNm: number;
  iterations: number;
  peak: number;
  mean: number;
  at: string;
}

export interface SupportTicket {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  at: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  plan: string;
  verified: boolean;
  admin: boolean;
  guest: boolean;
  at: string;
}

export interface BackendProject {
  id: string;
  name: string;
  description: string;
  status: string;
  createdAt: string;
  tasks: { id: string; title: string; done: boolean }[];
}

export interface BackendDataset {
  id: string;
  name: string;
  source: string;
  uploadedAt: string;
  series: { name: string; unit: string; points: { label: string; value: number }[] }[];
  stats: Record<string, Record<string, number>>;
}

export interface BackendActivity {
  id: string;
  kind: string;
  title: string;
  meta: string;
  at: string;
}

export interface BackendNotification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  at: string;
}
