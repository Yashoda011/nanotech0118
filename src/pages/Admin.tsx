import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Users, Ticket, FlaskConical, BadgeCheck } from "lucide-react";
import { PageHeader } from "@/components/shell/AppLayout";
import { Card, Button, Badge, EmptyState } from "@/components/ui";
import { api, type AdminUser, type SupportTicket } from "@/lib/api";
import { useApp } from "@/store/app";
import { relativeTime, cn } from "@/lib/utils";

export default function AdminPage() {
  const { user, backendOnline, pushToast } = useApp();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (!backendOnline) return;
    Promise.all([api.adminStats(), api.adminUsers(), api.adminTickets()])
      .then(([s, u, t]) => {
        setStats(s);
        setUsers(u.users);
        setTickets(t.tickets);
      })
      .catch(() => setDenied(true));
  }, [backendOnline]);

  if (!user || (!user.isAdmin && !denied)) {
    // let the fetch decide; show gate meanwhile for obvious non-admins
  }

  const patchUser = async (id: string, body: { is_pro?: boolean; is_admin?: boolean; email_verified?: boolean }) => {
    try {
      const updated = await api.adminPatchUser(id, body);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, plan: updated.plan, verified: updated.verified, admin: updated.admin } : u)));
      pushToast("User updated", "success");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Update failed", "info");
    }
  };

  const closeTicket = async (id: string) => {
    try {
      await api.adminCloseTicket(id);
      setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status: "closed" } : t)));
      const s = await api.adminStats();
      setStats(s);
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Close failed", "info");
    }
  };

  if (!backendOnline) {
    return (
      <div className="mx-auto max-w-[1000px]">
        <PageHeader title="Admin Panel" subtitle="Needs the FastAPI backend." />
        <Card><EmptyState icon={ShieldCheck} title="Backend offline" description="Admin management requires a live server connection." /></Card>
      </div>
    );
  }

  if (denied || (user && !user.isAdmin)) {
    return (
      <div className="mx-auto max-w-[1000px]">
        <PageHeader title="Admin Panel" subtitle="Restricted area." />
        <Card>
          <EmptyState
            icon={ShieldCheck}
            title="Admin access required"
            description="This account is not an administrator. Sign in as an admin (ADMIN_EMAILS) to manage users and tickets."
            action={<Button variant="gradient" onClick={() => navigate("/")}>Back to dashboard</Button>}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader title="Admin Panel" subtitle="Protected user and platform management." actions={<Badge tone="blue"><ShieldCheck className="size-3" /> Administrator</Badge>} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Users", value: stats?.users ?? 0, icon: Users },
          { label: "Paid plans", value: stats?.pro_users ?? 0, icon: BadgeCheck },
          { label: "Open tickets", value: stats?.open_tickets ?? 0, icon: Ticket },
          { label: "Sims today", value: stats?.sims_today ?? 0, icon: FlaskConical },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} className="flex items-center gap-3 p-4">
            <span className="grid size-10 place-items-center rounded-xl bg-blue/12 text-blue-soft"><Icon className="size-5" /></span>
            <span>
              <span className="block text-xl font-bold tabular-nums text-ink">{value}</span>
              <span className="block text-[12px] text-ink-muted">{label}</span>
            </span>
          </Card>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="border-b border-line px-5 py-4 text-[15px] font-semibold text-ink">Users ({users.length})</h2>
          <ul className="max-h-[26rem] space-y-2 overflow-y-auto p-3 scrollbar-thin">
            {users.map((u) => (
              <li key={u.id} className="rounded-xl border border-line px-3.5 py-3">
                <p className="flex items-center gap-2 text-[13px] font-medium text-ink">
                  <span className="truncate">{u.name}</span>
                  <Badge tone={u.plan === "starter" ? "neutral" : "blue"}>{u.plan}</Badge>
                  {u.admin && <Badge tone="blue">admin</Badge>}
                  {!u.verified && <Badge tone="neutral">unverified</Badge>}
                </p>
                <p className="mt-0.5 truncate text-[11.5px] text-ink-muted">{u.email} · {relativeTime(u.at)}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <button onClick={() => void patchUser(u.id, { is_pro: u.plan === "starter" })} className={cn("rounded-lg border px-2.5 py-1 text-[11.5px] transition-colors", "border-line text-ink-muted hover:text-ink")}>
                    {u.plan === "starter" ? "Grant Pro" : "Revoke Pro"}
                  </button>
                  <button onClick={() => void patchUser(u.id, { email_verified: true })} disabled={u.verified} className="rounded-lg border border-line px-2.5 py-1 text-[11.5px] text-ink-muted transition-colors hover:text-ink disabled:opacity-40">
                    Verify email
                  </button>
                  <button onClick={() => void patchUser(u.id, { is_admin: !u.admin })} className="rounded-lg border border-line px-2.5 py-1 text-[11.5px] text-ink-muted transition-colors hover:text-ink">
                    {u.admin ? "Remove admin" : "Make admin"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="border-b border-line px-5 py-4 text-[15px] font-semibold text-ink">Support tickets ({tickets.length})</h2>
          <ul className="max-h-[26rem] space-y-2 overflow-y-auto p-3 scrollbar-thin">
            {tickets.map((t) => (
              <li key={t.id} className="rounded-xl border border-line px-3.5 py-3">
                <p className="flex items-center justify-between gap-2 text-[13px] font-medium text-ink">
                  <span className="truncate">{t.subject}</span>
                  <Badge tone={t.status === "open" ? "blue" : "neutral"}>{t.status}</Badge>
                </p>
                <p className="mt-0.5 text-[11.5px] text-ink-muted">{t.name} · {t.email} · {relativeTime(t.at)}</p>
                <p className="mt-1.5 line-clamp-2 text-[12.5px] text-ink-soft">{t.message}</p>
                {t.status === "open" && (
                  <Button variant="ghost" size="sm" className="mt-2" onClick={() => void closeTicket(t.id)}>Mark resolved</Button>
                )}
              </li>
            ))}
            {tickets.length === 0 && <p className="py-6 text-center text-[12.5px] text-ink-muted">No tickets.</p>}
          </ul>
        </Card>
      </div>
    </div>
  );
}
