import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Logo } from "@/components/shell/Sidebar";
import { Toaster } from "@/components/ui";
import { SignIn1 } from "@/components/ui/modern-stunning-sign-in";
import { useApp } from "@/store/app";

export default function AuthPage({ mode }: { mode: "login" | "signup" }) {
  const { user, login, signup, continueAsGuest, pushToast } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/";

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

          <SignIn1 mode={mode} serverError={error} onSubmit={onSubmit} onGoogle={onGoogle} />
        </motion.div>
      </main>

      <Toaster />
    </div>
  );
}
