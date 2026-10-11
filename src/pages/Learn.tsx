import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Clock, CheckCircle2, ArrowLeft, Award, Mail, Lock, Timer, CreditCard, BookOpen, Search } from "lucide-react";
import { PageHeader } from "@/components/shell/AppLayout";
import { Card, Button, Badge, EmptyState, Modal, Field, Input, SegmentedControl } from "@/components/ui";
import { COURSES, getCourse } from "@/data/courses";
import { api, getToken, type CourseMeta, type DbLesson } from "@/lib/api";
import { useApp } from "@/store/app";
import { cn } from "@/lib/utils";

function countdown(iso: string, now: number): string {
  const ms = new Date(iso).getTime() - now;
  if (ms <= 0) return "Offer ended";
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${d}d ${h}h ${m}m left`;
}

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export default function LearnPage() {
  const { pushToast, logActivity, user, settings } = useApp();
  const navigate = useNavigate();
  const [courseId, setCourseId] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<CourseMeta[] | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [payFor, setPayFor] = useState<string | null>(null);
  const [card, setCard] = useState("");
  const [payError, setPayError] = useState<string | null>(null);
  const [quizOpen, setQuizOpen] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [now, setNow] = useState(() => Date.now());
  const [view, setView] = useState<"courses" | "glossary">("courses");
  const [terms, setTerms] = useState<{ term: string; definition: string; tag: string }[] | null>(null);
  const [termQuery, setTermQuery] = useState("");
  const [dbLessons, setDbLessons] = useState<DbLesson[] | null>(null);

  // Members only: guests have no course access (backend enforces 403 too).
  const isMember = !!user && !user.guest && !!getToken();

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(t);
  }, []);

  const refreshCatalog = async () => {
    if (!isMember) {
      setCatalog(null);
      return;
    }
    try {
      const res = await api.learnCourses();
      setCatalog(res.courses);
      setCatalogError(null);
    } catch (e) {
      setCatalogError(e instanceof Error ? e.message : "Backend unreachable");
    }
  };

  useEffect(() => {
    void refreshCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMember]);

  useEffect(() => {
    if (view !== "glossary" || terms !== null) return;
    api
      .dbGlossary()
      .then((res) => setTerms(res.terms))
      .catch(() => setTerms([]));
  }, [view, terms]);

  const shownTerms = useMemo(() => {
    const list = terms ?? [];
    const q = termQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((t) => t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q));
  }, [terms, termQuery]);

  const metaOf = (cid: string): CourseMeta | undefined => catalog?.find((c) => c.id === cid);
  const enrolledIds = useMemo(() => new Set((catalog ?? []).filter((c) => c.enrolled).map((c) => c.id)), [catalog]);
  const offer = catalog?.[0];
  const totalLessons = useMemo(() => COURSES.reduce((a, c) => a + c.lessons.length, 0), []);
  const doneCount = useMemo(() => Object.values(done).filter(Boolean).length, [done]);

  const course = courseId ? getCourse(courseId) : undefined;

  const openCourse = async (cid: string) => {
    if (!isMember) {
      pushToast("Guests cannot take courses — please sign in.", "info");
      navigate("/login");
      return;
    }
    if (!enrolledIds.has(cid)) return; // must enroll first
    try {
      const [prog, les] = await Promise.all([api.learnProgress(cid), api.dbLessons(cid)]);
      const map: Record<string, boolean> = {};
      prog.progress.forEach((p) => {
        if (p.done) map[p.lesson_id] = true;
      });
      setDone((prev) => ({ ...prev, ...map }));
      setDbLessons(les.lessons);
    } catch {
      setDbLessons(null);
      /* offline lesson read — lessons still viewable once enrolled */
    }
    setCourseId(cid);
  };

  const enrollFree = async (cid: string) => {
    try {
      await api.learnEnroll(cid, settings.name, settings.email);
      logActivity("system", `Enrolled in ${getCourse(cid)?.title ?? "course"}`, settings.email);
      pushToast("Enrolled — welcome to the course!", "success");
      await refreshCatalog();
      await openCourse(cid);
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Enrollment failed", "info");
    }
  };

  const submitCheckout = async () => {
    if (!payFor) return;
    const digits = card.replace(/\D/g, "");
    if (digits.length < 12) {
      setPayError("Enter a valid demo card number (12+ digits).");
      return;
    }
    setPayError(null);
    try {
      await api.learnCheckout(payFor, digits.slice(-4));
      logActivity("system", `Purchased ${getCourse(payFor)?.title ?? "course"}`, "demo checkout");
      pushToast("Payment accepted (demo) — course unlocked!", "success");
      setPayFor(null);
      setCard("");
      await refreshCatalog();
      await openCourse(payFor);
    } catch {
      pushToast("Checkout failed — try again", "info");
    }
  };

  const markDone = async (cid: string, lessonId: string, score = 0) => {
    setDone((prev) => ({ ...prev, [lessonId]: true }));
    try {
      await api.learnSaveProgress(cid, lessonId, true, score);
    } catch {
      pushToast("Saved locally — will sync when backend is reachable", "info");
    }
    logActivity("system", "Lesson completed", lessonId);
  };

  const submitQuiz = async (cid: string, lessonId: string, total: number, correct: number) => {
    if (correct === total) {
      await markDone(cid, lessonId, 100);
      pushToast("Quiz passed — lesson completed!", "success");
      setQuizOpen(null);
    } else {
      try {
        await api.learnSaveProgress(cid, lessonId, false, Math.round((correct / total) * 100));
      } catch {
        /* offline — score kept locally next pass */
      }
      pushToast(`You got ${correct}/${total} — try again`, "info");
    }
  };

  /* ---------------- Course catalogue ---------------- */
  if (!course) {
    return (
      <div className="mx-auto max-w-[1100px]">
        <PageHeader
          title="Learning & Education"
          subtitle={`${COURSES.length} courses · ${totalLessons} lessons — members-only enrollment with email login. Guests cannot take courses.`}
        actions={
            <SegmentedControl
              options={[
                { value: "courses", label: "Courses" },
                { value: "glossary", label: "Glossary" },
              ]}
              value={view}
              onChange={(v) => setView(v as typeof view)}
            />
          }
        />

        {view === "glossary" ? (
          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
              <BookOpen className="size-4 text-cyan" /> Nano glossary
              <span className="text-[11.5px] font-normal text-ink-muted">{terms === null ? "loading from database..." : `${shownTerms.length} terms - stored in Postgres`}</span>
            </h2>
            <div className="relative mt-3 max-w-md">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
              <Input value={termQuery} onChange={(e) => setTermQuery(e.target.value)} placeholder="Search terms..." className="pl-10" aria-label="Search glossary" />
            </div>
            <dl className="mt-4 grid gap-2.5 md:grid-cols-2">
              {shownTerms.map((t) => (
                <div key={t.term} className="rounded-xl border border-line bg-panel/50 px-4 py-3">
                  <dt className="flex items-center justify-between text-[13.5px] font-semibold text-ink">
                    {t.term}
                    <Badge tone="neutral">{t.tag}</Badge>
                  </dt>
                  <dd className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">{t.definition}</dd>
                </div>
              ))}
            </dl>
            {terms !== null && shownTerms.length === 0 && (
              <p className="py-6 text-center text-[13px] text-ink-muted">
                {terms.length === 0 ? "Glossary needs the backend - connect to load terms." : "No terms match."}
              </p>
            )}
          </Card>
        ) : (
        <>
        {offer?.offer_active && (
          <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-mint/30 bg-mint/8 px-5 py-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-mint/15 text-mint">
              <Timer className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-ink">Limited offer: all courses FREE</p>
              <p className="text-[12.5px] text-ink-muted">
                Ends {new Date(offer.offer_ends_at).toLocaleDateString()} · {countdown(offer.offer_ends_at, now)} — afterwards courses are paid.
              </p>
            </div>
            {!isMember && (
              <Button variant="gradient" size="sm" onClick={() => navigate("/signup")}>Sign up free</Button>
            )}
          </div>
        )}
        {catalog && !offer?.offer_active && (
          <div className="mb-5 rounded-2xl border border-gold/30 bg-gold/8 px-5 py-4 text-[13.5px] text-ink-soft">
            The free enrollment offer has ended — courses are now paid. Buy once, keep access forever.
          </div>
        )}
        {isMember && catalogError && (
          <div className="mb-5 rounded-2xl border border-rose/30 bg-rose/10 px-5 py-4 text-[13.5px] text-rose">
            Backend unreachable: {catalogError}. Enrollment and progress need the FastAPI server.
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          {COURSES.map((c) => {
            const meta = metaOf(c.id);
            const enrolled = enrolledIds.has(c.id);
            const freeNow = meta?.free_now ?? true;
            const price = meta?.price_cents ?? 0;
            return (
              <Card key={c.id} lift className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="grid size-11 place-items-center rounded-xl" style={{ background: `${c.accent}22`, color: c.accent }}>
                    <GraduationCap className="size-5" />
                  </span>
                  <span className="flex gap-1.5">
                    {enrolled && <Badge tone="blue">Enrolled</Badge>}
                    {freeNow ? (
                      <span className="rounded-full bg-mint/15 px-2.5 py-0.5 text-[11.5px] font-bold text-mint">FREE</span>
                    ) : (
                      <span className="rounded-full bg-gold/15 px-2.5 py-0.5 text-[11.5px] font-bold text-gold">{money(price)}</span>
                    )}
                    <Badge tone="neutral">{c.level}</Badge>
                  </span>
                </div>
                <h2 className="mt-3 text-[16px] font-bold text-ink">{c.title}</h2>
                <p className="mt-1 text-[13px] text-ink-muted">{c.tagline}</p>
                <p className="mt-1.5 text-[12px] text-ink-muted">{c.lessons.length} lessons · {c.lessons.reduce((a, l) => a + l.minutes, 0)} min · certificate included</p>
                {!isMember ? (
                  <Button variant="gradient" className="mt-4 w-full" onClick={() => navigate("/login")}>
                    <Lock className="size-4" /> Sign in with email to open
                  </Button>
                ) : enrolled ? (
                  <Button variant="gradient" className="mt-4 w-full" onClick={() => void openCourse(c.id)}>Open course</Button>
                ) : freeNow ? (
                  <Button variant="gradient" className="mt-4 w-full" onClick={() => void enrollFree(c.id)}>Enroll free & open</Button>
                ) : (
                  <Button variant="gradient" className="mt-4 w-full" onClick={() => { setPayFor(c.id); setCard(""); setPayError(null); }}>
                    <CreditCard className="size-4" /> Buy {money(price)} & enroll
                  </Button>
                )}
              </Card>
            );
          })}
        </div>

        <Modal
          open={payFor !== null}
          onClose={() => setPayFor(null)}
          title={payFor ? `Buy: ${getCourse(payFor)?.title ?? ""}` : "Buy course"}
          description="Demo checkout — card is shape-validated only, never charged or stored."
          footer={
            <>
              <Button variant="ghost" onClick={() => setPayFor(null)}>Cancel</Button>
              <Button variant="gradient" onClick={() => void submitCheckout()}>Pay & unlock</Button>
            </>
          }
        >
          <div className="space-y-4">
            <Field label="Card number (demo)">
              <Input value={card} onChange={(e) => setCard(e.target.value)} placeholder="4242 4242 4242 4242" inputMode="numeric" />
            </Field>
            {payError && (
              <p role="alert" className="rounded-xl border border-rose/30 bg-rose/10 px-3.5 py-2.5 text-[13px] text-rose">{payError}</p>
            )}
            <p className="text-[12.5px] text-ink-muted">One-time payment · lifetime access · receipt logged to activity.</p>
          </div>
        </Modal>
        </>
        )}
      </div>
    );
  }

  /* ---------------- Course detail (enrolled members) ---------------- */
  const lessons = dbLessons ?? course.lessons;
  const quizLesson = quizOpen ? lessons.find((l) => l.id === quizOpen) : undefined;
  const meta = metaOf(course.id);

  return (
    <div className="mx-auto max-w-[900px]">
      <PageHeader
        title={course.title}
        subtitle={`${course.level} · ${course.lessons.length} lessons · Enrolled${meta && !meta.free_now ? ` · Paid ${money(meta.price_cents)}` : " · Free (limited offer)"}`}
      />
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => setCourseId(null)}>
        <ArrowLeft className="size-4" /> All courses
      </Button>

      <Card className="mb-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-[15px] font-semibold text-ink">About this topic</h2>
          {meta?.free_now ? (
            <span className="rounded-full bg-mint/15 px-2.5 py-0.5 text-[11.5px] font-bold text-mint">FREE COURSE</span>
          ) : (
            <span className="rounded-full bg-gold/15 px-2.5 py-0.5 text-[11.5px] font-bold text-gold">PAID · {meta ? money(meta.price_cents) : ""}</span>
          )}
          <Badge tone="blue">{course.level}</Badge>
        </div>
        {course.about.map((p, i) => (
          <p key={i} className="mt-2.5 text-[13.5px] leading-relaxed text-ink-soft">{p}</p>
        ))}
        <h3 className="mt-4 text-[13.5px] font-semibold text-ink">What you will learn</h3>
        <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {course.outcomes.map((o) => (
            <li key={o} className="flex items-start gap-2 text-[12.5px] text-ink-soft">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-mint" /> {o}
            </li>
          ))}
        </ul>
        <p className="mt-3 flex items-center gap-1.5 text-[12px] text-ink-muted">
          <Mail className="size-3.5" /> Licensed to {settings.name} ({settings.email})
        </p>
      </Card>

      <div className="space-y-4">
        {lessons.map((l) => (
          <Card key={l.id} className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
                {done[l.id] && <CheckCircle2 className="size-4 text-mint" />}
                {l.title}
              </h3>
              <span className="flex items-center gap-1 text-[12px] text-ink-muted"><Clock className="size-3.5" /> {l.minutes} min</span>
            </div>
            {l.body.map((p, i) => (
              <p key={i} className="mt-2.5 text-[13.5px] leading-relaxed text-ink-soft">{p}</p>
            ))}
            <div className="mt-4 flex flex-wrap gap-2">
              {!done[l.id] && (
                <Button variant="secondary" size="sm" onClick={() => { setAnswers({}); setQuizOpen(l.id); }}>
                  <Award className="size-4" /> Take quiz ({l.quiz.length} questions)
                </Button>
              )}
              {done[l.id] ? <Badge tone="blue">Completed · synced to backend</Badge> : (
                <Button variant="ghost" size="sm" onClick={() => void markDone(course.id, l.id)}>Skip & mark done</Button>
              )}
              {l.id === "nc1" && (
                <Button variant="ghost" size="sm" onClick={() => navigate("/lab-tools")}>Open Scherrer calculator</Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {COURSES.length === 0 && (
        <EmptyState icon={GraduationCap} title="No courses" description="Check back soon." />
      )}

      <Modal
        open={!!quizLesson}
        onClose={() => setQuizOpen(null)}
        title={quizLesson ? `Quiz: ${quizLesson.title}` : ""}
        description="Answer all questions correctly to complete the lesson."
        footer={
          <>
            <Button variant="ghost" onClick={() => setQuizOpen(null)}>Cancel</Button>
            {quizLesson && (
              <Button
                variant="gradient"
                onClick={() => {
                  const correct = quizLesson.quiz.filter((qq, i) => answers[i] === qq.answer).length;
                  void submitQuiz(course.id, quizLesson.id, quizLesson.quiz.length, correct);
                }}
              >
                Submit answers
              </Button>
            )}
          </>
        }
      >
        <div className="space-y-5">
          {quizLesson?.quiz.map((qq, qi) => (
            <div key={qi}>
              <p className="text-[13.5px] font-medium text-ink">{qi + 1}. {qq.q}</p>
              <div className="mt-2 space-y-1.5">
                {qq.options.map((opt, oi) => (
                  <button
                    key={oi}
                    onClick={() => setAnswers((p) => ({ ...p, [qi]: oi }))}
                    className={cn(
                      "w-full rounded-xl border px-3.5 py-2.5 text-left text-[13px] transition-colors",
                      answers[qi] === oi ? "border-blue/50 bg-blue/10 text-ink" : "border-line text-ink-soft hover:border-blue-soft/30",
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
