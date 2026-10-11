import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { PromoMolecule } from "@/art";

export function PromoCard() {
  const navigate = useNavigate();
  return (
    <div className="card relative overflow-hidden bg-[radial-gradient(130%_120%_at_90%_10%,#152a4d_0%,#0d1526_50%,#0a1122_100%)]">
      <PromoMolecule className="pointer-events-none absolute -right-4 -top-3 w-44 opacity-70" />
      <div className="relative p-5 pt-16">
        <h3 className="text-[17px] font-bold leading-snug tracking-tight text-ink">
          Innovation starts
          <br />
          at the nanoscale.
        </h3>
        <p className="mt-1.5 text-[12.5px] text-ink-muted">
          Build. Explore. <span className="font-medium text-ink-soft">Make an impact.</span>
        </p>
        <button
          onClick={() => navigate("/explore")}
          aria-label="Start exploring nanomaterials"
          className="grad-btn mt-4 grid size-10 place-items-center rounded-full text-white shadow-lg shadow-indigo-950/60 transition-transform hover:scale-105"
        >
          <ArrowRight className="size-4.5" />
        </button>
      </div>
    </div>
  );
}
