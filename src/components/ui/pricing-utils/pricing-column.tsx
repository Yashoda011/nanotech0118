import * as React from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export interface PricingCta {
  variant: "glow" | "default" | "glow-brand";
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface PricingColumnProps {
  name: string;
  icon?: React.ReactNode;
  description?: string;
  price: number;
  priceSuffix?: string;
  originalPrice?: number;
  promotionText?: string;
  priceNote?: string;
  cta: PricingCta;
  features: string[];
  variant?: "default" | "glow" | "glow-brand";
  className?: string;
}

const ctaClass: Record<PricingCta["variant"], string> = {
  glow: "btn-glow inline-flex w-full items-center justify-center whitespace-nowrap rounded-full px-5 py-3 text-sm font-medium text-white",
  "glow-brand": "btn-glow-brand inline-flex w-full items-center justify-center whitespace-nowrap rounded-full px-5 py-3 text-sm font-semibold",
  default:
    "inline-flex w-full items-center justify-center whitespace-nowrap rounded-full border border-input bg-background px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
};

const cardClass: Record<NonNullable<PricingColumnProps["variant"]>, string> = {
  default: "border-line bg-panel/60",
  glow: "border-blue/40 bg-blue/8 shadow-xl",
  "glow-brand": "border-brand/50 bg-brand/5 shadow-xl",
};

export function PricingColumn({
  name,
  icon,
  description,
  price,
  priceSuffix = "/mo",
  originalPrice,
  promotionText,
  priceNote,
  cta,
  features,
  variant = "default",
  className,
}: PricingColumnProps) {
  const ctaProps = {
    className: ctaClass[cta.variant],
    onClick: cta.onClick,
  };
  return (
    <div className={cn("flex flex-col rounded-3xl border p-6 sm:p-8", cardClass[variant], className)}>
      <div className="flex items-center gap-2.5">
        {icon && <span className="grid size-9 place-items-center rounded-xl bg-white/5">{icon}</span>}
        <h3 className="text-lg font-semibold text-ink">{name}</h3>
      </div>
      {description && <p className="mt-2 text-sm leading-relaxed text-ink-muted">{description}</p>}
      <div className="mt-5 flex items-end gap-2">
        {promotionText ? (
          <span className="rounded-full bg-mint/15 px-2.5 py-0.5 text-[11.5px] font-bold text-mint">{promotionText}</span>
        ) : null}
        {originalPrice !== undefined && (
          <span className="text-lg text-ink-muted line-through">${originalPrice}</span>
        )}
        <span className="text-4xl font-bold tracking-tight text-ink">
          {price === 0 ? "Free" : `$${price}`}
        </span>
        {price > 0 && <span className="pb-1 text-sm text-ink-muted">{priceSuffix}</span>}
      </div>
      {priceNote && <p className="mt-2 text-[12.5px] text-ink-muted">{priceNote}</p>}
      <div className="mt-6">
        {cta.href && !cta.onClick ? (
          <a href={cta.href} className={ctaProps.className}>
            {cta.label}
          </a>
        ) : (
          <button type="button" {...ctaProps}>
            {cta.label}
          </button>
        )}
      </div>
      {features.length > 0 && (
        <ul className="mt-6 space-y-2.5 border-t border-line pt-5">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-[13px] text-ink-soft">
              <Check className="mt-0.5 size-4 shrink-0 text-mint" />
              {f}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
