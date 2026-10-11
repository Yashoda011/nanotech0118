import * as React from "react";
import { Globe, Hexagon, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

export interface SignIn1Props {
  mode?: "login" | "signup";
  serverError?: string | null;
  hideGoogle?: boolean;
  onSubmit?: (data: { name?: string; email: string; password: string }) => void;
  onGoogle?: () => void;
}

const AVATARS = [
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=64&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=64&q=80",
  "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=64&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=64&q=80",
];

const LOGO_SRC = `${import.meta.env.BASE_URL}nanotech-logo.jpg`;

const SignIn1 = ({ mode = "login", serverError, hideGoogle = false, onSubmit, onGoogle }: SignIn1Props) => {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [forgot, setForgot] = React.useState(false);
  const [fStep, setFStep] = React.useState<1 | 2>(1);
  const [fEmail, setFEmail] = React.useState("");
  const [fCode, setFCode] = React.useState("");
  const [fPass, setFPass] = React.useState("");
  const [fMsg, setFMsg] = React.useState<string | null>(null);
  const [fErr, setFErr] = React.useState<string | null>(null);
  const [fBusy, setFBusy] = React.useState(false);

  const validateEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const handleSignIn = () => {
    if (mode === "signup" && !name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (mode === "signup" && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setError("");
    onSubmit?.({ name: name.trim() || undefined, email, password });
  };

  const shownError = error || serverError;

  const sendResetCode = async () => {
    if (!validateEmail(fEmail)) {
      setFErr("Enter your account email first.");
      return;
    }
    setFErr(null);
    setFBusy(true);
    try {
      const res = await api.forgot(fEmail.trim());
      setFMsg(
        res.mailed
          ? "Code sent to your email — check inbox and spam, then enter it below."
          : res.dev_code
            ? `Demo mode (no SMTP set up): your code is ${res.dev_code}`
            : "If the account exists, a reset code was sent.",
      );
      setFStep(2);
    } catch (e) {
      setFErr(e instanceof Error ? e.message : "Could not send code.");
    } finally {
      setFBusy(false);
    }
  };

  const submitReset = async () => {
    if (fCode.trim().length < 4) {
      setFErr("Enter the 6-digit code.");
      return;
    }
    if (fPass.length < 6) {
      setFErr("New password must be at least 6 characters.");
      return;
    }
    setFErr(null);
    setFBusy(true);
    try {
      await api.resetPassword(fEmail.trim(), fCode.trim(), fPass);
      setFMsg("Password reset! Go back and sign in with the new password.");
      setFStep(1);
      setFCode("");
      setFPass("");
    } catch (e) {
      setFErr(e instanceof Error ? e.message : "Reset failed.");
    } finally {
      setFBusy(false);
    }
  };

  const inputCls =
    "w-full rounded-xl bg-white/10 px-5 py-3 text-sm text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400";

  return (
    <div className="flex w-full flex-col items-center">
      {/* Glass card */}
      <div className="relative z-10 flex w-full flex-col items-center rounded-3xl bg-gradient-to-r from-[#ffffff10] to-[#121212] p-8 shadow-2xl backdrop-blur-sm">
        {/* Logo */}
        <div className="mb-6 flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-white/20 shadow-lg">
          <img
            src={LOGO_SRC}
            alt="NanoSphere logo"
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <Hexagon className="absolute size-5 text-white" />
        </div>
        {/* Title */}
        <h2 className="mb-6 text-center text-2xl font-semibold text-white">
          Nano<span className="grad-text">Sphere</span>
        </h2>
        {/* Form */}
        <div className="flex w-full flex-col gap-4">
          <div className="flex w-full flex-col gap-3">
            {mode === "signup" && (
              <input
                placeholder="Full name"
                type="text"
                value={name}
                className="w-full rounded-xl bg-white/10 px-5 py-3 text-sm text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
              />
            )}
            <input
              placeholder="Email"
              type="email"
              value={email}
              className="w-full rounded-xl bg-white/10 px-5 py-3 text-sm text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
            />
            <input
              placeholder="Password"
              type="password"
              value={password}
              className="w-full rounded-xl bg-white/10 px-5 py-3 text-sm text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
            />
            {shownError && <div className="text-left text-sm text-red-400">{shownError}</div>}
            {mode === "login" && !forgot && (
              <button onClick={() => { setForgot(true); setFStep(1); setFMsg(null); setFErr(null); setFEmail(email); }} className="text-left text-xs text-gray-400 underline-offset-2 hover:text-white hover:underline">
                Forgot password?
              </button>
            )}
          </div>
          {mode === "login" && forgot && (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
                <KeyRound className="size-4" /> Reset password
              </p>
              {fStep === 1 ? (
                <div className="flex flex-col gap-3">
                  <input placeholder="Account email" type="email" value={fEmail} onChange={(e) => setFEmail(e.target.value)} className={inputCls} />
                  <button onClick={() => void sendResetCode()} disabled={fBusy} className="w-full rounded-full bg-white/10 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/20 disabled:opacity-50">
                    {fBusy ? "Sending…" : "Send reset code"}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <input placeholder="6-digit code" type="text" inputMode="numeric" value={fCode} onChange={(e) => setFCode(e.target.value)} className={inputCls} />
                  <input placeholder="New password (min 6)" type="password" value={fPass} onChange={(e) => setFPass(e.target.value)} className={inputCls} />
                  <button onClick={() => void submitReset()} disabled={fBusy} className="w-full rounded-full bg-white/10 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/20 disabled:opacity-50">
                    {fBusy ? "Resetting…" : "Set new password"}
                  </button>
                </div>
              )}
              {fMsg && <div className="mt-2 text-left text-xs text-emerald-300">{fMsg}</div>}
              {fErr && <div className="mt-2 text-left text-xs text-red-400">{fErr}</div>}
              <button onClick={() => setForgot(false)} className="mt-2 text-xs text-gray-400 underline-offset-2 hover:text-white hover:underline">
                Back to sign in
              </button>
            </div>
          )}
          <hr className="opacity-10" />
          <div>
            <button
              onClick={handleSignIn}
              className="mb-3 w-full rounded-full bg-white/10 px-5 py-3 text-sm font-medium text-white shadow transition hover:bg-white/20"
            >
              {mode === "signup" ? "Create account" : "Sign in"}
            </button>
            {/* Google Sign In */}
            {!hideGoogle && (
              <button
                onClick={onGoogle}
                className="mb-2 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#232526] to-[#2d2e30] px-5 py-3 text-sm font-medium text-white shadow transition hover:brightness-110"
              >
                <Globe className="h-5 w-5" />
                Continue with Google
              </button>
            )}
            <div className="mt-2 w-full text-center">
              <span className="text-xs text-gray-400">
                {mode === "signup" ? "Already have an account? " : "Don't have an account? "}
                <a
                  href={mode === "signup" ? "/login" : "/signup"}
                  className="text-white/80 underline hover:text-white"
                >
                  {mode === "signup" ? "Sign in" : "Sign up, it's free!"}
                </a>
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* User count and avatars */}
      <div className="relative z-10 mt-8 flex flex-col items-center text-center">
        <p className="mb-2 text-sm text-gray-400">
          Join <span className="font-medium text-white">thousands</span> of researchers already exploring the nanoscale.
        </p>
        <div className="flex">
          {AVATARS.map((src, i) => (
            <img
              key={i}
              src={src}
              alt="researcher"
              loading="lazy"
              className={cn("h-8 w-8 rounded-full border-2 border-[#181824] object-cover", i > 0 && "-ml-2")}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export { SignIn1 };

export default SignIn1;
