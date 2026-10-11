import { User, Users, FlaskConical } from "lucide-react";

import { cn } from "@/lib/utils";

import { PricingColumn, PricingColumnProps } from "@/components/ui/pricing-utils/pricing-column";
import { Section } from "@/components/ui/pricing-utils/section";

interface PricingProps {
  title?: string | false;
  description?: string | false;
  plans?: PricingColumnProps[] | false;
  className?: string;
}

const DEFAULT_PRICING_PLANS: PricingColumnProps[] = [
  {
    name: "Starter",
    icon: <FlaskConical className="size-4" />,
    description: "For everyone starting out with nanomaterials",
    price: 0,
    priceNote: "Free forever. 5 simulations/day.",
    cta: {
      variant: "default",
      label: "Stay on Starter",
      href: "/settings",
    },
    features: ["5 simulations / day", "Community datasets", "6 lab calculators", "4 free courses (limited offer)"],
    variant: "default",
  },
  {
    name: "Pro",
    icon: <User className="size-4" />,
    description: "For researchers running serious simulation workloads",
    price: 199,
    priceNote: "One-time payment. Unlocks only after payment.",
    cta: {
      variant: "glow-brand",
      label: "Upgrade to Pro",
      href: "/settings",
    },
    features: [
      "Unlimited simulations",
      "5000-iteration deep runs",
      "Private datasets & sharing",
      "Advanced property models",
    ],
    variant: "glow-brand",
  },
  {
    name: "Pro Team",
    icon: <Users className="size-4" />,
    description: "For labs and pilot lines working together",
    price: 999,
    priceNote: "One-time payment. 5 seats included.",
    cta: {
      variant: "glow",
      label: "Contact sales",
      href: "mailto:sales@nanosphere.io",
    },
    features: ["Everything in Pro, for your entire team", "Shared workspace & roles"],
    variant: "glow",
  },
];

export default function Pricing({
  title = "Simple, transparent pricing.",
  description = "Start free. Upgrade to Pro only when your simulations need it — unlocking happens right after payment.",
  plans = DEFAULT_PRICING_PLANS,
  className = "",
}: PricingProps) {
  return (
    <Section className={cn(className)}>
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-8">
        {(title || description) && (
          <div className="flex flex-col items-center gap-3 px-4 text-center">
            {title && (
              <h2 className="text-2xl leading-tight font-semibold text-ink sm:text-3xl sm:leading-tight">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-md text-muted-foreground max-w-[600px] font-medium">
                {description}
              </p>
            )}
          </div>
        )}
        {plans !== false && plans.length > 0 && (
          <div className="mx-auto grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <PricingColumn
                key={plan.name}
                name={plan.name}
                icon={plan.icon}
                description={plan.description}
                price={plan.price}
                priceSuffix={plan.priceSuffix}
                originalPrice={plan.originalPrice}
                promotionText={plan.promotionText}
                priceNote={plan.priceNote}
                cta={plan.cta}
                features={plan.features}
                variant={plan.variant}
                className={plan.className}
              />
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}
