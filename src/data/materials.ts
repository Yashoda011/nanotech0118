export type Category =
  | "2D Material"
  | "1D Material"
  | "0D Material"
  | "Metallic"
  | "Oxide"
  | "Chalcogenide";

export type ArtKind = "lattice" | "tube" | "cluster" | "crystal" | "wire" | "quantum" | "layer" | "rod";

export interface MaterialIndex {
  /** 0–100 normalised comparison index used by the dashboard chart */
  electrical: number;
  thermal: number;
  tensile: number;
  /** band gap in eV (kept on the same axis for the demo comparison chart) */
  bandgap: number;
}

export interface Material {
  id: string;
  name: string;
  formula: string;
  category: Category;
  art: ArtKind;
  accent: string;
  tagline: string;
  description: string;
  year: number;
  biocompatible: boolean;
  trending: boolean;
  index: MaterialIndex;
  properties: {
    conductivity: string;
    thermalConductivity: string;
    tensileStrength: string;
    bandGap: string;
    density: string;
    size: string;
    surfaceArea: string;
    meltingPoint: string;
  };
  /** numeric values for filtering + sorting */
  numbers: {
    conductivity: number;
    thermal: number;
    tensile: number;
    bandGap: number;
    density: number;
  };
  applications: string[];
}

export const MATERIALS: Material[] = [
  {
    id: "graphene",
    name: "Graphene",
    formula: "C",
    category: "2D Material",
    art: "lattice",
    accent: "#38bdf8",
    tagline: "High conductivity, stronger material",
    description:
      "A single-atom-thick layer of carbon arranged in a hexagonal lattice. Graphene conducts electricity better than copper, is ~200× stronger than steel and is almost transparent.",
    year: 2004,
    biocompatible: true,
    trending: true,
    index: { electrical: 72, thermal: 86, tensile: 96, bandgap: 6 },
    properties: {
      conductivity: "1.0 × 10⁸ S/m",
      thermalConductivity: "3000–5000 W/m·K",
      tensileStrength: "130 GPa",
      bandGap: "0 eV (semimetal)",
      density: "2.267 g/cm³",
      size: "0.335 nm thickness",
      surfaceArea: "2630 m²/g",
      meltingPoint: "3550 °C (sublimation)",
    },
    numbers: { conductivity: 1e8, thermal: 4000, tensile: 130, bandGap: 0, density: 2.267 },
    applications: ["Flexible electronics", "Supercapacitors", "Composite fillers", "Gas sensors"],
  },
  {
    id: "carbon-nanotube",
    name: "Carbon Nanotube",
    formula: "C (SWCNT/MWCNT)",
    category: "1D Material",
    art: "tube",
    accent: "#60a5fa",
    tagline: "High strength, lightweight",
    description:
      "Cylindrical graphene sheets rolled into seamless tubes. Their ballistic electron transport and exceptional strength-to-weight ratio make them ideal for conductive films and reinforced composites.",
    year: 1991,
    biocompatible: true,
    trending: true,
    index: { electrical: 45, thermal: 74, tensile: 92, bandgap: 9 },
    properties: {
      conductivity: "1.0 × 10⁵–10⁷ S/m",
      thermalConductivity: "600–3500 W/m·K",
      tensileStrength: "50–150 GPa",
      bandGap: "0 eV (metal) / 0.7 eV (semicon.)",
      density: "1.3–1.4 g/cm³",
      size: "0.4–2 nm diameter",
      surfaceArea: "~1315 m²/g",
      meltingPoint: ">3600 °C",
    },
    numbers: { conductivity: 1e6, thermal: 2000, tensile: 100, bandGap: 0.7, density: 1.35 },
    applications: ["Conductive inks", "Structural composites", "Field-emission displays", "Drug delivery"],
  },
  {
    id: "silver-nanoparticles",
    name: "Silver Nanoparticles",
    formula: "Ag",
    category: "Metallic",
    art: "cluster",
    accent: "#cbd5e1",
    tagline: "Antimicrobial, excellent conductivity",
    description:
      "Colloidal silver particles in the 1–100 nm range with strong surface plasmon resonance. They deliver broad-spectrum antimicrobial action and printable conductive traces.",
    year: 1980,
    biocompatible: false,
    trending: true,
    index: { electrical: 38, thermal: 44, tensile: 22, bandgap: 14 },
    properties: {
      conductivity: "6.3 × 10⁷ S/m",
      thermalConductivity: "429 W/m·K",
      tensileStrength: "~0.2 GPa (bulk)",
      bandGap: "0 eV",
      density: "10.49 g/cm³",
      size: "5–50 nm",
      surfaceArea: "8.4 m²/g",
      meltingPoint: "961.8 °C",
    },
    numbers: { conductivity: 6.3e7, thermal: 429, tensile: 0.2, bandGap: 0, density: 10.49 },
    applications: ["Wound dressings", "Conductive adhesives", "Antimicrobial coatings", "SERS substrates"],
  },
  {
    id: "titanium-dioxide",
    name: "Titanium Dioxide (TiO₂)",
    formula: "TiO₂",
    category: "Oxide",
    art: "crystal",
    accent: "#e2e8f0",
    tagline: "UV protection, self-cleaning",
    description:
      "A wide-bandgap semiconductor available as anatase and rutile phases. Photocatalytic activity under UV light powers self-cleaning surfaces and sunscreens.",
    year: 1972,
    biocompatible: true,
    trending: true,
    index: { electrical: 12, thermal: 18, tensile: 16, bandgap: 76 },
    properties: {
      conductivity: "~1 × 10⁻⁸ S/m (intrinsic)",
      thermalConductivity: "8.4 W/m·K",
      tensileStrength: "0.45 GPa",
      bandGap: "3.0–3.2 eV",
      density: "4.23 g/cm³",
      size: "10–50 nm (P25)",
      surfaceArea: "50 m²/g",
      meltingPoint: "1843 °C",
    },
    numbers: { conductivity: 1e-8, thermal: 8.4, tensile: 0.45, bandGap: 3.2, density: 4.23 },
    applications: ["Sunscreen", "Self-cleaning glass", "Photocatalysis", "Dye-sensitised cells"],
  },
  {
    id: "gold-nanoparticles",
    name: "Gold Nanoparticles",
    formula: "Au",
    category: "Metallic",
    art: "cluster",
    accent: "#fbbf24",
    tagline: "Plasmonic sensing, low toxicity",
    description:
      "Citrate-capped gold spheres with tunable surface plasmon resonance across the visible range — a workhorse for lateral-flow assays and photothermal therapy.",
    year: 1857,
    biocompatible: true,
    trending: false,
    index: { electrical: 33, thermal: 40, tensile: 20, bandgap: 14 },
    properties: {
      conductivity: "4.5 × 10⁷ S/m",
      thermalConductivity: "317 W/m·K",
      tensileStrength: "~0.3 GPa (bulk)",
      bandGap: "0 eV",
      density: "19.32 g/cm³",
      size: "5–100 nm",
      surfaceArea: "8.9 m²/g",
      meltingPoint: "1064 °C",
    },
    numbers: { conductivity: 4.5e7, thermal: 317, tensile: 0.3, bandGap: 0, density: 19.32 },
    applications: ["Lateral-flow assays", "Photothermal therapy", "Catalysis", "Bio-imaging"],
  },
  {
    id: "quantum-dots",
    name: "CdSe Quantum Dots",
    formula: "CdSe",
    category: "0D Material",
    art: "quantum",
    accent: "#a78bfa",
    tagline: "Tunable emission, pure colour",
    description:
      "Semiconductor nanocrystals whose band gap shifts with diameter, letting engineers dial in precise emission wavelengths for displays and bio-labels.",
    year: 1993,
    biocompatible: false,
    trending: false,
    index: { electrical: 18, thermal: 12, tensile: 10, bandgap: 64 },
    properties: {
      conductivity: "~1 × 10⁻⁴ S/m (film)",
      thermalConductivity: "~1.5 W/m·K",
      tensileStrength: "n/a (colloid)",
      bandGap: "1.7–3.1 eV (size-tuned)",
      density: "5.82 g/cm³",
      size: "2–8 nm",
      surfaceArea: "~180 m²/g",
      meltingPoint: "1239 °C",
    },
    numbers: { conductivity: 1e-4, thermal: 1.5, tensile: 0, bandGap: 2.4, density: 5.82 },
    applications: ["QLED displays", "Solar concentrators", "Bio-labels", "Quantum lighting"],
  },
  {
    id: "silicon-nanowires",
    name: "Silicon Nanowires",
    formula: "Si",
    category: "1D Material",
    art: "wire",
    accent: "#34d399",
    tagline: "Anode champion for Li-ion",
    description:
      "Vapour–liquid–grown silicon wires tolerate the 300% volume swing of lithiation, making them prime candidates for next-generation battery anodes.",
    year: 1998,
    biocompatible: false,
    trending: false,
    index: { electrical: 30, thermal: 34, tensile: 44, bandgap: 58 },
    properties: {
      conductivity: "1.6 × 10⁵ S/m (doped)",
      thermalConductivity: "150 W/m·K",
      tensileStrength: "~7 GPa",
      bandGap: "1.12 eV",
      density: "2.33 g/cm³",
      size: "20–200 nm diameter",
      surfaceArea: "~90 m²/g",
      meltingPoint: "1414 °C",
    },
    numbers: { conductivity: 1.6e5, thermal: 150, tensile: 7, bandGap: 1.12, density: 2.33 },
    applications: ["Li-ion anodes", "Photodetectors", "Thermoelectrics", "Field-effect transistors"],
  },
  {
    id: "graphene-oxide",
    name: "Graphene Oxide",
    formula: "C₈O₂(OH)ₓ",
    category: "2D Material",
    art: "layer",
    accent: "#22d3ee",
    tagline: "Solution-processable, tunable",
    description:
      "Oxygen-functionalised graphene that disperses in water and can be filtered into free-standing films, then thermally reduced back toward graphene.",
    year: 1962,
    biocompatible: true,
    trending: false,
    index: { electrical: 21, thermal: 30, tensile: 54, bandgap: 40 },
    properties: {
      conductivity: "~10² S/m (after reduction)",
      thermalConductivity: "~350 W/m·K (rGO)",
      tensileStrength: "0.1–0.25 GPa (film)",
      bandGap: "0.5–2.1 eV (tunable)",
      density: "1.8 g/cm³",
      size: "1–3 nm thickness",
      surfaceArea: "~700 m²/g",
      meltingPoint: "Decomposes ~200 °C",
    },
    numbers: { conductivity: 1e2, thermal: 350, tensile: 0.2, bandGap: 1.2, density: 1.8 },
    applications: ["Barrier films", "Water filtration", "Conductive coatings", "Polymer composites"],
  },
  {
    id: "mos2",
    name: "Molybdenum Disulfide",
    formula: "MoS₂",
    category: "Chalcogenide",
    art: "layer",
    accent: "#818cf8",
    tagline: "2D semiconductor for logic",
    description:
      "A transition-metal dichalcogenide with a direct monolayer band gap — the missing piece for 2D transistors, photodetectors and catalytic hydrogen evolution.",
    year: 2010,
    biocompatible: false,
    trending: false,
    index: { electrical: 16, thermal: 22, tensile: 48, bandgap: 68 },
    properties: {
      conductivity: "~10⁻⁵–10² S/m (doped)",
      thermalConductivity: "34–50 W/m·K",
      tensileStrength: "23 GPa (monolayer)",
      bandGap: "1.8 eV (monolayer)",
      density: "5.06 g/cm³",
      size: "0.65 nm thickness",
      surfaceArea: "~35 m²/g",
      meltingPoint: "1185 °C",
    },
    numbers: { conductivity: 10, thermal: 42, tensile: 23, bandGap: 1.8, density: 5.06 },
    applications: ["Logic transistors", "HER catalysis", "Photodetectors", "Lubricant additives"],
  },
  {
    id: "zinc-oxide-nanorods",
    name: "Zinc Oxide Nanorods",
    formula: "ZnO",
    category: "Oxide",
    art: "rod",
    accent: "#4ade80",
    tagline: "Piezoelectric, UV emitting",
    description:
      "Hexagonal wurtzite rods that convert mechanical strain into charge — a favourite for nanogenerators, UV LEDs and chemiresistive gas sensors.",
    year: 2003,
    biocompatible: true,
    trending: false,
    index: { electrical: 14, thermal: 20, tensile: 18, bandgap: 72 },
    properties: {
      conductivity: "~0.1 S/m (intrinsic)",
      thermalConductivity: "60 W/m·K",
      tensileStrength: "0.7 GPa",
      bandGap: "3.37 eV",
      density: "5.61 g/cm³",
      size: "50–500 nm length",
      surfaceArea: "~40 m²/g",
      meltingPoint: "1975 °C",
    },
    numbers: { conductivity: 0.1, thermal: 60, tensile: 0.7, bandGap: 3.37, density: 5.61 },
    applications: ["Nanogenerators", "UV photodetectors", "Gas sensors", "Sunscreen filters"],
  },
  {
    id: "carbon-nanodots",
    name: "Carbon Nanodots",
    formula: "C-dots",
    category: "0D Material",
    art: "quantum",
    accent: "#2dd4bf",
    tagline: "Low cost, low toxicity",
    description:
      "Sub-10 nm carbon particles with bright, stable photoluminescence — a greener alternative to heavy-metal quantum dots for bio-imaging and LEDs.",
    year: 2004,
    biocompatible: true,
    trending: false,
    index: { electrical: 11, thermal: 9, tensile: 8, bandgap: 52 },
    properties: {
      conductivity: "~10⁻³ S/m (film)",
      thermalConductivity: "~0.8 W/m·K",
      tensileStrength: "n/a (colloid)",
      bandGap: "2.0–3.5 eV",
      density: "1.6 g/cm³",
      size: "1–10 nm",
      surfaceArea: "~250 m²/g",
      meltingPoint: "Stable to >300 °C",
    },
    numbers: { conductivity: 1e-3, thermal: 0.8, tensile: 0, bandGap: 2.8, density: 1.6 },
    applications: ["Bio-imaging", "LEDs", "Photocatalysis", "Antioxidants"],
  },
  {
    id: "iron-oxide-nanoparticles",
    name: "Iron Oxide Nanoparticles",
    formula: "Fe₃O₄",
    category: "Metallic",
    art: "cluster",
    accent: "#f472b6",
    tagline: "Superparamagnetic, MRI contrast",
    description:
      "Superparamagnetic magnetite cores around 10 nm that heat under an alternating field and clear without permanent magnetisation — used in hyperthermia and MRI contrast.",
    year: 1980,
    biocompatible: true,
    trending: false,
    index: { electrical: 25, thermal: 26, tensile: 19, bandgap: 30 },
    properties: {
      conductivity: "1 × 10⁵ S/m (bulk)",
      thermalConductivity: "9.7 W/m·K",
      tensileStrength: "~0.5 GPa",
      bandGap: "0.12 eV (semiconductor)",
      density: "5.18 g/cm³",
      size: "5–20 nm",
      surfaceArea: "~100 m²/g",
      meltingPoint: "1597 °C",
    },
    numbers: { conductivity: 1e5, thermal: 9.7, tensile: 0.5, bandGap: 0.12, density: 5.18 },
    applications: ["MRI contrast agents", "Magnetic hyperthermia", "Targeted drug delivery", "Water treatment"],
  },
];

export const CATEGORIES: Category[] = [
  "2D Material",
  "1D Material",
  "0D Material",
  "Metallic",
  "Oxide",
  "Chalcogenide",
];

export function getMaterial(id: string): Material | undefined {
  return MATERIALS.find((m) => m.id === id);
}

export const TRENDING_IDS = ["graphene", "carbon-nanotube", "silver-nanoparticles", "titanium-dioxide"];

export const CHART_METRICS = [
  { key: "electrical", label: "Electrical Conductivity" },
  { key: "thermal", label: "Thermal Conductivity" },
  { key: "tensile", label: "Tensile Strength" },
  { key: "bandgap", label: "Band Gap" },
] as const;

export type ChartMetricKey = (typeof CHART_METRICS)[number]["key"];
