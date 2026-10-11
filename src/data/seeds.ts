export type ActivityKind = "search" | "simulation" | "dataset" | "project" | "system";

export interface Activity {
  id: string;
  kind: ActivityKind;
  title: string;
  meta?: string;
  at: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  at: string;
}

export interface DatasetSeries {
  name: string;
  unit: string;
  points: { label: string; value: number }[];
}

export interface Dataset {
  id: string;
  name: string;
  source: "seed" | "upload";
  uploadedAt: string;
  series: DatasetSeries[];
}

export interface ProjectTask {
  id: string;
  title: string;
  done: boolean;
}

export type ProjectStatus = "Planning" | "Active" | "Review" | "Completed";

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  createdAt: string;
  tasks: ProjectTask[];
}

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

export const SEED_ACTIVITIES: Activity[] = [
  { id: "a1", kind: "search", title: 'You searched for "Carbon Nanotube"', meta: "Explore Nanomaterials", at: hoursAgo(2) },
  { id: "a2", kind: "simulation", title: "Simulation completed · Graphene", meta: "Electron transport model", at: hoursAgo(4) },
  { id: "a3", kind: "dataset", title: "New dataset uploaded", meta: "graphene-conductivity.csv", at: hoursAgo(6) },
  { id: "a4", kind: "project", title: 'Project "Nano Sensor" created', meta: "Status: Planning", at: hoursAgo(26) },
];

export const SEED_NOTIFICATIONS: AppNotification[] = [
  {
    id: "n1",
    title: "Simulation finished",
    body: "Graphene · electron transport run #42 completed with peak 68.4.",
    read: false,
    at: hoursAgo(4),
  },
  {
    id: "n2",
    title: "Dataset processed",
    body: "graphene-conductivity.csv parsed successfully — 24 rows.",
    read: false,
    at: hoursAgo(6),
  },
  {
    id: "n3",
    title: "Weekly research digest",
    body: "6 new papers matched your graphene and 2D material interests.",
    read: true,
    at: hoursAgo(30),
  },
];

export const SEED_DATASETS: Dataset[] = [
  {
    id: "d1",
    name: "graphene-conductivity.csv",
    source: "seed",
    uploadedAt: hoursAgo(6),
    series: [
      {
        name: "Sheet conductivity",
        unit: "kS/sq",
        points: [
          { label: "300K", value: 42 },
          { label: "325K", value: 45 },
          { label: "350K", value: 47 },
          { label: "375K", value: 46 },
          { label: "400K", value: 44 },
          { label: "425K", value: 41 },
          { label: "450K", value: 38 },
          { label: "475K", value: 35 },
          { label: "500K", value: 32 },
        ],
      },
      {
        name: "Control film",
        unit: "kS/sq",
        points: [
          { label: "300K", value: 18 },
          { label: "325K", value: 19 },
          { label: "350K", value: 20 },
          { label: "375K", value: 20 },
          { label: "400K", value: 19 },
          { label: "425K", value: 18 },
          { label: "450K", value: 17 },
          { label: "475K", value: 15 },
          { label: "500K", value: 14 },
        ],
      },
    ],
  },
  {
    id: "d2",
    name: "cnt-thermal-cycling.json",
    source: "seed",
    uploadedAt: hoursAgo(52),
    series: [
      {
        name: "Thermal conductivity",
        unit: "W/m·K",
        points: [
          { label: "Cycle 1", value: 610 },
          { label: "Cycle 2", value: 598 },
          { label: "Cycle 3", value: 587 },
          { label: "Cycle 4", value: 583 },
          { label: "Cycle 5", value: 571 },
          { label: "Cycle 6", value: 566 },
        ],
      },
    ],
  },
];

export const SEED_PROJECTS: Project[] = [
  {
    id: "p1",
    name: "Nano Sensor",
    description: "Room-temperature gas sensor array based on ZnO nanorods and graphene interconnects.",
    status: "Planning",
    createdAt: hoursAgo(26),
    tasks: [
      { id: "t1", title: "Define target analytes", done: true },
      { id: "t2", title: "Order nanorod substrates", done: false },
      { id: "t3", title: "Draft baseline schematic", done: false },
    ],
  },
  {
    id: "p2",
    name: "Conductive Ink v2",
    description: "Silver nanoparticle ink with 45% lower sintering temperature than the current formulation.",
    status: "Active",
    createdAt: hoursAgo(120),
    tasks: [
      { id: "t4", title: "Bench viscosity tests", done: true },
      { id: "t5", title: "Print test traces on PET", done: true },
      { id: "t6", title: "Resistance after 500 bend cycles", done: false },
    ],
  },
  {
    id: "p3",
    name: "TiO₂ Self-Cleaning Film",
    description: "Spray-coated anatase film for glazing panels; compare photocatalytic dye decay rates.",
    status: "Review",
    createdAt: hoursAgo(300),
    tasks: [
      { id: "t7", title: "Methylene blue decay run", done: true },
      { id: "t8", title: "Write comparison summary", done: false },
    ],
  },
];
