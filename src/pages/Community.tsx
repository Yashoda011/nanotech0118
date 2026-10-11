import { useMemo, useState } from "react";
import { Users, Plus, ThumbsUp, MessageSquare, Search } from "lucide-react";
import { PageHeader } from "@/components/shell/AppLayout";
import { Card, Button, Field, Input, Modal, Badge, EmptyState } from "@/components/ui";
import { readLS, writeLS } from "@/lib/storage";
import { useApp } from "@/store/app";
import { uid, relativeTime, cn } from "@/lib/utils";

interface Reply {
  id: string;
  author: string;
  text: string;
  at: string;
}

interface Thread {
  id: string;
  title: string;
  body: string;
  tag: string;
  author: string;
  likes: number;
  liked?: boolean;
  replies: Reply[];
  at: string;
}

const SEED: Thread[] = [
  {
    id: "t1", title: "Best dispersant for Ag nanoparticle ink?", tag: "Formulation", author: "Maya R.", likes: 12, at: new Date(Date.now() - 86400000 * 1).toISOString(),
    body: "My silver traces crack after sintering at 150°C. Which dispersant keeps 40nm Ag stable in ethanol without killing conductivity?",
    replies: [
      { id: "r1", author: "Dev K.", text: "Try 1 wt% PVP (10k) + slow ramp 2°C/min. Fixed the same cracking for me.", at: new Date(Date.now() - 86400000 * 0.5).toISOString() },
    ],
  },
  {
    id: "t2", title: "Scherrer vs TEM sizes disagree — normal?", tag: "Characterization", author: "Prof. S.", likes: 8, at: new Date(Date.now() - 86400000 * 3).toISOString(),
    body: "XRD gives 18 nm, TEM shows 35 nm particles. Is my FWHM wrong or is this expected?",
    replies: [
      { id: "r2", author: "Nano Team", text: "Expected — Scherrer measures coherent crystallites, TEM sees whole particles (often polycrystalline). Compare both in Lab Tools.", at: new Date(Date.now() - 86400000 * 2).toISOString() },
    ],
  },
  {
    id: "t3", title: "Showcase: ZnO nanorod gas sensor array", tag: "Showcase", author: "Aarav", likes: 21, at: new Date(Date.now() - 86400000 * 6).toISOString(),
    body: "Room-temperature response to 50 ppm ethanol using the Nano Sensor project template. Traces and yield data in Analysis.",
    replies: [],
  },
];

const TAGS = ["All", "Formulation", "Characterization", "Showcase", "Safety", "Business"];

export default function CommunityPage() {
  const { pushToast, settings } = useApp();
  const [threads, setThreads] = useState<Thread[]>(() => readLS("threads", SEED));
  const [tag, setTag] = useState("All");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [newTag, setNewTag] = useState("Formulation");
  const [replyFor, setReplyFor] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const persist = (next: Thread[]) => {
    setThreads(next);
    writeLS("threads", next);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return threads.filter((t) => {
      if (tag !== "All" && t.tag !== tag) return false;
      if (q && !`${t.title} ${t.body}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [threads, tag, query]);

  return (
    <div className="mx-auto max-w-[900px]">
      <PageHeader
        title="Community"
        subtitle={`${threads.length} discussions — ask formulation questions, share results, meet researchers.`}
        actions={<Button variant="gradient" onClick={() => setOpen(true)}><Plus className="size-4" /> New discussion</Button>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5">
          {TAGS.map((t) => (
            <button
              key={t}
              onClick={() => setTag(t)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors",
                tag === t ? "border-blue/50 bg-blue/12 text-ink" : "border-line text-ink-muted hover:text-ink",
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="relative ml-auto w-full sm:w-56">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search discussions…"
            aria-label="Search discussions"
            className="h-9 w-full rounded-xl border border-line bg-panel/80 pl-9 pr-3 text-[13px] text-ink placeholder:text-ink-muted focus:border-blue-soft/50 focus:outline-none"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card><EmptyState icon={Users} title="No discussions" description="Try another tag or start the first thread on this topic." /></Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((t) => (
            <Card key={t.id} className="p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="blue">{t.tag}</Badge>
                <span className="text-[12px] text-ink-muted">{t.author} · {relativeTime(t.at)}</span>
              </div>
              <h2 className="mt-2 text-[15px] font-bold text-ink">{t.title}</h2>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-soft">{t.body}</p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => persist(threads.map((x) => (x.id === t.id ? { ...x, likes: x.likes + (x.liked ? -1 : 1), liked: !x.liked } : x)))}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors",
                    t.liked ? "border-blue/50 bg-blue/12 text-ink" : "border-line text-ink-muted hover:text-ink",
                  )}
                >
                  <ThumbsUp className="size-3.5" /> {t.likes}
                </button>
                <button
                  onClick={() => { setReplyFor(replyFor === t.id ? null : t.id); setReplyText(""); }}
                  className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[12px] font-medium text-ink-muted transition-colors hover:text-ink"
                >
                  <MessageSquare className="size-3.5" /> {t.replies.length} {t.replies.length === 1 ? "reply" : "replies"}
                </button>
              </div>
              {replyFor === t.id && (
                <div className="mt-3 flex gap-2">
                  <input
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && replyText.trim()) {
                        persist(threads.map((x) => x.id === t.id ? {
                          ...x, replies: [...x.replies, { id: uid("r"), author: settings.name, text: replyText.trim(), at: new Date().toISOString() }],
                        } : x));
                        setReplyText("");
                        pushToast("Reply posted", "success");
                      }
                    }}
                    placeholder="Write a reply… (Enter to post)"
                    aria-label="Write a reply"
                    className="h-10 flex-1 rounded-xl border border-line bg-panel/80 px-3.5 text-[13px] text-ink placeholder:text-ink-muted focus:border-blue-soft/50 focus:outline-none"
                  />
                  <Button
                    size="sm"
                    disabled={!replyText.trim()}
                    onClick={() => {
                      persist(threads.map((x) => x.id === t.id ? {
                        ...x, replies: [...x.replies, { id: uid("r"), author: settings.name, text: replyText.trim(), at: new Date().toISOString() }],
                      } : x));
                      setReplyText("");
                      pushToast("Reply posted", "success");
                    }}
                  >
                    Post
                  </Button>
                </div>
              )}
              {t.replies.length > 0 && (
                <ul className="mt-3 space-y-2 border-t border-line pt-3">
                  {t.replies.map((r) => (
                    <li key={r.id} className="rounded-xl bg-panel/60 px-3.5 py-2.5">
                      <p className="text-[13px] text-ink-soft">{r.text}</p>
                      <p className="mt-1 text-[11.5px] text-ink-muted">{r.author} · {relativeTime(r.at)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New discussion"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              variant="gradient"
              disabled={!title.trim() || !body.trim()}
              onClick={() => {
                persist([{ id: uid("t"), title: title.trim(), body: body.trim(), tag: newTag, author: settings.name, likes: 0, replies: [], at: new Date().toISOString() }, ...threads]);
                setOpen(false);
                setTitle("");
                setBody("");
                pushToast("Discussion posted", "success");
              }}
            >
              Post discussion
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Title">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Dispersant for Cu ink?" />
          </Field>
          <Field label="Details">
            <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="What did you try? What failed?" />
          </Field>
          <Field label="Tag">
            <select value={newTag} onChange={(e) => setNewTag(e.target.value)} className="h-11 w-full rounded-xl border border-line bg-panel/80 px-3.5 text-sm text-ink focus:border-blue-soft/50 focus:outline-none">
              {TAGS.filter((t) => t !== "All").map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Field>
        </div>
      </Modal>
    </div>
  );
}
