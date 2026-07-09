import { SupabaseClient } from "@supabase/supabase-js";
import {
  AksuHakedis,
  AksuHakedisRow,
  AksuMetraj,
  AksuPoz,
  AksuProject,
  getAksuProject
} from "@/lib/aksu-data";

type PozRow = {
  id: string;
  poz_no: string;
  ad: string;
  birim: string;
  metraj: number;
  fiyat: number;
  toplam: number;
};

type MetrajRow = {
  id: string;
  tarih: string;
  poz_no: string;
  miktar: number;
  birim: string | null;
  tutar: number | null;
  imalat_yeri: string | null;
  aciklama: string | null;
  hakedis_no: string | null;
};

type HakedisRow = {
  id: string;
  no: number;
  tarih: string;
  kesin: boolean;
  onceki_no: string | null;
  metraj_ids: Array<string | number>;
  rows: AksuHakedisRow[];
  toplam_sozlesme_tutari: number;
  onceki_sozlesme_tutari: number;
  sozlesme_tutari: number;
  fiyat_farki: number;
  fiyat_farki_detay: Array<Record<string, string | number>>;
  fiyat_farki_hata: string | null;
  toplam_bu_hakedis: number;
  tahakkuk_kdv_dahil: number;
};

function fromPozRow(row: PozRow): AksuPoz {
  return {
    id: row.id,
    poz_no: row.poz_no,
    ad: row.ad,
    birim: row.birim,
    metraj: Number(row.metraj ?? 0),
    fiyat: Number(row.fiyat ?? 0),
    toplam: Number(row.toplam ?? 0)
  };
}

function toPozPayload(row: AksuPoz) {
  const metraj = Number(row.metraj ?? 0);
  const fiyat = Number(row.fiyat ?? 0);
  return {
    poz_no: row.poz_no.trim(),
    ad: row.ad.trim(),
    birim: row.birim.trim(),
    metraj,
    fiyat,
    toplam: Number(row.toplam ?? metraj * fiyat)
  };
}

function fromMetrajRow(row: MetrajRow): AksuMetraj {
  return {
    id: row.id,
    tarih: row.tarih,
    poz_no: row.poz_no,
    miktar: Number(row.miktar ?? 0),
    birim: row.birim ?? "",
    tutar: Number(row.tutar ?? 0),
    imalat_yeri: row.imalat_yeri ?? "",
    aciklama: row.aciklama ?? "",
    hakedis_no: row.hakedis_no ?? ""
  };
}

function toMetrajPayload(row: AksuMetraj, poz?: AksuPoz) {
  const miktar = Number(row.miktar ?? 0);
  const fiyat = Number(poz?.fiyat ?? 0);
  return {
    tarih: row.tarih,
    poz_no: row.poz_no,
    miktar,
    birim: row.birim || poz?.birim || null,
    tutar: Number(row.tutar ?? miktar * fiyat),
    imalat_yeri: row.imalat_yeri || null,
    aciklama: row.aciklama || null,
    hakedis_no: row.hakedis_no ? String(row.hakedis_no) : null
  };
}

function fromHakedisRow(row: HakedisRow): AksuHakedis {
  return {
    id: row.id,
    no: row.no,
    tarih: row.tarih,
    kesin: row.kesin,
    onceki_no: row.onceki_no ?? "",
    metraj_ids: row.metraj_ids ?? [],
    rows: row.rows ?? [],
    toplam_sozlesme_tutari: Number(row.toplam_sozlesme_tutari ?? 0),
    onceki_sozlesme_tutari: Number(row.onceki_sozlesme_tutari ?? 0),
    sozlesme_tutari: Number(row.sozlesme_tutari ?? 0),
    fiyat_farki: Number(row.fiyat_farki ?? 0),
    fiyat_farki_detay: row.fiyat_farki_detay ?? [],
    fiyat_farki_hata: row.fiyat_farki_hata ?? "",
    toplam_bu_hakedis: Number(row.toplam_bu_hakedis ?? 0),
    tahakkuk_kdv_dahil: Number(row.tahakkuk_kdv_dahil ?? 0)
  };
}

function toHakedisPayload(row: AksuHakedis) {
  return {
    no: Number(row.no ?? 0),
    tarih: row.tarih,
    kesin: Boolean(row.kesin),
    onceki_no: row.onceki_no ? String(row.onceki_no) : null,
    metraj_ids: row.metraj_ids ?? [],
    rows: row.rows ?? [],
    toplam_sozlesme_tutari: Number(row.toplam_sozlesme_tutari ?? 0),
    onceki_sozlesme_tutari: Number(row.onceki_sozlesme_tutari ?? 0),
    sozlesme_tutari: Number(row.sozlesme_tutari ?? 0),
    fiyat_farki: Number(row.fiyat_farki ?? 0),
    fiyat_farki_detay: row.fiyat_farki_detay ?? [],
    fiyat_farki_hata: row.fiyat_farki_hata || null,
    toplam_bu_hakedis: Number(row.toplam_bu_hakedis ?? 0),
    tahakkuk_kdv_dahil: Number(row.tahakkuk_kdv_dahil ?? 0)
  };
}

export async function fetchAksuProject(supabase: SupabaseClient): Promise<AksuProject> {
  const [pozlar, metraj, hakedis] = await Promise.all([
    fetchAksuPozlar(supabase),
    fetchAksuMetraj(supabase),
    fetchAksuHakedis(supabase)
  ]);
  const base = getAksuProject();
  return { ...base, kesif: pozlar, metraj, hakedis };
}

export async function fetchAksuPozlar(supabase: SupabaseClient) {
  const { data, error } = await supabase.from("aksu_pozlar").select("*").order("poz_no");
  if (error) throw error;
  return (data as PozRow[]).map(fromPozRow);
}

export async function createAksuPoz(supabase: SupabaseClient, row: AksuPoz) {
  const { data, error } = await supabase.from("aksu_pozlar").insert(toPozPayload(row)).select("*").single();
  if (error) throw error;
  return fromPozRow(data as PozRow);
}

export async function updateAksuPoz(supabase: SupabaseClient, id: string, row: AksuPoz) {
  const { data, error } = await supabase.from("aksu_pozlar").update(toPozPayload(row)).eq("id", id).select("*").single();
  if (error) throw error;
  return fromPozRow(data as PozRow);
}

export async function deleteAksuPoz(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from("aksu_pozlar").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchAksuMetraj(supabase: SupabaseClient) {
  const { data, error } = await supabase.from("aksu_metraj").select("*").order("tarih", { ascending: false });
  if (error) throw error;
  return (data as MetrajRow[]).map(fromMetrajRow);
}

export async function createAksuMetraj(supabase: SupabaseClient, row: AksuMetraj, poz?: AksuPoz) {
  const { data, error } = await supabase.from("aksu_metraj").insert(toMetrajPayload(row, poz)).select("*").single();
  if (error) throw error;
  return fromMetrajRow(data as MetrajRow);
}

export async function updateAksuMetraj(supabase: SupabaseClient, id: string, row: AksuMetraj, poz?: AksuPoz) {
  const { data, error } = await supabase.from("aksu_metraj").update(toMetrajPayload(row, poz)).eq("id", id).select("*").single();
  if (error) throw error;
  return fromMetrajRow(data as MetrajRow);
}

export async function deleteAksuMetraj(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from("aksu_metraj").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchAksuHakedis(supabase: SupabaseClient) {
  const { data, error } = await supabase.from("aksu_hakedis").select("*").order("no");
  if (error) throw error;
  return (data as HakedisRow[]).map(fromHakedisRow);
}

export async function upsertAksuHakedis(supabase: SupabaseClient, row: AksuHakedis) {
  const payload = toHakedisPayload(row);
  const query = row.id
    ? supabase.from("aksu_hakedis").update(payload).eq("id", row.id)
    : supabase.from("aksu_hakedis").insert(payload);
  const { data, error } = await query.select("*").single();
  if (error) throw error;
  return fromHakedisRow(data as HakedisRow);
}

export async function deleteAksuHakedis(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from("aksu_hakedis").delete().eq("id", id);
  if (error) throw error;
}

export async function seedAksuFromJson(supabase: SupabaseClient) {
  const source = getAksuProject();
  const { error: pozError } = await supabase.from("aksu_pozlar").upsert(
    (source.kesif ?? []).map(toPozPayload),
    { onConflict: "poz_no" }
  );
  if (pozError) throw pozError;

  for (const record of source.metraj ?? []) {
    const poz = source.kesif?.find((item) => item.poz_no === record.poz_no);
    await createAksuMetraj(supabase, record, poz);
  }

  for (const record of source.hakedis ?? []) {
    await upsertAksuHakedis(supabase, record);
  }
}

