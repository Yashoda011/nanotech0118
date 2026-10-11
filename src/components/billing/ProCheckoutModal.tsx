import { useState } from "react";
import { CreditCard, Crown, Users } from "lucide-react";
import { Button, Field, Input, Modal } from "@/components/ui";
import { api } from "@/lib/api";
import { useApp } from "@/store/app";

export type CheckoutPlan = "pro" | "team";

const PLAN_META: Record<CheckoutPlan, { title: string; amount: string; cents: number; perks: string[] }> = {
  pro: {
    title: "Upgrade to NanoSphere Pro",
    amount: "$199",
    cents: 19900,
    perks: [
      "Unlimited simulations (Starter: 5/day)",
      "5000-iteration deep runs + priority queue",
      "Private datasets & sharing",
      "Advanced property models",
    ],
  },
  team: {
    title: "Upgrade to NanoSphere Team",
    amount: "$999",
    cents: 99900,
    perks: [
      "Everything in Pro, for your entire team",
      "5 seats included",
      "Shared workspace & roles",
      "Priority support",
    ],
  },
};

export function ProCheckoutModal({
  open,
  onClose,
  planKind = "pro",
}: {
  open: boolean;
  onClose: () => void;
  planKind?: CheckoutPlan;
}) {
  const { pushToast, refreshBilling } = useApp();
  const [card, setCard] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const meta = PLAN_META[planKind];

  const pay = async () => {
    const digits = card.replace(/\D/g, "");
    if (digits.length < 12) {
      setError("Enter a valid card number (12+ digits, demo only).");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const res =
        planKind === "team" ? await api.checkoutTeam(digits.slice(-4)) : await api.checkoutPro(digits.slice(-4));
      if (res.is_pro) {
        await refreshBilling();
        pushToast(`Payment accepted — ${planKind === "team" ? "Team" : "Pro"} unlocked!`, "success");
        setCard("");
        onClose();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed — try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={meta.title}
      description={`${meta.amount}.00 · demo checkout — card is shape-validated only, never charged or stored.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="gradient" onClick={() => void pay()} disabled={busy}>
            <CreditCard className="size-4" /> {busy ? "Processing…" : `Pay ${meta.amount} & unlock`}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-gold/30 bg-gold/8 px-4 py-3 text-[13px] text-ink-soft">
          <p className="flex items-center gap-2 font-semibold text-ink">
            {planKind === "team" ? <Users className="size-4 text-gold" /> : <Crown className="size-4 text-gold" />}
            {planKind === "team" ? "Team unlocks" : "Pro unlocks"}
          </p>
          <ul className="mt-1.5 space-y-1 text-[12.5px] text-ink-muted">
            {meta.perks.map((p) => (
              <li key={p}>· {p}</li>
            ))}
          </ul>
        </div>
        <Field label="Card number (demo)">
          <Input value={card} onChange={(e) => setCard(e.target.value)} placeholder="4242 4242 4242 4242" inputMode="numeric" />
        </Field>
        {error && (
          <p role="alert" className="rounded-xl border border-rose/30 bg-rose/10 px-3.5 py-2.5 text-[13px] text-rose">{error}</p>
        )}
      </div>
    </Modal>
  );
}
