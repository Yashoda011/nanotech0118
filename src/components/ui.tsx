import {
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, Check, Info, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/store/app";

/* ---------------------------------- Button --------------------------------- */

type ButtonVariant = "gradient" | "primary" | "secondary" | "ghost" | "danger" | "soft";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium whitespace-nowrap transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]";

const buttonVariants: Record<ButtonVariant, string> = {
  gradient: "grad-btn text-white hover:brightness-110 shadow-lg shadow-indigo-950/50",
  primary: "bg-blue text-white hover:bg-blue-soft",
  secondary: "border border-line bg-elevated/60 text-ink hover:border-blue-soft/40 hover:bg-elevated",
  ghost: "text-ink-soft hover:bg-white/5 hover:text-ink",
  danger: "bg-rose/90 text-white hover:bg-rose",
  soft: "bg-blue/15 text-blue-soft border border-blue/30 hover:bg-blue/25",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px] rounded-lg",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-[15px]",
  icon: "size-10",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({ variant = "primary", size = "md", className, ...props }: ButtonProps) {
  return <button className={cn(buttonBase, buttonVariants[variant], buttonSizes[size], className)} {...props} />;
}

/* ----------------------------------- Card ---------------------------------- */

export function Card({ className, children, lift, ...rest }: { className?: string; children?: ReactNode; lift?: boolean } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("card", lift && "card-lift", className)} {...rest}>
      {children}
    </div>
  );
}

export function SectionHeader({
  title,
  action,
  className,
}: {
  title: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-3 px-5 pt-4 pb-3", className)}>
      <h3 className="text-[15px] font-semibold tracking-tight text-ink">{title}</h3>
      {action}
    </div>
  );
}

/* ----------------------------------- Badge --------------------------------- */

export type BadgeTone = "neutral" | "blue" | "green" | "amber" | "violet" | "rose" | "cyan";

const badgeTones: Record<BadgeTone, string> = {
  neutral: "bg-white/6 text-ink-soft border-white/10",
  blue: "bg-blue/12 text-blue-soft border-blue/30",
  green: "bg-mint/12 text-mint border-mint/30",
  amber: "bg-gold/12 text-gold border-gold/30",
  violet: "bg-violet/12 text-violet border-violet/30",
  rose: "bg-rose/12 text-rose border-rose/30",
  cyan: "bg-cyan/12 text-cyan border-cyan/30",
};

export function Badge({ tone = "neutral", className, children }: { tone?: BadgeTone; className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide",
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function categoryTone(category: string): BadgeTone {
  switch (category) {
    case "2D Material":
      return "cyan";
    case "1D Material":
      return "blue";
    case "0D Material":
      return "violet";
    case "Metallic":
      return "green";
    case "Oxide":
      return "amber";
    default:
      return "rose";
  }
}

/* ---------------------------------- Inputs --------------------------------- */

const fieldClass =
  "w-full rounded-xl border border-line bg-panel/80 px-3.5 text-sm text-ink placeholder:text-ink-muted transition-colors focus:border-blue-soft/60 focus:outline-none";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldClass, "h-10", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldClass, "min-h-24 py-2.5 leading-relaxed", className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(fieldClass, "h-10 cursor-pointer appearance-none pr-9", className)} {...props}>
      {children}
    </select>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-ink-soft">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-muted">{hint}</span>}
    </label>
  );
}

/* ----------------------------------- Modal --------------------------------- */

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => panelRef.current?.focus(), 30);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      window.clearTimeout(t);
    };
  }, [open, onClose]);

  const width = size === "lg" ? "max-w-3xl" : size === "sm" ? "max-w-md" : "max-w-xl";

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={cn(
              "relative w-full rounded-2xl border border-line bg-card shadow-2xl shadow-black/60 outline-none",
              width,
            )}
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
              <div>
                <h2 id={titleId} className="text-base font-semibold tracking-tight text-ink">
                  {title}
                </h2>
                {description && <p className="mt-1 text-[13px] text-ink-muted">{description}</p>}
              </div>
              <button
                onClick={onClose}
                aria-label="Close dialog"
                className="grid size-8 shrink-0 place-items-center rounded-lg text-ink-muted transition hover:bg-white/6 hover:text-ink"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto px-5 py-4 scrollbar-thin">{children}</div>
            {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-4">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* ---------------------------------- Dropdown -------------------------------- */

export function Dropdown({
  trigger,
  children,
  align = "end",
  panelClassName,
}: {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "start" | "end";
  panelClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={wrapRef}>
      {trigger({ open, toggle: () => setOpen((v) => !v) })}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className={cn(
              "absolute z-50 mt-2 min-w-56 overflow-hidden rounded-xl border border-line bg-elevated p-1.5 shadow-2xl shadow-black/60",
              align === "end" ? "right-0" : "left-0",
              panelClassName,
            )}
          >
            {children(() => setOpen(false))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DropdownItem({
  children,
  onClick,
  icon: Icon,
  danger,
}: {
  children: ReactNode;
  onClick?: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] transition-colors",
        danger ? "text-rose hover:bg-rose/12" : "text-ink-soft hover:bg-white/6 hover:text-ink",
      )}
    >
      {Icon && <Icon className="size-4 opacity-80" />}
      {children}
    </button>
  );
}

/* ---------------------------------- Feedback -------------------------------- */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-lg", className)} />;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line px-6 py-14 text-center">
      <div className="grid size-14 place-items-center rounded-2xl border border-line bg-panel text-blue-soft">
        <Icon className="size-6" strokeWidth={1.6} />
      </div>
      <p className="mt-4 text-[15px] font-semibold text-ink">{title}</p>
      <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-ink-muted">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ProgressBar({ value, tone = "blue" }: { value: number; tone?: "blue" | "violet" | "green" }) {
  const color = tone === "violet" ? "bg-violet" : tone === "green" ? "bg-mint" : "bg-blue";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-panel" role="progressbar" aria-valuenow={Math.round(value)}>
      <motion.div
        className={cn("h-full rounded-full", color)}
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        transition={{ ease: "easeOut", duration: 0.4 }}
      />
    </div>
  );
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex flex-wrap gap-1 rounded-xl border border-line bg-panel/70 p-1", className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "relative rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
            value === opt.value ? "text-white" : "text-ink-muted hover:text-ink-soft",
          )}
        >
          {value === opt.value && (
            <motion.span layoutId={`seg-${options.map((o) => o.value).join("")}`} className="absolute inset-0 rounded-lg bg-blue/80" transition={{ type: "spring", stiffness: 400, damping: 32 }} />
          )}
          <span className="relative z-10">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}

/* ----------------------------------- Toaster -------------------------------- */

export function Toaster() {
  const { toasts, dismissToast } = useApp();
  return createPortal(
    <div className="pointer-events-none fixed bottom-5 right-5 z-[90] flex w-[min(360px,calc(100vw-2.5rem))] flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, x: 40, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            className="pointer-events-auto flex items-start gap-3 rounded-xl border border-line bg-elevated px-4 py-3 shadow-2xl shadow-black/60"
          >
            <span
              className={cn(
                "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full",
                t.tone === "success" ? "bg-mint/20 text-mint" : t.tone === "info" ? "bg-blue/20 text-blue-soft" : "bg-violet/20 text-violet",
              )}
            >
              {t.tone === "success" ? <Check className="size-3" /> : <Info className="size-3" />}
            </span>
            <p className="flex-1 text-[13px] leading-snug text-ink">{t.message}</p>
            <button
              onClick={() => dismissToast(t.id)}
              aria-label="Dismiss notification"
              className="text-ink-muted transition hover:text-ink"
            >
              <X className="size-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
