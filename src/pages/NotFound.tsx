import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui";
import { PromoMolecule } from "@/art";

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center pt-16 text-center">
      <PromoMolecule className="w-56 opacity-80" />
      <p className="mt-4 text-[13px] font-semibold tracking-[0.2em] text-blue-soft">404</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink">This path is outside the lattice</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-muted">
        The page you were looking for does not exist in the NanoSphere workspace. Head back to the dashboard and keep
        exploring.
      </p>
      <Link to="/" className="mt-6">
        <Button variant="gradient">
          <Compass className="size-4" /> Back to dashboard
        </Button>
      </Link>
    </div>
  );
}
