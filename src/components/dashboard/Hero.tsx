import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui";
import { Molecule3D } from "@/components/shell/Molecule3D";
import { useApp } from "@/store/app";

export function Hero() {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const { settings, user } = useApp();

  return (
    <section className="relative overflow-hidden rounded-2xl border border-line bg-[radial-gradient(120%_140%_at_85%_20%,#14234a_0%,#0b1426_45%,#090f1d_100%)]">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -left-16 top-0 size-72 rounded-full bg-blue/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 size-56 rounded-full bg-violet/10 blur-3xl" />
      </div>

      <Molecule3D
        className="pointer-events-none absolute inset-0 hidden w-full opacity-20 md:block xl:inset-auto xl:right-0 xl:top-0 xl:h-full xl:w-[46%] xl:opacity-100"
        reduced={Boolean(reduced)}
      />
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] bg-gradient-to-r from-[#0b1426] via-transparent to-transparent xl:block" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 max-w-[540px] px-6 py-9 sm:px-9 sm:py-11"
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-blue/30 bg-blue/12 px-3.5 py-1.5 text-[12.5px] font-medium text-blue-soft">
          Welcome Back, {user?.name ?? settings.name} <span aria-hidden="true">👋</span>
        </span>

        <h1 className="mt-4 text-[30px] font-bold leading-[1.15] tracking-tight text-ink sm:text-[38px]">
          Explore the Power of
          <br />
          <span className="grad-text">Nanotechnology</span>
        </h1>

        <p className="mt-4 max-w-md text-[14.5px] leading-relaxed text-ink-muted">
          Discover, simulate and innovate with nano-scale solutions for a smarter tomorrow.
        </p>

        <Button variant="gradient" size="lg" className="mt-6 rounded-full pl-6 pr-5" onClick={() => navigate("/explore")}>
          Start Exploring <ArrowRight className="size-4" />
        </Button>
      </motion.div>
    </section>
  );
}
