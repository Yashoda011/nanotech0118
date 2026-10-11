import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button, Modal } from "@/components/ui";

type DocKey = "privacy" | "terms" | "help";

const DOCS: Record<DocKey, { title: string; body: string[] }> = {
  privacy: {
    title: "Privacy Policy",
    body: [
      "Your workspace — projects, tasks, datasets, settings, saved materials, enrollments and activity — is stored in your NanoSphere account on our FastAPI + Postgres backend, plus a local browser cache (nanosphere: prefix) so the app works offline.",
      "Passwords are bcrypt-hashed and sessions use signed JWTs that expire after 24 hours. Verification codes expire after 15 minutes. Uploads are limited to data files (.csv, .tsv, .json, .txt, max 10 MB).",
      "Your rights: export your workspace anytime (Settings → Privacy → Export), reset demo data to reseed, or ask for full account erasure via Contact — include your account email.",
      "We collect no advertising analytics in this build. Anonymous counts (e.g. simulations today) enforce plan quotas only.",
    ],
  },
  terms: {
    title: "Terms of Use",
    body: [
      "NanoSphere is a working demo workspace. Catalogue values, indices and simulation curves are illustrative models — never use them for engineering, medical or safety decisions.",
      "Plans: Starter is free (5 simulations/day). Pro ($199) and Team ($999) unlock immediately after checkout and are enforced server-side; cancel anytime and access drops at once. Checkout is a demo flow: cards are shape-validated only, never charged or stored.",
      "Acceptable use: no scraping, credential sharing, quota bypassing or unlawful content. Abuse may lead to throttling or suspension after a warning.",
      "Guests may explore but cannot enroll in courses, create projects or buy plans — those need an email account.",
    ],
  },
  help: {
    title: "Help Center",
    body: [
      "Dashboard quick-access cards jump into Explore, Simulation, Analysis and Projects. The top search bar jumps to any material, article or action — arrow keys navigate, Enter opens.",
      "Stuck on empty screens? Every empty state contains the button that creates the first item.",
      "Full guides live in Documents; discussions in Community; tickets in Contact. Reset anytime via Settings → Privacy.",
    ],
  },
};

const HELP_LINKS = [
  { label: "Open Documents", to: "/docs" },
  { label: "Ask the Community", to: "/community" },
  { label: "Contact support", to: "/contact" },
  { label: "Verify my email", to: "/settings" },
];

export function Footer() {
  const [doc, setDoc] = useState<DocKey | null>(null);
  const navigate = useNavigate();

  const go = (to: string) => {
    setDoc(null);
    navigate(to);
  };

  return (
    <>
      <footer className="mt-10 border-t border-line px-4 py-7 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-3">
            <img
              src={`${import.meta.env.BASE_URL}nanotech-logo.jpg`}
              alt="NanoTech logo"
              className="size-7 rounded-lg bg-white object-cover ring-1 ring-white/20"
            />
            <span className="text-sm font-semibold tracking-tight text-ink">NanoSphere</span>
            <span className="text-[12.5px] text-ink-muted">© {new Date().getFullYear()} NanoSphere. All rights reserved.</span>
          </div>
          <nav className="flex items-center gap-6" aria-label="Footer">
            <button onClick={() => setDoc("privacy")} className="text-[12.5px] text-ink-muted transition hover:text-ink">
              Privacy
            </button>
            <button onClick={() => setDoc("terms")} className="text-[12.5px] text-ink-muted transition hover:text-ink">
              Terms
            </button>
            <button onClick={() => setDoc("help")} className="text-[12.5px] text-ink-muted transition hover:text-ink">
              Help
            </button>
            <button onClick={() => navigate("/contact")} className="text-[12.5px] text-ink-muted transition hover:text-ink">
              Contact
            </button>
          </nav>
        </div>
      </footer>

      <Modal
        open={doc !== null}
        onClose={() => setDoc(null)}
        title={doc ? DOCS[doc].title : ""}
        footer={<Button onClick={() => setDoc(null)}>Got it</Button>}
      >
        <div className="space-y-3">
          {(doc ? DOCS[doc].body : []).map((p, i) => (
            <p key={i} className="text-[13.5px] leading-relaxed text-ink-soft">
              {p}
            </p>
          ))}
          {doc === "help" && (
            <div className="grid gap-2 pt-1 sm:grid-cols-2">
              {HELP_LINKS.map((l) => (
                <button
                  key={l.to + l.label}
                  onClick={() => go(l.to)}
                  className="flex items-center justify-between gap-2 rounded-xl border border-line px-4 py-2.5 text-left text-[13px] font-medium text-ink-soft transition-colors hover:border-blue-soft/40 hover:text-ink"
                >
                  {l.label}
                  <ArrowRight className="size-4" />
                </button>
              ))}
            </div>
          )}
          {doc === "privacy" && (
            <div className="flex flex-wrap gap-2 pt-1">
              <Button variant="secondary" size="sm" onClick={() => go("/contact")}>
                Request data erasure
              </Button>
              <Button variant="ghost" size="sm" onClick={() => go("/settings")}>
                Export my data
              </Button>
            </div>
          )}
          {doc === "terms" && (
            <div className="flex flex-wrap gap-2 pt-1">
              <Button variant="secondary" size="sm" onClick={() => go("/pricing")}>
                View plans
              </Button>
              <Button variant="ghost" size="sm" onClick={() => go("/contact")}>
                Report abuse
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
