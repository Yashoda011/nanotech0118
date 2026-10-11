import { useEffect, useState, type ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { MailCheck, X } from "lucide-react";
import { Sidebar, MobileDrawer } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";
import { Footer } from "@/components/shell/Footer";
import { Toaster, Button, Input } from "@/components/ui";
import { useApp } from "@/store/app";
import { api } from "@/lib/api";

function VerifyBanner() {
  const { user, backendOnline, syncFromBackend, pushToast } = useApp();
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  if (!user || user.guest || user.emailVerified || dismissed) return null;

  const send = async () => {
    setBusy(true);
    try {
      const res = await api.requestCode();
      if (res.verified) {
        await syncFromBackend();
        return;
      }
      setExpanded(true);
      pushToast(
        res.dev_code ? `Demo mailbox: your code is ${res.dev_code}` : "Verification code sent to your email",
        "success",
      );
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Could not send code", "info");
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (code.trim().length < 4) return;
    setBusy(true);
    try {
      await api.confirmCode(code.trim());
      await syncFromBackend();
      pushToast("Email verified — welcome aboard!", "success");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Invalid code", "info");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border-b border-gold/30 bg-gold/8 px-4 py-3 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-gold/15 text-gold">
          <MailCheck className="size-4" />
        </span>
        <p className="min-w-0 flex-1 text-[13px] text-ink-soft">
          <span className="font-semibold text-ink">Verify your email</span> ({user.email}) to unlock courses and Pro checkout.
          {!backendOnline && " Reconnect to reach the verification service."}
        </p>
        {!expanded ? (
          <Button variant="secondary" size="sm" onClick={() => void send()} disabled={busy || !backendOnline}>
            {busy ? "Sending…" : "Send code"}
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="6-digit code" inputMode="numeric" className="h-9 w-36" aria-label="Verification code" />
            <Button variant="gradient" size="sm" onClick={() => void confirm()} disabled={busy}>Verify</Button>
          </div>
        )}
        <button onClick={() => setDismissed(true)} aria-label="Dismiss" className="grid size-8 place-items-center rounded-lg text-ink-muted hover:text-ink">
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { settings, user } = useApp();
  const compact = settings.density === "compact";

  // Apply color mode + accent to <html> so CSS vars switch instantly.
  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.dataset.accent = settings.accent;
    document.documentElement.style.colorScheme = settings.theme === "light" ? "light" : "dark";
  }, [settings.theme, settings.accent]);

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <div className="min-h-screen bg-void">
      <Sidebar />
      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="lg:pl-64">
        <Topbar onOpenMenu={() => setMobileOpen(true)} />
        <VerifyBanner />
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className={compact ? "px-4 py-4 sm:px-6 lg:px-8" : "px-4 py-6 sm:px-6 lg:px-8"}
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>
        <Footer />
      </div>

      <Toaster />
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}

export const staggerParent = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

export const staggerChild = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
};
