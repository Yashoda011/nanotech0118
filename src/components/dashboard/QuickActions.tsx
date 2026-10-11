import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Play, UploadCloud, FolderPlus, ChevronRight } from "lucide-react";
import { Card, SectionHeader, Button, Modal, Field, Input, Textarea, Select } from "@/components/ui";
import { useApp } from "@/store/app";
import { fileContentToDataset } from "@/lib/parse";
import { MATERIALS, getMaterial } from "@/data/materials";
import type { ProjectStatus } from "@/data/seeds";

const ACTIONS = [
  { id: "search", label: "Search Materials", icon: Search, color: "bg-blue/18 text-blue-soft border-blue/30" },
  { id: "simulate", label: "Run Simulation", icon: Play, color: "bg-violet/18 text-violet border-violet/30" },
  { id: "upload", label: "Upload Dataset", icon: UploadCloud, color: "bg-mint/18 text-mint border-mint/30" },
  { id: "project", label: "Create Project", icon: FolderPlus, color: "bg-gold/18 text-gold border-gold/30" },
] as const;

type ActionId = (typeof ACTIONS)[number]["id"];

export function QuickActions() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const { addDataset, pushToast, createProject, logActivity, user } = useApp();

  const [simOpen, setSimOpen] = useState(false);
  const [simMaterial, setSimMaterial] = useState("graphene");
  const [simModel, setSimModel] = useState("electron");
  const [projOpen, setProjOpen] = useState(false);
  const [projName, setProjName] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [projStatus, setProjStatus] = useState<ProjectStatus>("Planning");

  const needEmail = () => {
    if (user?.guest) {
      pushToast("Projects need an email account — please sign in.", "info");
      navigate("/login", { state: { from: { pathname: "/" } } });
      return true;
    }
    return false;
  };

  const onAction = (id: ActionId) => {
    if (id === "search") navigate("/explore?focus=1");
    if (id === "simulate") setSimOpen(true);
    if (id === "upload") fileRef.current?.click();
    if (id === "project") {
      if (needEmail()) return;
      setProjOpen(true);
    }
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const text = await file.text();
      const dataset = fileContentToDataset(file.name, text);
      addDataset(dataset);
      pushToast(`Dataset “${file.name}” added (${dataset.series.length} series)`, "success");
      navigate("/analysis");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Could not parse that file", "info");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <Card className="h-full">
      <SectionHeader title="Quick Actions" />
      <div className="space-y-2.5 px-4 pb-4">
        {ACTIONS.map((a) => (
          <button
            key={a.id}
            onClick={() => onAction(a.id)}
            className="flex w-full items-center gap-3 rounded-xl border border-line bg-panel/60 px-3.5 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-soft/35 hover:bg-elevated/70"
          >
            <span className={`grid size-9 shrink-0 place-items-center rounded-xl border ${a.color}`}>
              <a.icon className="size-4" strokeWidth={2} />
            </span>
            <span className="flex-1 text-[13px] font-medium text-ink">{a.label}</span>
            <ChevronRight className="size-4 text-ink-muted" />
          </button>
        ))}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".csv,.tsv,.json,text/csv,application/json"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />

      <Modal
        open={simOpen}
        onClose={() => setSimOpen(false)}
        title="Quick simulation"
        description="Picks are handed to the full simulation console."
        footer={
          <>
            <Button variant="ghost" onClick={() => setSimOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="gradient"
              onClick={() => {
                setSimOpen(false);
                logActivity("simulation", `Simulation started · ${getMaterial(simMaterial)?.name ?? simMaterial}`, "Quick action");
                navigate(`/simulation?material=${simMaterial}&model=${simModel}&auto=1`);
              }}
            >
              Open console
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Material">
            <Select value={simMaterial} onChange={(e) => setSimMaterial(e.target.value)}>
              {MATERIALS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Model" hint="Demo models — illustrative only.">
            <Select value={simModel} onChange={(e) => setSimModel(e.target.value)}>
              <option value="electron">Electron transport</option>
              <option value="thermal">Thermal transport</option>
              <option value="tensile">Tensile behaviour</option>
            </Select>
          </Field>
        </div>
      </Modal>

      <Modal
        open={projOpen}
        onClose={() => setProjOpen(false)}
        title="Create project"
        description="Projects are stored in this browser only."
        footer={
          <>
            <Button variant="ghost" onClick={() => setProjOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="gradient"
              disabled={!projName.trim()}
              onClick={() => {
                createProject({ name: projName.trim(), description: projDesc.trim(), status: projStatus });
                pushToast(`Project “${projName.trim()}” created`, "success");
                setProjOpen(false);
                setProjName("");
                setProjDesc("");
                setProjStatus("Planning");
                navigate("/projects");
              }}
            >
              Create project
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Project name">
            <Input value={projName} onChange={(e) => setProjName(e.target.value)} placeholder="e.g. Nano Sensor v2" />
          </Field>
          <Field label="Description">
            <Textarea value={projDesc} onChange={(e) => setProjDesc(e.target.value)} placeholder="What is this project about?" />
          </Field>
          <Field label="Status">
            <Select value={projStatus} onChange={(e) => setProjStatus(e.target.value as ProjectStatus)}>
              <option value="Planning">Planning</option>
              <option value="Active">Active</option>
              <option value="Review">Review</option>
              <option value="Completed">Completed</option>
            </Select>
          </Field>
        </div>
      </Modal>
    </Card>
  );
}
