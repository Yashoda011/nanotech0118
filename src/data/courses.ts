export interface QuizQ {
  q: string;
  options: string[];
  answer: number;
}

export interface Lesson {
  id: string;
  title: string;
  minutes: number;
  body: string[];
  quiz: QuizQ[];
}

export interface Course {
  id: string;
  title: string;
  tagline: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  accent: string;
  price: number;
  about: string[];
  outcomes: string[];
  lessons: Lesson[];
}

export const COURSES: Course[] = [
  {
    id: "nano-basics",
    title: "Nanotechnology Foundations",
    tagline: "Scale, surface effects and why nano behaves differently.",
    level: "Beginner",
    accent: "#38bdf8",
    price: 0,
    about: [
      "Why does gold turn red at 20 nm? Why is graphene stronger than steel? This course answers those questions from first principles — no physics degree required.",
      "You will tour the 1–100 nm scale, meet the 0D/1D/2D material families with real catalogue examples (quantum dots, carbon nanotubes, graphene, MoS₂), and learn the one idea that explains most nano behaviour: surface atoms rule.",
      "Every lesson links straight into the platform — open any material in Explore, or test the numbers in Simulation when you finish.",
    ],
    outcomes: [
      "Explain the 1–100 nm scale with everyday comparisons",
      "Classify any nanomaterial as 0D, 1D or 2D",
      "Predict how shrinking size changes reactivity and colour",
      "Navigate the Explore catalogue like a researcher",
    ],
    lessons: [
      {
        id: "nb1",
        title: "What counts as nano?",
        minutes: 6,
        body: [
          "The nanoscale spans roughly 1–100 nm. A human hair is ~80,000 nm wide; a graphene sheet is 0.335 nm thick.",
          "At this scale, surface atoms dominate: a 5 nm particle can have over half its atoms on the surface, which drives reactivity, sintering and catalytic behaviour.",
        ],
        quiz: [
          { q: "Which range defines the nanoscale?", options: ["1–100 nm", "1–100 µm", "0.1–1 mm"], answer: 0 },
          { q: "Why are nanoparticles so reactive?", options: ["High surface-to-volume ratio", "They are magnetic", "They are always charged"], answer: 0 },
        ],
      },
      {
        id: "nb2",
        title: "0D, 1D and 2D materials",
        minutes: 8,
        body: [
          "0D: quantum dots and nanoparticles — confined in all directions, size-tuned band gaps.",
          "1D: nanotubes and nanowires — ballistic transport along the axis, ideal for interconnects and battery anodes.",
          "2D: graphene, MoS₂ — single-atomic sheets with extreme in-plane conductivity and strength.",
        ],
        quiz: [
          { q: "Carbon nanotubes are…", options: ["1D materials", "2D materials", "Bulk ceramics"], answer: 0 },
          { q: "Quantum dots tune colour by…", options: ["Particle diameter", "Solution pH", "Container size"], answer: 0 },
        ],
      },
    ],
  },
  {
    id: "nano-char",
    title: "Characterization Essentials",
    tagline: "XRD, Scherrer sizing and electron microscopy in practice.",
    level: "Intermediate",
    accent: "#a78bfa",
    price: 0,
    about: [
      "XRD graphs look cryptic until someone walks you through one peak at a time. This course teaches the two workhorse equations of nano characterization: Scherrer sizing and Bragg diffraction.",
      "You will read real-style diffractograms, convert FWHM broadening into crystallite diameters, and compute interplanar spacings — then verify every number hands-on in Lab Tools.",
      "Assumes the Foundations course (or equivalent): you should know what a crystallite is and why size matters.",
    ],
    outcomes: [
      "Apply D = K·λ / (β·cosθ) to any XRD peak",
      "Compute d-spacing with Bragg's law nλ = 2d·sinθ",
      "Choose correct units (radians vs degrees, nm vs Å)",
      "Validate results in the Lab Tools calculators",
    ],
    lessons: [
      {
        id: "nc1",
        title: "Scherrer crystallite sizing",
        minutes: 7,
        body: [
          "The Scherrer equation D = K·λ / (β·cosθ) converts XRD peak broadening into crystallite size.",
          "Use the FWHM (β) in radians, the Bragg angle θ (half of 2θ), and the X-ray wavelength λ — Cu Kα is 0.154 nm.",
          "Try it live in Lab Tools with FWHM 0.5°, θ 20°, λ 0.154 nm → ≈ 16.9 nm.",
        ],
        quiz: [
          { q: "β in the Scherrer equation is…", options: ["Peak FWHM in radians", "Beam current", "Sample thickness"], answer: 0 },
          { q: "Cu Kα wavelength is…", options: ["0.154 nm", "1.54 nm", "15.4 nm"], answer: 0 },
        ],
      },
    ],
  },
  {
    id: "nano-safety",
    title: "Nano Safety & Scale-up",
    tagline: "Handling, exposure routes and pilot-line thinking.",
    level: "Advanced",
    accent: "#34d399",
    price: 0,
    about: [
      "Great science means nothing without safe hands and a path to production. This course covers the two topics most tutorials skip: handling nanomaterials without harming yourself, and scaling a 10-gram lab success into pilot-line lots.",
      "You will learn exposure routes per material family, suspension-first handling rules, and the scale-up checklist (mixing, heat transfer, revalidation) used by the Business module's batch tracker.",
      "Includes the pilot-line cost thinking behind the Business cost estimator, so lab results translate into quotable products.",
    ],
    outcomes: [
      "Handle dry nanopowders and suspensions safely",
      "List exposure routes for CNT, oxide and Ag families",
      "Plan a lab → pilot scale-up with revalidation gates",
      "Estimate batch cost drivers like a production manager",
    ],
    lessons: [
      {
        id: "ns1",
        title: "Safe handling basics",
        minutes: 6,
        body: [
          "Dry nanopowders aerosolise easily — prefer suspensions, fume-hood handling and P3/FFP3 respiratory protection.",
          "Track exposure routes: inhalation dominates for CNTs and metal oxides; dermal for Ag and TiO₂ formulations.",
        ],
        quiz: [
          { q: "Safest routine form for nanopowders?", options: ["Liquid suspension", "Open dry powder", "Compressed tablets"], answer: 0 },
        ],
      },
      {
        id: "ns2",
        title: "From lab to pilot line",
        minutes: 8,
        body: [
          "Scale-up changes mixing, heat transfer and residence time — revalidate size distributions at each step.",
          "Cost drivers: precursor price, yield, purification and QC metrology. The Business module estimates batch cost.",
        ],
        quiz: [
          { q: "What must be revalidated at each scale-up step?", options: ["Size distribution & yield", "Logo colours", "Office layout"], answer: 0 },
        ],
      },
    ],
  },
  {
    id: "nano-ai",
    title: "AI for Nanomaterials",
    tagline: "Recommenders, predictors and literature mining.",
    level: "Intermediate",
    accent: "#f472b6",
    price: 0,
    about: [
      "Machine learning is reshaping how materials are discovered — but you don't need a PhD in ML to use it. This course shows how recommender-style thinking picks the right nanomaterial for any application.",
      "You will learn weighted-index scoring (the exact method behind the AI Platform's recommender), when to trust a prediction, and how to validate AI suggestions with real simulations.",
      "Finishes with a guided exercise: generate a recommendation in the AI Platform, then confirm it in Simulation.",
    ],
    outcomes: [
      "Score materials against any application profile",
      "Read AI recommendations critically, not blindly",
      "Mine research literature by topic",
      "Close the loop: AI suggestion → simulation validation",
    ],
    lessons: [
      {
        id: "na1",
        title: "Recommending materials with AI",
        minutes: 7,
        body: [
          "Rank candidates by weighted property indices: conductivity for interconnects, band gap for optoelectronics, tensile for composites.",
          "The AI Platform module scores all 12 catalogue materials against your application profile instantly.",
        ],
        quiz: [
          { q: "Best first filter for transparent conductors?", options: ["High conductivity + suitable band gap", "Lowest density only", "Oldest discovery year"], answer: 0 },
        ],
      },
    ],
  },
];

export function getCourse(id: string): Course | undefined {
  return COURSES.find((c) => c.id === id);
}
