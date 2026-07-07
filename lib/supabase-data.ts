import { SupabaseClient } from "@supabase/supabase-js";
import { ArtStructure } from "@/lib/art-structures";
import { PipelineLine } from "@/lib/lines";

type LineRow = {
  id: string;
  name: string;
  main_line: "S1" | "P1";
  branch_name: string;
  pipe_note: string | null;
};

type ArtStructureRow = {
  id: string;
  code: string;
  line: string;
  kilometer: string;
  type: ArtStructure["type"];
  detail: string;
  status: ArtStructure["status"];
  concrete_size: string | null;
  cover_size: string | null;
  air_valve_diameter: string | null;
  valve_installed: boolean;
  mechanical_installed: boolean;
  steel_pipe_installed: boolean;
  flange_installed: boolean;
  cover_installed: boolean;
  needs_revision: boolean;
  revision_note: string | null;
  included_in_progress_payment: boolean;
  note: string | null;
};

function fromLineRow(row: LineRow): PipelineLine {
  return {
    id: row.id,
    name: row.name,
    mainLine: row.main_line,
    branchName: row.branch_name,
    pipeNote: row.pipe_note ?? ""
  };
}

function toLinePayload(line: Omit<PipelineLine, "id">) {
  return {
    name: line.name,
    main_line: line.mainLine,
    branch_name: line.branchName,
    pipe_note: line.pipeNote || null
  };
}

function fromArtStructureRow(row: ArtStructureRow): ArtStructure {
  return {
    id: row.id,
    code: row.code,
    line: row.line,
    kilometer: row.kilometer,
    type: row.type,
    detail: row.detail,
    status: row.status,
    concreteSize: row.concrete_size ?? "",
    coverSize: row.cover_size ?? "",
    airValveDiameter: row.air_valve_diameter ?? "",
    valveInstalled: row.valve_installed,
    mechanicalInstalled: row.mechanical_installed,
    steelPipeInstalled: row.steel_pipe_installed,
    flangeInstalled: row.flange_installed,
    coverInstalled: row.cover_installed,
    needsRevision: row.needs_revision,
    revisionNote: row.revision_note ?? "",
    includedInProgressPayment: row.included_in_progress_payment,
    note: row.note ?? ""
  };
}

function toArtStructurePayload(item: Omit<ArtStructure, "id">) {
  return {
    code: item.code,
    line: item.line,
    kilometer: item.kilometer,
    type: item.type,
    detail: item.detail,
    status: item.status,
    concrete_size: item.concreteSize || null,
    cover_size: item.coverSize || null,
    air_valve_diameter: item.airValveDiameter || null,
    valve_installed: Boolean(item.valveInstalled),
    mechanical_installed: Boolean(item.mechanicalInstalled),
    steel_pipe_installed: Boolean(item.steelPipeInstalled),
    flange_installed: Boolean(item.flangeInstalled),
    cover_installed: Boolean(item.coverInstalled),
    needs_revision: Boolean(item.needsRevision),
    revision_note: item.revisionNote || null,
    included_in_progress_payment: Boolean(item.includedInProgressPayment),
    note: item.note || null
  };
}

function isUniqueViolation(error: { code?: string; message?: string }) {
  return error.code === "23505" || Boolean(error.message?.includes("duplicate key"));
}

export async function fetchLines(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("pipeline_lines")
    .select("id,name,main_line,branch_name,pipe_note")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data as LineRow[]).map(fromLineRow);
}

export async function createLine(supabase: SupabaseClient, line: Omit<PipelineLine, "id">) {
  const { data, error } = await supabase
    .from("pipeline_lines")
    .insert(toLinePayload(line))
    .select("id,name,main_line,branch_name,pipe_note")
    .single();

  if (error) throw error;
  return fromLineRow(data as LineRow);
}

export async function updateLine(
  supabase: SupabaseClient,
  id: string,
  line: Omit<PipelineLine, "id">
) {
  const { data, error } = await supabase
    .from("pipeline_lines")
    .update(toLinePayload(line))
    .eq("id", id)
    .select("id,name,main_line,branch_name,pipe_note")
    .single();

  if (error) throw error;
  return fromLineRow(data as LineRow);
}

export async function deleteLineById(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from("pipeline_lines").delete().eq("id", id);
  if (error) throw error;
}

export async function updateArtStructureLineName(
  supabase: SupabaseClient,
  previousLine: string,
  nextLine: string
) {
  const { error } = await supabase
    .from("art_structures")
    .update({ line: nextLine })
    .eq("line", previousLine);

  if (error) throw error;
}

export async function fetchArtStructures(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("art_structures")
    .select("*")
    .order("line", { ascending: true })
    .order("kilometer", { ascending: true });

  if (error) throw error;
  return (data as ArtStructureRow[]).map(fromArtStructureRow);
}

export async function createArtStructure(
  supabase: SupabaseClient,
  item: Omit<ArtStructure, "id">
) {
  const { data, error } = await supabase
    .from("art_structures")
    .insert(toArtStructurePayload(item))
    .select("*")
    .single();

  if (error) {
    if (isUniqueViolation(error)) {
      throw new Error("Bu hatta ayni kilometrede zaten bir sanat yapisi var.");
    }
    throw error;
  }
  return fromArtStructureRow(data as ArtStructureRow);
}

export async function updateArtStructure(
  supabase: SupabaseClient,
  id: string,
  item: Omit<ArtStructure, "id">
) {
  const { data, error } = await supabase
    .from("art_structures")
    .update({ ...toArtStructurePayload(item), updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    if (isUniqueViolation(error)) {
      throw new Error("Bu hatta ayni kilometrede zaten bir sanat yapisi var.");
    }
    throw error;
  }
  return fromArtStructureRow(data as ArtStructureRow);
}

export async function deleteArtStructureById(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from("art_structures").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchPresets(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("art_structure_presets")
    .select("name")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data as Array<{ name: string }>).map((row) => row.name);
}

export async function createPreset(supabase: SupabaseClient, name: string) {
  const { error } = await supabase.from("art_structure_presets").insert({ name });
  if (error && error.code !== "23505") throw error;
}
