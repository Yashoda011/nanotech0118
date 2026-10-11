import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Globe, Mail, ArrowLeft, ServerOff } from "lucide-react";
import { Logo } from "@/components/shell/Sidebar";
import { Button, Field, Input, Modal, Toaster } from "@/components/ui";
import { SignIn1 } from "@/components/ui/modern-stunning-sign-in";
import { api, API_BASE } from "@/lib/api";
import { useApp } from "@/store/app";

export default function AuthPage({ mode }: { mode: "login" | "signup" }) {
  const { user, login, signup, googleSignup, pushToast, settings } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/";

  const [method, setMethod] = useState<"choose" | "email">("choose");
  const [error, setError] = useState<string | null>(null);
  const [googleOpen, setGoogleOpen] = useState(false);
  const [gName, setGName] = useState("");
  const [gEmail, setGEmail] = useState("");
  const [gPassword, setGPassword] = useState("");
  const [gError, setGError] = useState<string | null>(null);
  const [gPhone, setGPhone] = useState("");
  const [gMode, setGMode] = useState<"choose" | "custom">("choose");
  const [serverDown, setServerDown] = useState(false);

  // Known mail ids on this browser (previous accounts + profile) to choose from.
  const knownEmails = useMemo(() => {
    const out: string[] = [];
    try {
      const raw = localStorage.getItem("nanosphere:accounts");
      const arr = raw ? (JSON.parse(raw) as { email?: string }[]) : [];
      arr.forEach((a) => {
        if (a.email && !out.includes(a.email)) out.push(a.email);
      });
    } catch {
      /* ignore */
    }
    if (settings.email && !/nanosphere\.(io|local)/.test(settings.email) && !out.includes(settings.email)) {
      out.push(settings.email);
    }
    return out.slice(0, 5);
  }, [settings.email, googleOpen]);

  // Show immediately if the API is unreachable, so users know WHY
  // Google signup can't create a server account right now.
  useEffect(() => {
    let cancelled = false;
    api
      .health()
      .then(() => {
        if (!cancelled) setServerDown(false);
      })
      .catch(() => {
        if (!cancelled) setServerDown(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (user) return <Navigate to="/" replace />;

  const finish = (msg: string) => {
    navigate(from, { replace: true });
    pushToast(msg, "success");
  };

  const onSubmit = async (data: { name?: string; email: string; password: string }) => {
    setError(null);
    if (mode === "login") {
      const err = await login(data.email, data.password);
      if (err) return setError(err);
      finish(`Welcome back!`);
    } else {
      const err = await signup({ name: data.name ?? "", email: data.email, password: data.password });
      if (err) return setError(err);
      finish("Account created — welcome to NanoSphere!");
    }
  };

  const onGoogle = () => {
    setGError(null);
    setGMode("choose");
    setGoogleOpen(true);
  };

  const submitGoogle = async () => {
    setGError(null);
    const email = gEmail.trim();
    if (!email) {
      setGError("Choose a mail id or type a new one.");
      return;
    }
    const err = await googleSignup({ name: gName, email, password: gPassword, phone: gPhone });
    if (err) {
      setGError(err);
      return;
    }
    setGoogleOpen(false);
    finish("Google account created — verify your email to unlock everything!");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-void px-4 py-12 sm:px-8">
      <div className="pointer-events-none absolute -left-32 top-1/4 size-96 rounded-full bg-blue/12 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 size-[28rem] rounded-full bg-violet/12 blur-3xl" />

      <main className="relative w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl border border-line bg-elevated/80 p-8 shadow-2xl shadow-black/40 backdrop-blur"
        >
          <div className="mb-7 flex justify-center">
            <Logo />
          </div>

          {serverDown && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-gold/30 bg-gold/8 px-4 py-3 text-[12.5px] leading-relaxed text-ink-soft">
              <ServerOff className="mt-0.5 size-4 shrink-0 text-gold" />
              <span>
                Sign-in needs the backend server{API_BASE.includes("127.0.0.1") || API_BASE.includes("localhost") ? " on this computer — double-click start-all.bat in the project folder, then retry" : ""}.
                Nothing here works offline — not even email sign-in.
              </span>
            </div>
          )}

          {method === "choose" ? (
            <div>
              <h2 className="text-center text-xl font-bold tracking-tight text-ink">
                {mode === "login" ? "Welcome back" : "Join NanoSphere"}
              </h2>
              <p className="mt-1.5 text-center text-[13px] text-ink-muted">
                Choose how you want to continue — links open instantly below.
              </p>
              <div className="mt-6 space-y-3">
                <Button variant="gradient" size="lg" className="w-full" onClick={() => void onGoogle()}>
                  <Globe className="size-4" /> Continue with Google
                </Button>
                <Button variant="secondary" size="lg" className="w-full" onClick={() => setMethod("email")}>
                  <Mail className="size-4" /> Continue with Email
                </Button>
              </div>
              <p className="mt-4 text-center text-[11.5px] leading-relaxed text-ink-muted/80">
                Google creates a real member account (verify email next) · Email uses a password account.
              </p>
            </div>
          ) : (
            <div>
              <button
                onClick={() => {
                  setMethod("choose");
                  setError(null);
                }}
                className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ink-muted transition hover:text-ink"
              >
                <ArrowLeft className="size-4" /> All sign-in options
              </button>
              <SignIn1 mode={mode} serverError={error} hideGoogle onSubmit={onSubmit} onGoogle={onGoogle} />
            </div>
          )}
        </motion.div>
      </main>

      <Modal
        open={googleOpen}
        onClose={() => setGoogleOpen(false)}
        title="Continue with Google"
        description="Creates a real member account linked to your Google email — never a guest session. Verify the email next to unlock courses and Pro."
        footer={
          <>
            <Button variant="ghost" onClick={() => setGoogleOpen(false)}>Cancel</Button>
            <Button variant="gradient" onClick={() => void submitGoogle()}>Create Google account</Button>
          </>
        }
      >
        <div className="space-y-4">
          {knownEmails.length > 0 && gMode === "choose" && (
            <div className="space-y-1.5">
              <p className="text-[13px] font-medium text-ink">Choose a mail id</p>
              {knownEmails.map((em) => (
                <button
                  key={em}
                  onClick={() => {
                    setGEmail(em);
                    setGMode("custom");
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl border border-line px-3.5 py-2.5 text-left text-[13px] text-ink-soft transition-colors hover:border-blue-soft/40 hover:text-ink"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-blue/12 text-[11px] font-bold text-blue-soft">
                    {em.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="truncate">{em}</span>
                </button>
              ))}
              <button onClick={() => { setGEmail(""); setGMode("custom"); }} className="text-[12.5px] text-blue-soft hover:underline">
                Use a different mail id
              </button>
            </div>
          )}
          {(knownEmails.length === 0 || gMode === "custom") && (
            <Field label="Gmail address">
              <Input type="email" value={gEmail} onChange={(e) => setGEmail(e.target.value)} placeholder="you@gmail.com" autoComplete="email" />
            </Field>
          )}
          {gMode === "custom" && knownEmails.length > 0 && (
            <button onClick={() => setGMode("choose")} className="text-[12.5px] text-ink-muted hover:text-ink">
              ← Back to saved mail ids
            </button>
          )}
          <Field label="Full name">
            <Input value={gName} onChange={(e) => setGName(e.target.value)} placeholder="Ada Lovelace" autoComplete="name" />
          </Field>
          <Field label="Phone number (optional)">
            <Input type="tel" value={gPhone} onChange={(e) => setGPhone(e.target.value)} placeholder="+91 98765 43210" autoComplete="tel" />
          </Field>
          <Field label="Password (min 6 characters)">
            <Input type="password" value={gPassword} onChange={(e) => setGPassword(e.target.value)} placeholder="Choose a password" autoComplete="new-password" />
          </Field>
          {gError && (
            <p role="alert" className="rounded-xl border border-rose/30 bg-rose/10 px-3.5 py-2.5 text-[13px] text-rose">{gError}</p>
          )}
        </div>
      </Modal>

      <Toaster />
    </div>
  );
}
