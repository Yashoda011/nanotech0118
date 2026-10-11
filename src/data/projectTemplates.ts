export type TrackId = "environment" | "medical" | "electronics" | "agri";

export interface Track {
  id: TrackId;
  label: string;
  accent: string;
}

export interface ProjectTemplate {
  id: string;
  track: TrackId;
  code: string;
  title: string;
  goal: string;
  materials: string[];
  tools: string[];
  steps: string[];
  output: string;
}

export interface RoadmapPhase {
  phase: string;
  weeks: string;
  title: string;
  items: string[];
}

export const TRACKS: Track[] = [
  { id: "environment", label: "Environment / Energy", accent: "#38bdf8" },
  { id: "medical", label: "Medical", accent: "#f472b6" },
  { id: "electronics", label: "Electronics / Materials", accent: "#fbbf24" },
  { id: "agri", label: "Agriculture / Food", accent: "#34d399" },
];

export const TEMPLATES: ProjectTemplate[] = [
  {
    id: "t-water-filter",
    track: "environment",
    code: "Project 1.1",
    title: "Nano Water Filter",
    goal: "Remove heavy metals / bacteria using nano-material",
    materials: ["Activated carbon", "Silver nanoparticles", "Sand"],
    tools: ["Beaker", "Filter column", "pH strips", "SEM analysis (college lab) / DLS"],
    steps: [
      "Synthesize Ag nanoparticles (green method — neem leaf extract + AgNO3)",
      "Coat Ag nanoparticles on activated carbon",
      "Build 3-layer filter column",
      "Test before/after water — TDS, bacterial count",
    ],
    output: "Filtration efficiency % report",
  },
  {
    id: "t-solar",
    track: "environment",
    code: "Project 1.2",
    title: "Nano Solar Efficiency Test",
    goal: "Compare normal vs TiO2 nano-coated solar cell",
    materials: ["TiO2 nanopowder", "ITO glass", "Dye (hibiscus)", "Electrolyte"],
    steps: [
      "Make dye-sensitized solar cell (DSSC)",
      "Add TiO2 nano-layer via spin-coat / doctor-blade",
      "Measure voltage/current under sun",
    ],
    tools: [],
    output: "Efficiency increase graph",
  },
  {
    id: "t-antibacterial",
    track: "medical",
    code: "Project 2.1",
    title: "Green Synthesis + Antibacterial Test",
    goal: "Prove nano silver kills bacteria",
    materials: ["AgNO3", "Plant extract", "Agar plates", "E.coli culture"],
    tools: ["Ultrasonicator", "Centrifuge", "UV-Vis", "Incubator"],
    steps: [
      "Synthesize AgNPs (color change to brown = success)",
      "Characterize by UV-Vis peak ~420 nm",
      "Disc diffusion test on bacteria",
      "Measure zone of inhibition",
    ],
    output: "Antibacterial report — research publishable",
  },
  {
    id: "t-drug-delivery",
    track: "medical",
    code: "Project 2.2",
    title: "Targeted Drug Delivery Model",
    goal: "Demonstrate controlled release",
    materials: ["Chitosan nanoparticles + dye (as dummy drug)", "Gelatin capsules"],
    tools: [],
    steps: [
      "Make chitosan NPs by ionic gelation",
      "Load dye inside",
      "Test release in pH 2 vs pH 7 (stomach vs intestine simulation)",
      "Plot release curve",
    ],
    output: "Drug release kinetics",
  },
  {
    id: "t-conductive",
    track: "electronics",
    code: "Project 3.1",
    title: "Nano-Conductive Coating",
    goal: "Make scratch-resistant + conductive glass",
    materials: ["Graphene powder / ITO nanopowder", "Glass slide", "Multimeter"],
    tools: ["Spray / spin coater"],
    steps: [
      "Coat glass by spray / spin coater",
      "Test conductivity, transparency, scratch test",
      "Compare 1, 2, 3 layers",
    ],
    output: "Conductivity vs transparency chart",
  },
  {
    id: "t-gas-sensor",
    track: "electronics",
    code: "Project 3.2",
    title: "Nano-Sensor for Gas",
    goal: "Detect LPG / smoke using SnO2 nanoparticles",
    materials: ["SnO2 nanopowder", "Arduino", "Heating element"],
    tools: [],
    steps: [
      "Coat sensor surface",
      "Interface with Arduino",
      "Calibrate response to gas concentration",
    ],
    output: "Working gas sensor prototype",
  },
  {
    id: "t-fertilizer",
    track: "agri",
    code: "Project 4.1",
    title: "Nano-Fertilizer Growth Test",
    goal: "Prove less fertilizer + more growth",
    materials: ["ZnO / urea-hydroxyapatite nanoparticles", "3 plant pots (control, normal, nano)"],
    tools: ["Ruler / measuring scale"],
    steps: [
      "Apply 3 treatments for 21 days",
      "Measure height, leaf count, root length daily",
      "Statistical comparison",
    ],
    output: "Growth increase % report",
  },
  {
    id: "t-packaging",
    track: "agri",
    code: "Project 4.2",
    title: "Anti-Spoilage Nano Packaging",
    goal: "Extend fruit shelf life",
    materials: ["Chitosan + ZnO nano-film", "2 sets of strawberries"],
    tools: ["Weighing scale"],
    steps: [
      "Make nano-film wrap",
      "Store one wrapped, one open for 7 days",
      "Record weight loss, spoilage daily",
    ],
    output: "Shelf-life extension proof",
  },
];

export const ROADMAP: RoadmapPhase[] = [
  {
    phase: "Phase 1",
    weeks: "Week 1–2",
    title: "Green synthesis + basic characterization",
    items: ["Synthesize nanoparticles (green methods)", "UV-Vis / pH / visual confirmation", "Log baseline readings"],
  },
  {
    phase: "Phase 2",
    weeks: "Week 3–4",
    title: "Prototype / application build",
    items: ["Build filter column, cell, coating, sensor or film", "Wire up Arduino / measurement rigs where needed", "First trial runs"],
  },
  {
    phase: "Phase 3",
    weeks: "Week 5",
    title: "Testing + data collection",
    items: ["Before/after measurements (TDS, voltage, zones, growth…)", "Repeat trials for reliability", "Upload datasets to Analysis for charts"],
  },
  {
    phase: "Phase 4",
    weeks: "Week 6",
    title: "Report + presentation + charts",
    items: ["Efficiency / increase % report", "Charts from Analysis module", "Final presentation and publishable summary"],
  },
];

export function trackOf(id: TrackId): Track {
  return TRACKS.find((t) => t.id === id)!;
}
