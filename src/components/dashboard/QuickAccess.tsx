import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Microscope, Play, BarChart3, Folder } from "lucide-react";

const CARDS = [
  {
    title: "Find Nanomaterials",
    description: "Search & explore properties of nano materials",
    icon: Microscope,
    color: "bg-mint text-white shadow-[0_10px_24px_-12px_rgba(52,211,153,0.9)]",
    to: "/explore",
  },
  {
    title: "Run Simulations",
    description: "Test and predict behaviour at the nanoscale",
    icon: Play,
    color: "bg-blue text-white shadow-[0_10px_24px_-12px_rgba(59,130,246,0.9)]",
    to: "/simulation",
  },
  {
    title: "Analyze Data",
    description: "Visualize results with interactive charts",
    icon: BarChart3,
    color: "bg-violet text-white shadow-[0_10px_24px_-12px_rgba(139,92,246,0.9)]",
    to: "/analysis",
  },
  {
    title: "Manage Projects",
    description: "Keep your research organized",
    icon: Folder,
    color: "bg-gold text-white shadow-[0_10px_24px_-12px_rgba(251,191,36,0.7)]",
    to: "/projects",
  },
];

export function QuickAccess() {
  const navigate = useNavigate();
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {CARDS.map((card, i) => (
        <motion.button
          key={card.title}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 * i, ease: [0.22, 1, 0.36, 1] }}
          onClick={() => navigate(card.to)}
          className="card card-lift flex items-start gap-4 p-5 text-left"
        >
          <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${card.color}`}>
            <card.icon className="size-5" strokeWidth={2} />
          </span>
          <span className="min-w-0">
            <span className="block text-[14.5px] font-semibold tracking-tight text-ink">{card.title}</span>
            <span className="mt-1 block text-[12.5px] leading-relaxed text-ink-muted">{card.description}</span>
          </span>
        </motion.button>
      ))}
    </div>
  );
}
