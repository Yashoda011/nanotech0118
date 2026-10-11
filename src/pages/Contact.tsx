import { useEffect, useState } from "react";
import { Mail, Send, Inbox } from "lucide-react";
import { PageHeader } from "@/components/shell/AppLayout";
import { Card, Button, Field, Input, Badge, EmptyState } from "@/components/ui";
import { api, type SupportTicket } from "@/lib/api";
import { useApp } from "@/store/app";
import { relativeTime } from "@/lib/utils";

export default function ContactPage() {
  const { pushToast, backendOnline, user, settings } = useApp();
  const [name, setName] = useState(settings.name === "Researcher" ? "" : settings.name);
  const [email, setEmail] = useState(/nanosphere\.(io|local)/.test(settings.email) ? "" : settings.email);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sentId, setSentId] = useState<string | null>(null);
  const [mine, setMine] = useState<SupportTicket[]>([]);

  useEffect(() => {
    if (!backendOnline || !user || user.guest) {
      setMine([]);
      return;
    }
    api.myTickets().then((r) => setMine(r.tickets)).catch(() => setMine([]));
  }, [backendOnline, user]);

  const submit = async () => {
    if (name.trim().length < 2) return setError("Please enter your name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Please enter a valid email address.");
    if (subject.trim().length < 4) return setError("Subject needs at least 4 characters.");
    if (message.trim().length < 10) return setError("Message needs at least 10 characters.");
    setError(null);
    setBusy(true);
    try {
      const t = await api.createTicket({ name: name.trim(), email: email.trim(), subject: subject.trim(), message: message.trim() });
      setSentId(t.id);
      setSubject("");
      setMessage("");
      pushToast(`Ticket ${t.id} submitted — we reply within 2 business days`, "success");
      if (backendOnline && user && !user.guest) {
        api.myTickets().then((r) => setMine(r.tickets)).catch(() => {});
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed — is the backend online?");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-[900px]">
      <PageHeader
        title="Contact & Support"
        subtitle="Ask for help — we reply within 2 business days."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
            <Mail className="size-4 text-blue-soft" /> New support ticket
          </h2>
          <div className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Your name">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" autoComplete="name" />
              </Field>
              <Field label="Email">
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@lab.io" autoComplete="email" />
              </Field>
            </div>
            <Field label="Subject">
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. XRD upload fails on large CSV" />
            </Field>
            <Field label="Message">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What happened? What did you expect? Steps to reproduce…"
                rows={5}
                className="w-full rounded-xl border border-line bg-panel/80 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-blue-soft/50 focus:outline-none"
              />
            </Field>
            {error && (
              <p role="alert" className="rounded-xl border border-rose/30 bg-rose/10 px-3.5 py-2.5 text-[13px] text-rose">{error}</p>
            )}
            {sentId && (
              <p className="rounded-xl border border-mint/30 bg-mint/10 px-3.5 py-2.5 text-[13px] text-mint">
                Ticket {sentId} submitted — we reply within 2 business days.
              </p>
            )}
            <Button variant="gradient" onClick={() => void submit()} disabled={busy} className="w-full">
              <Send className="size-4" /> {busy ? "Submitting…" : "Submit ticket"}
            </Button>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
            <Inbox className="size-4 text-violet" /> My tickets
          </h2>
          {!backendOnline || !user || user.guest ? (
            <p className="py-6 text-center text-[13px] text-ink-muted">Sign in to track your tickets here.</p>
          ) : mine.length === 0 ? (
            <EmptyState title="No tickets yet" description="Submitted tickets with your account email appear here." />
          ) : (
            <ul className="mt-3 space-y-2.5">
              {mine.map((t) => (
                <li key={t.id} className="rounded-xl border border-line px-4 py-3">
                  <p className="flex items-center justify-between gap-2 text-[13.5px] font-medium text-ink">
                    <span className="truncate">{t.subject}</span>
                    <Badge tone={t.status === "open" ? "blue" : "neutral"}>{t.status}</Badge>
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-ink-muted">{t.id} · {relativeTime(t.at)}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
