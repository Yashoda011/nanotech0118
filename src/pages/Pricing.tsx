import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shell/AppLayout";
import { Button, Badge } from "@/components/ui";
import Pricing from "@/components/ui/pricing";
import { ProCheckoutModal, type CheckoutPlan } from "@/components/billing/ProCheckoutModal";
import { useApp } from "@/store/app";

export default function PricingPage() {
  const { isPro, plan, pushToast, refreshBilling } = useApp();
  const navigate = useNavigate();
  const [checkout, setCheckout] = useState<CheckoutPlan | null>(null);

  const cancel = async () => {
    try {
      const { api } = await import("@/lib/api");
      await api.cancelPro();
      await refreshBilling();
      pushToast("Subscription cancelled — back to Starter", "info");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Cancel failed", "info");
    }
  };

  return (
    <div className="mx-auto max-w-[1100px]">
      <PageHeader
        title="Pricing"
        subtitle={
          plan === "starter"
            ? "Start free — Pro and Team unlock only after payment."
            : `You are on ${plan === "team" ? "Pro Team" : "Pro"} — thank you!`
        }
        actions={
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="size-4" /> Back
          </Button>
        }
      />

      {isPro && (
        <p className="mb-4 flex items-center gap-2 text-[13px] text-ink-soft">
          <Badge tone="blue">Current: {plan === "team" ? "Pro Team $999" : "Pro $199"}</Badge>
        </p>
      )}

      <Pricing
        title="Simple, transparent pricing."
        description="Start free. Paid plans unlock immediately after checkout — enforced server-side."
        plans={[
          {
            name: "Starter",
            description: "For everyone starting out with nanomaterials",
            price: 0,
            priceNote: "Free forever. 5 simulations/day.",
            cta:
              plan === "starter"
                ? { variant: "default", label: "Current plan", onClick: () => pushToast("You're on Starter", "info") }
                : { variant: "default", label: "Downgrade to Starter", onClick: () => void cancel() },
            features: ["5 simulations / day", "Community datasets", "6 lab calculators", "4 free courses (limited offer)"],
            variant: "default",
          },
          {
            name: "Pro",
            description: "For researchers running serious simulation workloads",
            price: 199,
            priceNote: "One-time payment. Lifetime access.",
            cta:
              plan === "pro"
                ? { variant: "glow-brand", label: "Current plan", onClick: () => pushToast("Pro is active", "success") }
                : plan === "team"
                  ? { variant: "glow-brand", label: "Included in Team", onClick: () => pushToast("Your Team plan already includes Pro", "info") }
                  : { variant: "glow-brand", label: "Buy Pro — $199", onClick: () => setCheckout("pro") },
            features: ["Unlimited simulations", "5000-iteration deep runs", "Private datasets & sharing", "Advanced property models"],
            variant: "glow-brand",
          },
          {
            name: "Pro Team",
            description: "For labs and pilot lines working together",
            price: 999,
            priceNote: "One-time payment. 5 seats included.",
            cta:
              plan === "team"
                ? { variant: "glow", label: "Current plan", onClick: () => pushToast("Team is active", "success") }
                : { variant: "glow", label: "Buy Team — $999", onClick: () => setCheckout("team") },
            features: ["Everything in Pro, for your entire team", "Shared workspace & roles", "Priority support"],
            variant: "glow",
          },
        ]}
      />

      <ProCheckoutModal open={checkout !== null} onClose={() => setCheckout(null)} planKind={checkout ?? "pro"} />
    </div>
  );
}
