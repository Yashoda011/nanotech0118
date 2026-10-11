import type { Dataset, DatasetSeries } from "@/data/seeds";
import { uid } from "@/lib/utils";

export interface ParsedTable {
  columns: string[];
  rows: string[][];
}

export function parseDelimited(text: string, delimiter: "," | "\t" = ","): ParsedTable {
  const lines = text
    .trim()
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);
  const rows = lines.map((l) =>
    l.split(delimiter).map((cell) => cell.trim().replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1")),
  );
  const columns = rows.shift() ?? [];
  return { columns, rows };
}

/** Convert a uploaded CSV/JSON payload into a chartable dataset (browser-local only). */
export function fileContentToDataset(name: string, content: string): Dataset {
  const trimmed = content.trim();

  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    const json = JSON.parse(trimmed) as unknown;
    const records = Array.isArray(json) ? json : (json as Record<string, unknown>[]);
    if (!records.length || typeof records[0] !== "object" || records[0] === null) {
      throw new Error("JSON must be an array of objects with numeric fields.");
    }
    const keys = Object.keys(records[0] as Record<string, unknown>);
    const numericKeys = keys.filter((k) =>
      records.every((r) => {
        const v = (r as Record<string, unknown>)[k];
        return v == null || v === "" || !Number.isNaN(Number(v));
      }),
    );
    const valueKeys = numericKeys.filter((k) => records.some((r) => Number.isFinite(Number((r as Record<string, unknown>)[k]))));
    if (!valueKeys.length) throw new Error("No numeric fields found in JSON.");
    const series: DatasetSeries[] = valueKeys.slice(0, 4).map((k) => ({
      name: k,
      unit: "",
      points: records.map((r, i) => ({
        label: String((r as Record<string, unknown>)["label"] ?? (r as Record<string, unknown>)["name"] ?? `#${i + 1}`),
        value: Number((r as Record<string, unknown>)[k]),
      })),
    }));
    return { id: uid("ds"), name, source: "upload", uploadedAt: new Date().toISOString(), series };
  }

  const delimiter = trimmed.split("\n")[0]?.includes("\t") ? "\t" : ",";
  const { columns, rows } = parseDelimited(trimmed, delimiter);
  if (!columns.length || !rows.length) throw new Error("File appears to be empty.");

  const labelHeader = columns[0];
  const series: DatasetSeries[] = [];
  for (let c = 1; c < columns.length; c++) {
    const points = rows
      .map((r, i) => ({ label: r[0] ?? `#${i + 1}`, value: Number(r[c]) }))
      .filter((p) => Number.isFinite(p.value));
    if (points.length > 0) series.push({ name: columns[c] ?? `Column ${c + 1}`, unit: "", points });
  }
  if (!series.length) {
    throw new Error(`No numeric columns found (label column: “${labelHeader}”).`);
  }
  return { id: uid("ds"), name, source: "upload", uploadedAt: new Date().toISOString(), series: series.slice(0, 4) };
}
