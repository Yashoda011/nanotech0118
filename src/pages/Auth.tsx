import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Globe, Mail, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/shell/Sidebar";
import { Button, Toaster } from "@/components/ui";
import { SignIn1 } from "@/components/ui/modern-stunning-sign-in";
import { useApp } from "@/store/app";

export default function AuthPage({ mode }: { mode: "login" | "signup" }) {
  const { user, login, signup, continueAsGuest, pushToast } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/";

  const [method, setMethod] = useState<"choose" | "email">("choose");
  const [error, setError] = useState<string | null>(null);

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

  const onGoogle = async () => {
    await continueAsGuest();
    finish("Google sign-in is a demo — continuing as guest");
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
                Google is instant demo access · Email uses a password account with verification.
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

      <Toaster />
    </div>
  );
}
