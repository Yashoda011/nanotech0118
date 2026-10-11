import * as React from "react";
import { Globe, Hexagon } from "lucide-react";
import { cn } from "@/lib/utils";

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
          </div>
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
