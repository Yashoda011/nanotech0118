export type ResearchArt = "energy" | "graphene" | "medicine" | "future" | "quantum" | "coating";

export interface Article {
  id: string;
  title: string;
  source: string;
  date: string;
  readMinutes: number;
  art: ResearchArt;
  accent: string;
  excerpt: string;
  tags: string[];
  body: string[];
}

export const ARTICLES: Article[] = [
  {
    id: "nano-renewable-energy",
    title: "The Role of Nanotechnology in Renewable Energy",
    source: "Nature Energy",
    date: "2025-04-12",
    readMinutes: 5,
    art: "energy",
    accent: "#34d399",
    excerpt:
      "Nanostructured catalysts and quantum-confined absorbers are pushing solar cells past their theoretical ceiling and slashing the cost of green hydrogen.",
    tags: ["Energy", "Photovoltaics", "Catalysis"],
    body: [
      "Perovskite quantum dots smaller than 10 nm can be tuned to absorb precise slices of the solar spectrum, and when stacked in tandem with silicon they push conversion efficiency beyond 33% in laboratory cells.",
      "At the catalyst electrode, single-atom platinum sites on nitrogen-doped carbon reduce the overpotential of the hydrogen evolution reaction by roughly 40% compared with conventional nanoparticle loadings — using an order of magnitude less precious metal.",
      "The remaining bottleneck is durability: nanoscale interfaces degrade faster under real-world cycling, so encapsulation and self-healing coatings are now the focus of most industrial roadmaps.",
    ],
  },
  {
    id: "graphene-electronics",
    title: "Applications of Graphene in Modern Electronics",
    source: "Science Advances",
    date: "2025-04-10",
    readMinutes: 4,
    art: "graphene",
    accent: "#38bdf8",
    excerpt:
      "From radio-frequency transistors to transparent conductive films, graphene has quietly moved from laboratory curiosity to production line.",
    tags: ["Graphene", "Electronics", "2D Materials"],
    body: [
      "Graphene's room-temperature carrier mobility exceeds 200,000 cm²/V·s, which makes it attractive for high-frequency amplifiers where silicon hits a wall near 100 GHz.",
      "Roll-to-roll transferred films now reach sheet resistances below 30 Ω/sq at 90% optical transparency, displacing indium tin oxide in touch panels and OLED lighting.",
      "The absence of a band gap remains the central limitation for digital logic — a problem researchers are addressing with nanoribbon patterning and dual-gated bilayer structures.",
    ],
  },
  {
    id: "nanoparticles-medicine",
    title: "Nanoparticles in Medicine: A New Era of Treatment",
    source: "The Lancet Nanomedicine",
    date: "2025-04-08",
    readMinutes: 6,
    art: "medicine",
    accent: "#f472b6",
    excerpt:
      "Lipid nanoparticles and magnetic carriers are making targeted drug delivery routine — reshaping oncology, vaccines and gene therapy.",
    tags: ["Medicine", "Drug Delivery", "Biocompatibility"],
    body: [
      "Lipid nanoparticles less than 100 nm exploit the enhanced permeability and retention effect to accumulate preferentially in tumour tissue, cutting systemic toxicity for chemotherapeutics.",
      "Superparamagnetic iron oxide cores allow both imaging and hyperthermia in a single injectable carrier, so clinicians can verify targeting before switching on the alternating magnetic field.",
      "Regulatory agencies now require explicit nanoscale characterisation — hydrodynamic diameter, zeta potential and protein corona behaviour — before first-in-human trials can proceed.",
    ],
  },
  {
    id: "future-trends-nanotech",
    title: "Future Trends in Nanotechnology",
    source: "ACS Nano",
    date: "2025-04-05",
    readMinutes: 4,
    art: "future",
    accent: "#a78bfa",
    excerpt:
      "Autonomous nanolabs, molecular machines and atomically precise manufacturing are moving from thought experiments to funded programmes.",
    tags: ["Trends", "Manufacturing", "Robotics"],
    body: [
      "DNA origami scaffolds now position individual catalytic nanoparticles with sub-nanometre precision, enabling reaction pathways that bulk catalysts cannot reproduce.",
      "Machine-learning force fields let researchers screen millions of candidate nanostructures per day, cutting the cost of in-silico discovery by two orders of magnitude.",
      "The next decade will be defined less by new nanomaterials than by scalable, defect-tolerant assembly of the ones we already understand.",
    ],
  },
  {
    id: "quantum-dot-displays",
    title: "Quantum Dot Displays Reach 8K Mainstream",
    source: "Advanced Materials",
    date: "2025-04-02",
    readMinutes: 5,
    art: "quantum",
    accent: "#818cf8",
    excerpt:
      "Cadmium-free QLED panels now cover 99% of the DCI-P3 gamut, bringing laboratory colour science into living rooms.",
    tags: ["Quantum Dots", "Displays", "Optics"],
    body: [
      "InP/ZnSe cores paired with graded shells have closed the quantum-yield gap with cadmium-based dots, reaching over 95% external photoluminescence quantum yield.",
      "Electroluminescent direct-emission QLED prototypes now rival OLED on lifetime while using solution-processed deposition at room temperature.",
      "Micro-LED backplanes paired with quantum-dot colour conversion are the leading architecture for AR waveguides requiring >10,000 nits.",
    ],
  },
  {
    id: "self-healing-nanocoatings",
    title: "Self-Healing Nano-Coatings for Aerospace",
    source: "Composites Part B",
    date: "2025-03-28",
    readMinutes: 7,
    art: "coating",
    accent: "#fbbf24",
    excerpt:
      "Microcapsule and reversible-bond chemistries let aircraft skins repair micro-cracks before they propagate.",
    tags: ["Coatings", "Aerospace", "Durability"],
    body: [
      "Diels–Alder crosslinks reversibly break around 120 °C and re-form on cooling, giving coatings an intrinsic healing cycle that can repeat dozens of times.",
      "Halloysite nanotubes loaded with corrosion inhibitors open preferentially at scratch edges, releasing a healing dose exactly where damage occurs.",
      "Field trials report a 60% reduction in inspection intervals for coated panels exposed to salt-fog and thermal-cycling conditions.",
    ],
  },
];

export function getArticle(id: string): Article | undefined {
  return ARTICLES.find((a) => a.id === id);
}

export const RESOURCES = [
  {
    id: "res-1",
    title: "Getting started with the NanoSphere workspace",
    type: "Guide",
    tag: "Basics",
    readMinutes: 6,
    blurb: "Tour the dashboard, organise projects and keep research activity in one place.",
  },
  {
    id: "res-2",
    title: "Understanding the material comparison index",
    type: "Documentation",
    tag: "Data",
    readMinutes: 4,
    blurb: "How normalised 0–100 property indices are calculated and when to prefer raw units.",
  },
  {
    id: "res-3",
    title: "Running a credible nanoscale simulation",
    type: "Playbook",
    tag: "Simulation",
    readMinutes: 9,
    blurb: "Boundary conditions, mesh convergence and sanity checks before you trust a curve.",
  },
  {
    id: "res-4",
    title: "CSV dataset conventions for analysis uploads",
    type: "Reference",
    tag: "Data",
    readMinutes: 5,
    blurb: "Column naming, units, missing values and the shape our chart builder expects.",
  },
  {
    id: "res-5",
    title: "Characterisation methods cheat-sheet",
    type: "Cheat-sheet",
    tag: "Lab",
    readMinutes: 7,
    blurb: "TEM, XRD, DLS, Zeta potential and Raman — what each technique actually tells you.",
  },
  {
    id: "res-6",
    title: "Writing a nanomaterial safety data summary",
    type: "Guide",
    tag: "Safety",
    readMinutes: 8,
    blurb: "Exposure routes, dose–response framing and containment for engineered nanomaterials.",
  },
  {
    id: "res-7",
    title: "From lab note to published figure",
    type: "Playbook",
    tag: "Publishing",
    readMinutes: 6,
    blurb: "Colour, scaling and annotation rules that keep charts legible in print and on screen.",
  },
  {
    id: "res-8",
    title: "API & export reference",
    type: "Reference",
    tag: "Data",
    readMinutes: 3,
    blurb: "Everything you can export from local demo storage: projects, datasets and settings.",
  },
] as const;

export interface ResourceBody {
  sections: { heading: string; text: string }[];
}

export const RESOURCE_BODY: Record<string, ResourceBody> = {
  default: {
    sections: [
      {
        heading: "Overview",
        text: "This resource ships with the NanoSphere demo workspace. It is local reference content bundled with the interface — there is no remote backend involved.",
      },
      {
        heading: "How to use it",
        text: "Open the article from the Resources list, skim the headings, and apply the checklist to the project you are working on. Everything you configure in the app persists to browser storage only.",
      },
      {
        heading: "Demo notice",
        text: "Sample values and thresholds in this document are illustrative. Always validate against primary literature before making engineering decisions.",
      },
    ],
  },
};
