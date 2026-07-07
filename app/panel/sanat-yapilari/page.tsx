"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Construction,
  Download,
  FileText,
  Filter,
  HardHat,
  LogOut,
  MapPinned,
  Pencil,
  Plus,
  Route,
  Save,
  Search,
  Trash2,
  X
} from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase";
import { AppUser, getAppUser } from "@/lib/permissions";
import {
  ArtStructure,
  ArtStructureType,
  artStructureTypes,
  defaultArtStructurePresets,
  kilometerToMeters,
  sortArtStructuresByLineAndKm
} from "@/lib/art-structures";
import { defaultLines, sortLines } from "@/lib/lines";
import {
  createArtStructure,
  createPreset,
  deleteArtStructureById,
  fetchArtStructures,
  fetchLines,
  fetchPresets,
  updateArtStructure
} from "@/lib/supabase-data";

type Profile = {
  full_name: string;
};

type FormState = Omit<ArtStructure, "id">;
type ReportFieldKey =
  | "code"
  | "line"
  | "kilometer"
  | "meter"
  | "type"
  | "detail"
  | "concreteSize"
  | "coverSize"
  | "airValveDiameter"
  | "valveInstalled"
  | "mechanicalInstalled"
  | "steelPipeInstalled"
  | "flangeInstalled"
  | "coverInstalled"
  | "needsRevision"
  | "revisionNote"
  | "includedInProgressPayment"
  | "status"
  | "note";

type ReportField = {
  key: ReportFieldKey;
  label: string;
  getValue: (item: ArtStructure) => string;
};

const emptyForm: FormState = {
  code: "",
  line: "",
  kilometer: "",
  type: "Hidrant",
  detail: "",
  status: "Tamamlanmadi",
  concreteSize: "",
  coverSize: "",
  airValveDiameter: "",
  valveInstalled: false,
  mechanicalInstalled: false,
  steelPipeInstalled: false,
  flangeInstalled: false,
  coverInstalled: false,
  needsRevision: false,
  revisionNote: "",
  includedInProgressPayment: false,
  note: ""
};

const reportFields: ReportField[] = [
  { key: "code", label: "No", getValue: (item) => item.code },
  { key: "line", label: "Hat", getValue: (item) => item.line },
  { key: "kilometer", label: "Kilometre", getValue: (item) => item.kilometer },
  {
    key: "meter",
    label: "Metre",
    getValue: (item) => kilometerToMeters(item.kilometer).toLocaleString("tr-TR")
  },
  { key: "type", label: "Tur", getValue: (item) => item.type },
  { key: "detail", label: "Ozellik", getValue: (item) => item.detail },
  { key: "concreteSize", label: "Betonarme Olcusu", getValue: (item) => item.concreteSize ?? "" },
  { key: "coverSize", label: "Kapak Olcusu", getValue: (item) => item.coverSize ?? "" },
  { key: "airValveDiameter", label: "Vantuz Capi", getValue: (item) => item.airValveDiameter ?? "" },
  { key: "valveInstalled", label: "Vana", getValue: (item) => (item.valveInstalled ? "Evet" : "Hayir") },
  {
    key: "mechanicalInstalled",
    label: "Mekanik Parca",
    getValue: (item) => (item.mechanicalInstalled ? "Evet" : "Hayir")
  },
  {
    key: "steelPipeInstalled",
    label: "Celik Boru",
    getValue: (item) => (item.steelPipeInstalled ? "Evet" : "Hayir")
  },
  { key: "flangeInstalled", label: "Flans", getValue: (item) => (item.flangeInstalled ? "Evet" : "Hayir") },
  { key: "coverInstalled", label: "Kapak", getValue: (item) => (item.coverInstalled ? "Evet" : "Hayir") },
  { key: "needsRevision", label: "Duzeltme", getValue: (item) => (item.needsRevision ? "Evet" : "Hayir") },
  { key: "revisionNote", label: "Duzeltme Notu", getValue: (item) => item.revisionNote ?? "" },
  {
    key: "includedInProgressPayment",
    label: "Hakedise Alindi",
    getValue: (item) => (item.includedInProgressPayment ? "Evet" : "Hayir")
  },
  { key: "status", label: "Durum", getValue: (item) => item.status },
  { key: "note", label: "Not", getValue: (item) => item.note ?? "" }
];

const defaultReportFieldKeys: ReportFieldKey[] = [
  "code",
  "line",
  "kilometer",
  "type",
  "detail",
  "status",
  "revisionNote",
  "note"
];

function normalizeText(value: string) {
  return value.toLocaleLowerCase("tr-TR").trim();
}

function downloadCsv(items: ArtStructure[], selectedFields: ReportField[]) {
  const headers = selectedFields.map((field) => field.label);
  const rows = items.map((item) => selectedFields.map((field) => field.getValue(item)));

  const csv = [headers, ...rows]
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
        .join(";")
    )
    .join("\n");

  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "sanat-yapilari.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export default function ArtStructuresPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseClient(), []);
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<ArtStructure[]>([]);
  const [presets, setPresets] = useState(defaultArtStructurePresets);
  const [newPreset, setNewPreset] = useState("");
  const [lineOptions, setLineOptions] = useState(defaultLines.map((line) => line.name));
  const [typeFilter, setTypeFilter] = useState("Tum Turler");
  const [lineFilter, setLineFilter] = useState("Tum Hatlar");
  const [statusFilter, setStatusFilter] = useState("Tum Durumlar");
  const [progressPaymentFilter, setProgressPaymentFilter] = useState("Tum Hakedisler");
  const [search, setSearch] = useState("");
  const [startKm, setStartKm] = useState("");
  const [endKm, setEndKm] = useState("");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [selectedReportFields, setSelectedReportFields] =
    useState<ReportFieldKey[]>(defaultReportFieldKeys);

  const lines = useMemo(() => {
    return lineOptions;
  }, [lineOptions]);

  const filteredStructures = useMemo(() => {
    const query = normalizeText(search);
    const startMeter = startKm ? kilometerToMeters(startKm) : null;
    const endMeter = endKm ? kilometerToMeters(endKm) : null;

    const filtered = items
      .filter((item) => typeFilter === "Tum Turler" || item.type === typeFilter)
      .filter((item) => lineFilter === "Tum Hatlar" || item.line === lineFilter)
      .filter((item) => statusFilter === "Tum Durumlar" || item.status === statusFilter)
      .filter((item) => {
        if (progressPaymentFilter === "Tum Hakedisler") return true;
        if (progressPaymentFilter === "Hakedise Alindi") return Boolean(item.includedInProgressPayment);
        return !item.includedInProgressPayment;
      })
      .filter((item) => {
        if (!query) return true;
        return [
          item.code,
          item.line,
          item.kilometer,
          item.type,
          item.detail,
          item.concreteSize ?? "",
          item.coverSize ?? "",
          item.airValveDiameter ?? "",
          item.revisionNote ?? "",
          item.includedInProgressPayment ? "hakedise alindi" : "hakedise alinmadi",
          item.note ?? ""
        ]
          .map(normalizeText)
          .some((value) => value.includes(query));
      })
      .filter((item) => {
        const meters = kilometerToMeters(item.kilometer);
        if (startMeter !== null && meters < startMeter) return false;
        if (endMeter !== null && meters > endMeter) return false;
        return true;
      });

    return sortArtStructuresByLineAndKm(filtered);
  }, [endKm, items, lineFilter, progressPaymentFilter, search, startKm, statusFilter, typeFilter]);

  const counts = useMemo(() => {
    const completed = items.filter((item) => item.status === "Tamamlandi").length;
    return {
      total: items.length,
      completed,
      incomplete: items.length - completed
    };
  }, [items]);

  const selectedFields = useMemo(() => {
    return reportFields.filter((field) => selectedReportFields.includes(field.key));
  }, [selectedReportFields]);

  const shouldAskAirValveDiameter = useMemo(() => {
    return form.type === "Vantuz" || normalizeText(form.detail).includes("vantuz");
  }, [form.detail, form.type]);

  useEffect(() => {
    if (!supabase) {
      router.replace("/");
      return;
    }

    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.replace("/");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", data.user.id)
        .single();

      setUser(getAppUser(data.user.email, profileData?.full_name));
      const [lineData, structureData, presetData] = await Promise.all([
        fetchLines(supabase),
        fetchArtStructures(supabase),
        fetchPresets(supabase)
      ]);

      const nextLineOptions = sortLines(lineData).map((line) => line.name);
      const hatParam = new URLSearchParams(window.location.search).get("hat");

      setLineOptions(nextLineOptions);
      setLineFilter(hatParam || "Tum Hatlar");
      setItems(structureData);
      setPresets(presetData.length > 0 ? presetData : defaultArtStructurePresets);
      setIsLoading(false);
    });
  }, [router, supabase]);

  async function handleLogout() {
    if (!supabase) return;

    await supabase.auth.signOut();
    router.replace("/");
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setIsFormOpen(false);
    setFormError("");
  }

  function openCreateForm() {
    if (!user?.canEdit) return;

    setForm({
      ...emptyForm,
      line: lineFilter !== "Tum Hatlar" ? lineFilter : lines[0] ?? "",
      code: `SY-${String(items.length + 1).padStart(3, "0")}`
    });
    setFormError("");
    setEditingId(null);
    setIsFormOpen(true);
  }

  function openEditForm(item: ArtStructure) {
    if (!user?.canEdit) return;

    setForm({
      code: item.code,
      line: item.line,
      kilometer: item.kilometer,
      type: item.type,
      detail: item.detail,
      status: item.status,
      concreteSize: item.concreteSize ?? "",
      coverSize: item.coverSize ?? "",
      airValveDiameter: item.airValveDiameter ?? "",
      valveInstalled: item.valveInstalled ?? false,
      mechanicalInstalled: item.mechanicalInstalled ?? false,
      steelPipeInstalled: item.steelPipeInstalled ?? false,
      flangeInstalled: item.flangeInstalled ?? false,
      coverInstalled: item.coverInstalled ?? false,
      needsRevision: item.needsRevision ?? false,
      revisionNote: item.revisionNote ?? "",
      includedInProgressPayment: item.includedInProgressPayment ?? false,
      note: item.note ?? ""
    });
    setFormError("");
    setEditingId(item.id);
    setIsFormOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user?.canEdit || !supabase) return;
    setFormError("");

    const hasDuplicate = items.some(
      (item) =>
        item.id !== editingId &&
        item.line === form.line &&
        item.kilometer.trim() === form.kilometer.trim()
    );

    if (hasDuplicate) {
      setFormError("Bu hatta ayni kilometrede zaten bir sanat yapisi var.");
      return;
    }

    const isComplete =
      Boolean(form.valveInstalled) &&
      Boolean(form.mechanicalInstalled) &&
      Boolean(form.steelPipeInstalled) &&
      Boolean(form.flangeInstalled) &&
      Boolean(form.coverInstalled) &&
      !form.needsRevision;

    const nextForm = {
      ...form,
      status: isComplete ? ("Tamamlandi" as const) : ("Tamamlanmadi" as const)
    };

    if (editingId) {
      try {
        const updatedItem = await updateArtStructure(supabase, editingId, nextForm);
        setItems((currentItems) =>
          currentItems.map((item) => (item.id === editingId ? updatedItem : item))
        );
        resetForm();
      } catch (error) {
        setFormError(error instanceof Error ? error.message : "Kayit guncellenemedi.");
      }
      return;
    }

    try {
      const createdItem = await createArtStructure(supabase, nextForm);
      setItems((currentItems) => [...currentItems, createdItem]);
      resetForm();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Kayit olusturulamadi.");
    }
  }

  async function addPreset() {
    const cleanPreset = newPreset.trim();
    if (!cleanPreset || !supabase) return;

    if (user?.canEdit) {
      await createPreset(supabase, cleanPreset);
    }
    setPresets((currentPresets) =>
      currentPresets.includes(cleanPreset) ? currentPresets : [...currentPresets, cleanPreset].sort()
    );
    setForm((currentForm) => ({ ...currentForm, detail: cleanPreset }));
    setNewPreset("");
  }

  async function deleteItem(itemId: string) {
    if (!user?.canEdit || !supabase) return;

    const shouldDelete = window.confirm("Bu sanat yapisi silinsin mi?");
    if (!shouldDelete) return;

    await deleteArtStructureById(supabase, itemId);
    setItems((currentItems) => currentItems.filter((item) => item.id !== itemId));
  }

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((currentForm) => ({ ...currentForm, [key]: value }));
  }

  function toggleReportField(fieldKey: ReportFieldKey) {
    setSelectedReportFields((currentFields) => {
      if (currentFields.includes(fieldKey)) {
        const nextFields = currentFields.filter((key) => key !== fieldKey);
        return nextFields.length > 0 ? nextFields : currentFields;
      }

      return [...currentFields, fieldKey];
    });
  }

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f4f1ea] text-[#1d2522]">
        <p className="text-sm text-[#61706b]">Sanat yapilari aciliyor...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f1ea] text-[#1d2522]">
      <header className="border-b border-[#d7d0c4] bg-white print:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded bg-[#1f4d3a] text-white">
              <HardHat size={21} strokeWidth={2.2} />
            </span>
            <div>
              <p className="font-semibold">YS Muhendislik Santiye Takip</p>
              <p className="text-sm text-[#61706b]">
                {user?.name ?? "Kullanici"} - {user?.title ?? "Goruntuleme"}
              </p>
            </div>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded border border-[#c8c0b3] bg-white px-3 py-2 text-sm font-medium"
            onClick={handleLogout}
            type="button"
          >
            <LogOut size={16} />
            Cikis
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="print:hidden">
          <Link className="inline-flex items-center gap-2 text-sm font-medium text-[#61706b]" href="/panel">
            <ArrowLeft size={16} />
            Panele don
          </Link>
        </div>

        <div className="mt-5 flex flex-col justify-between gap-4 border-b border-[#d7d0c4] pb-5 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-[#1f4d3a]">
              <Construction size={17} />
              Sanat Yapilari
            </div>
            <h1 className="mt-2 text-2xl font-semibold">Kilometre Sirali Liste</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#61706b] print:hidden">
              Kayit ekle, duzenle, sil, filtrele; gorunen listeyi Excel veya PDF olarak disari al.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 print:hidden">
            {user?.canEdit ? (
              <button
                className="inline-flex items-center gap-2 rounded bg-[#1f4d3a] px-4 py-2 text-sm font-semibold text-white"
                onClick={openCreateForm}
                type="button"
              >
                <Plus size={16} />
                Yeni Kayit
              </button>
            ) : null}
            <button
              className="inline-flex items-center gap-2 rounded border border-[#c8c0b3] bg-white px-4 py-2 text-sm font-semibold"
              onClick={() => downloadCsv(filteredStructures, selectedFields)}
              type="button"
            >
              <Download size={16} />
              Excel
            </button>
            <button
              className="inline-flex items-center gap-2 rounded border border-[#c8c0b3] bg-white px-4 py-2 text-sm font-semibold"
              onClick={() => window.print()}
              type="button"
            >
              <FileText size={16} />
              PDF
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3 print:hidden">
          <div className="rounded border border-[#d7d0c4] bg-white p-4">
            <p className="text-sm text-[#61706b]">Toplam</p>
            <p className="mt-1 text-2xl font-semibold">{counts.total}</p>
          </div>
          <div className="rounded border border-[#d7d0c4] bg-white p-4">
            <p className="text-sm text-[#61706b]">Tamamlandi</p>
            <p className="mt-1 text-2xl font-semibold text-[#1f4d3a]">{counts.completed}</p>
          </div>
          <div className="rounded border border-[#d7d0c4] bg-white p-4">
            <p className="text-sm text-[#61706b]">Tamamlanmadi</p>
            <p className="mt-1 text-2xl font-semibold text-[#9c3d2f]">{counts.incomplete}</p>
          </div>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1 print:hidden">
          <button
            className={
              lineFilter === "Tum Hatlar"
                ? "shrink-0 rounded bg-[#1f4d3a] px-3 py-2 text-sm font-semibold text-white"
                : "shrink-0 rounded border border-[#c8c0b3] bg-white px-3 py-2 text-sm font-semibold"
            }
            onClick={() => setLineFilter("Tum Hatlar")}
            type="button"
          >
            Tum Hatlar
          </button>
          {lines.map((line) => (
            <button
              className={
                lineFilter === line
                  ? "shrink-0 rounded bg-[#1f4d3a] px-3 py-2 text-sm font-semibold text-white"
                  : "shrink-0 rounded border border-[#c8c0b3] bg-white px-3 py-2 text-sm font-semibold"
              }
              key={line}
              onClick={() => setLineFilter(line)}
              type="button"
            >
              {line}
            </button>
          ))}
        </div>

        {isFormOpen && user?.canEdit ? (
          <form
            className="mt-5 grid gap-4 rounded border border-[#d7d0c4] bg-white p-4 print:hidden"
            onSubmit={handleSubmit}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">{editingId ? "Sanat yapisini duzenle" : "Yeni sanat yapisi"}</h2>
              <button className="rounded p-2 text-[#61706b]" onClick={resetForm} type="button">
                <X size={18} />
              </button>
            </div>

            {formError ? (
              <div className="rounded border border-[#d8b6ad] bg-[#f6e7e1] px-3 py-2 text-sm font-medium text-[#9c3d2f]">
                {formError}
              </div>
            ) : null}

            <div className="grid gap-3 md:grid-cols-4">
              <label className="grid gap-2 text-sm font-medium">
                No
                <input
                  className="rounded border border-[#c8c0b3] px-3 py-2 outline-none focus:border-[#1f4d3a]"
                  onChange={(event) => updateForm("code", event.target.value)}
                  required
                  value={form.code}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Hat
                <select
                  className="rounded border border-[#c8c0b3] bg-white px-3 py-2 outline-none focus:border-[#1f4d3a]"
                  onChange={(event) => updateForm("line", event.target.value)}
                  required
                  value={form.line}
                >
                  {lines.map((line) => (
                    <option key={line}>{line}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Kilometre
                <input
                  className="rounded border border-[#c8c0b3] px-3 py-2 outline-none focus:border-[#1f4d3a]"
                  onChange={(event) => updateForm("kilometer", event.target.value)}
                  placeholder="15+520,00"
                  required
                  value={form.kilometer}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Tur
                <select
                  className="rounded border border-[#c8c0b3] bg-white px-3 py-2 outline-none focus:border-[#1f4d3a]"
                  onChange={(event) => updateForm("type", event.target.value as ArtStructureType)}
                  value={form.type}
                >
                  {artStructureTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_220px]">
              <label className="grid gap-2 text-sm font-medium">
                Ozellik on tanimi
                <select
                  className="rounded border border-[#c8c0b3] bg-white px-3 py-2 outline-none focus:border-[#1f4d3a]"
                  onChange={(event) => updateForm("detail", event.target.value)}
                  required
                  value={form.detail}
                >
                  <option value="">Sec</option>
                  {presets.map((preset) => (
                    <option key={preset}>{preset}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Durum
                <input
                  className="rounded border border-[#c8c0b3] bg-[#f4f1ea] px-3 py-2 text-[#61706b]"
                  readOnly
                  value={
                    form.valveInstalled &&
                    form.mechanicalInstalled &&
                    form.steelPipeInstalled &&
                    form.flangeInstalled &&
                    form.coverInstalled &&
                    !form.needsRevision
                      ? "Tamamlandi"
                      : "Tamamlanmadi"
                  }
                />
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <label className="grid gap-2 text-sm font-medium">
                Yeni on tanim
                <input
                  className="rounded border border-[#c8c0b3] px-3 py-2 outline-none focus:border-[#1f4d3a]"
                  onChange={(event) => setNewPreset(event.target.value)}
                  placeholder="Orn. Cift cikisli, vantuzlu, hat sonu degil"
                  value={newPreset}
                />
              </label>
              <button
                className="self-end rounded border border-[#c8c0b3] bg-white px-4 py-2 text-sm font-semibold"
                onClick={addPreset}
                type="button"
              >
                On Tanim Ekle
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <label className="grid gap-2 text-sm font-medium">
                Betonarme olcusu
                <input
                  className="rounded border border-[#c8c0b3] px-3 py-2 outline-none focus:border-[#1f4d3a]"
                  onChange={(event) => updateForm("concreteSize", event.target.value)}
                  placeholder="Orn. 2.00 x 2.00 x 2.20"
                  value={form.concreteSize}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Kapak olcusu
                <input
                  className="rounded border border-[#c8c0b3] px-3 py-2 outline-none focus:border-[#1f4d3a]"
                  onChange={(event) => updateForm("coverSize", event.target.value)}
                  placeholder="Orn. 60 x 60"
                  value={form.coverSize}
                />
              </label>
              {shouldAskAirValveDiameter ? (
                <label className="grid gap-2 text-sm font-medium">
                  Vantuz capi
                  <input
                    className="rounded border border-[#c8c0b3] px-3 py-2 outline-none focus:border-[#1f4d3a]"
                    onChange={(event) => updateForm("airValveDiameter", event.target.value)}
                    placeholder="Orn. 50 mm"
                    value={form.airValveDiameter}
                  />
                </label>
              ) : null}
            </div>

            <div className="grid gap-3 rounded border border-[#d7d0c4] bg-[#f8f6f1] p-3 md:grid-cols-3">
              {[
                ["valveInstalled", "Vana takili mi"],
                ["mechanicalInstalled", "Mekanik parca takili mi"],
                ["steelPipeInstalled", "Celik boru takili mi"],
                ["flangeInstalled", "Flans takili mi"],
                ["coverInstalled", "Kapak takili mi"],
                ["includedInProgressPayment", "Hakedise alindi mi"],
                ["needsRevision", "Duzeltme gerekli mi"]
              ].map(([key, label]) => (
                <label className="flex items-center gap-2 text-sm font-medium" key={key}>
                  <input
                    checked={Boolean(form[key as keyof FormState])}
                    onChange={(event) =>
                      updateForm(key as keyof FormState, event.target.checked as never)
                    }
                    type="checkbox"
                  />
                  {label}
                </label>
              ))}
            </div>

            {form.needsRevision ? (
              <label className="grid gap-2 text-sm font-medium">
                Duzeltme notu
                <input
                  className="rounded border border-[#c8c0b3] px-3 py-2 outline-none focus:border-[#1f4d3a]"
                  onChange={(event) => updateForm("revisionNote", event.target.value)}
                  placeholder="Orn. Temizlik gerekli"
                  value={form.revisionNote}
                />
              </label>
            ) : null}

            <label className="grid gap-2 text-sm font-medium">
              Not
              <textarea
                className="min-h-20 rounded border border-[#c8c0b3] px-3 py-2 outline-none focus:border-[#1f4d3a]"
                onChange={(event) => updateForm("note", event.target.value)}
                value={form.note}
              />
            </label>

            <div className="flex justify-end gap-2">
              <button
                className="inline-flex items-center gap-2 rounded border border-[#c8c0b3] bg-white px-4 py-2 text-sm font-semibold"
                onClick={resetForm}
                type="button"
              >
                Vazgec
              </button>
              <button
                className="inline-flex items-center gap-2 rounded bg-[#1f4d3a] px-4 py-2 text-sm font-semibold text-white"
                type="submit"
              >
                <Save size={16} />
                Kaydet
              </button>
            </div>
          </form>
        ) : null}

        <div className="mt-5 grid gap-3 rounded border border-[#d7d0c4] bg-white p-4 md:grid-cols-7 print:hidden">
          <label className="grid gap-2 text-sm font-medium md:col-span-2">
            <span className="inline-flex items-center gap-2">
              <Search size={15} />
              Arama
            </span>
            <input
              className="rounded border border-[#c8c0b3] px-3 py-2 outline-none focus:border-[#1f4d3a]"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="No, hat, km, tur, not"
              value={search}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium">
            <span className="inline-flex items-center gap-2">
              <Filter size={15} />
              Tur
            </span>
            <select
              className="rounded border border-[#c8c0b3] bg-white px-3 py-2 outline-none focus:border-[#1f4d3a]"
              onChange={(event) => setTypeFilter(event.target.value)}
              value={typeFilter}
            >
              <option>Tum Turler</option>
              {artStructureTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium">
            <span className="inline-flex items-center gap-2">
              <Route size={15} />
              Hat
            </span>
            <select
              className="rounded border border-[#c8c0b3] bg-white px-3 py-2 outline-none focus:border-[#1f4d3a]"
              onChange={(event) => setLineFilter(event.target.value)}
              value={lineFilter}
            >
              <option>Tum Hatlar</option>
              {lines.map((line) => (
                <option key={line}>{line}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Durum
            <select
              className="rounded border border-[#c8c0b3] bg-white px-3 py-2 outline-none focus:border-[#1f4d3a]"
              onChange={(event) => setStatusFilter(event.target.value)}
              value={statusFilter}
            >
              <option>Tum Durumlar</option>
              <option>Tamamlanmadi</option>
              <option>Tamamlandi</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Hakedis
            <select
              className="rounded border border-[#c8c0b3] bg-white px-3 py-2 outline-none focus:border-[#1f4d3a]"
              onChange={(event) => setProgressPaymentFilter(event.target.value)}
              value={progressPaymentFilter}
            >
              <option>Tum Hakedisler</option>
              <option>Hakedise Alindi</option>
              <option>Hakedise Alinmadi</option>
            </select>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="grid gap-2 text-sm font-medium">
              Baslangic
              <input
                className="rounded border border-[#c8c0b3] px-3 py-2 outline-none focus:border-[#1f4d3a]"
                onChange={(event) => setStartKm(event.target.value)}
                placeholder="0+000,00"
                value={startKm}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Bitis
              <input
                className="rounded border border-[#c8c0b3] px-3 py-2 outline-none focus:border-[#1f4d3a]"
                onChange={(event) => setEndKm(event.target.value)}
                placeholder="20+000,00"
                value={endKm}
              />
            </label>
          </div>
        </div>

        <div className="mt-5 rounded border border-[#d7d0c4] bg-white p-4 print:hidden">
          <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
            <div>
              <h2 className="font-semibold">Rapor alanlari</h2>
              <p className="mt-1 text-sm text-[#61706b]">
                Excel ve PDF raporuna girecek kolonlari sec.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                className="rounded border border-[#c8c0b3] bg-white px-3 py-2 text-sm font-semibold"
                onClick={() => setSelectedReportFields(reportFields.map((field) => field.key))}
                type="button"
              >
                Hepsi
              </button>
              <button
                className="rounded border border-[#c8c0b3] bg-white px-3 py-2 text-sm font-semibold"
                onClick={() => setSelectedReportFields(defaultReportFieldKeys)}
                type="button"
              >
                Varsayilan
              </button>
            </div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {reportFields.map((field) => (
              <label className="flex items-center gap-2 text-sm" key={field.key}>
                <input
                  checked={selectedReportFields.includes(field.key)}
                  onChange={() => toggleReportField(field.key)}
                  type="checkbox"
                />
                {field.label}
              </label>
            ))}
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded border border-[#d7d0c4] bg-white print:hidden">
          <div
            className={
              user?.canEdit
                ? "grid grid-cols-[90px_110px_1fr_120px_140px_120px] gap-4 border-b border-[#d7d0c4] bg-[#eef0ec] px-4 py-3 text-sm font-semibold text-[#33413c] max-lg:hidden"
                : "grid grid-cols-[90px_110px_1fr_120px_140px] gap-4 border-b border-[#d7d0c4] bg-[#eef0ec] px-4 py-3 text-sm font-semibold text-[#33413c] max-lg:hidden"
            }
          >
            <span>Km</span>
            <span>Hat</span>
            <span>Sanat yapisi</span>
            <span>Tur</span>
            <span>Durum</span>
            {user?.canEdit ? <span className="print:hidden">Islem</span> : null}
          </div>

          <div className="divide-y divide-[#e4ded4]">
            {filteredStructures.map((item) => (
              <article
                className={
                  user?.canEdit
                    ? "grid gap-3 px-4 py-4 lg:grid-cols-[90px_110px_1fr_120px_140px_120px] lg:items-center"
                    : "grid gap-3 px-4 py-4 lg:grid-cols-[90px_110px_1fr_120px_140px] lg:items-center"
                }
                key={item.id}
              >
                <div className="flex items-center gap-2 font-semibold text-[#1f4d3a]">
                  <MapPinned size={16} />
                  {item.kilometer}
                </div>
                <div className="text-sm font-medium">{item.line}</div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold">{item.code}</h2>
                  </div>
                  <p className="mt-1 text-sm text-[#61706b]">{item.detail}</p>
                  <p className="mt-1 text-xs text-[#61706b]">
                    Betonarme: {item.concreteSize || "-"} | Kapak: {item.coverSize || "-"}
                    {item.airValveDiameter ? ` | Vantuz capi: ${item.airValveDiameter}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-[#61706b]">
                    Vana {item.valveInstalled ? "ok" : "eksik"} | Mekanik{" "}
                    {item.mechanicalInstalled ? "ok" : "eksik"} | Celik boru{" "}
                    {item.steelPipeInstalled ? "ok" : "eksik"} | Flans{" "}
                    {item.flangeInstalled ? "ok" : "eksik"} | Kapak{" "}
                    {item.coverInstalled ? "ok" : "eksik"}
                  </p>
                  <p className="mt-1 text-xs text-[#61706b]">
                    Hakedis: {item.includedInProgressPayment ? "Alindi" : "Alinmadi"}
                  </p>
                  {item.needsRevision ? (
                    <p className="mt-1 text-xs font-semibold text-[#9c3d2f]">
                      Duzeltme: {item.revisionNote || "Not girilmedi"}
                    </p>
                  ) : null}
                  {item.note ? <p className="mt-1 text-xs text-[#8a6a48]">{item.note}</p> : null}
                </div>
                <div>
                  <span className="rounded bg-[#eef0ec] px-2 py-1 text-xs text-[#33413c]">
                    {item.type}
                  </span>
                </div>
                <div>
                  <span
                    className={
                      item.status === "Tamamlandi"
                        ? "rounded bg-[#e4f0e6] px-3 py-2 text-sm text-[#1f4d3a]"
                        : "rounded bg-[#f6e7e1] px-3 py-2 text-sm text-[#9c3d2f]"
                    }
                  >
                    {item.status}
                  </span>
                </div>
                {user?.canEdit ? (
                  <div className="flex gap-2 print:hidden">
                    <button
                      className="inline-flex size-9 items-center justify-center rounded border border-[#c8c0b3] bg-white"
                      onClick={() => openEditForm(item)}
                      title="Duzenle"
                      type="button"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="inline-flex size-9 items-center justify-center rounded border border-[#d8b6ad] bg-white text-[#9c3d2f]"
                      onClick={() => deleteItem(item.id)}
                      title="Sil"
                      type="button"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>

          {filteredStructures.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-[#61706b]">
              Filtrelere uygun sanat yapisi bulunamadi.
            </div>
          ) : null}
        </div>

        <div className="hidden print:block">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                {selectedFields.map((field) => (
                  <th className="border border-[#777] px-2 py-1 text-left" key={field.key}>
                    {field.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredStructures.map((item) => (
                <tr key={item.id}>
                  {selectedFields.map((field) => (
                    <td className="border border-[#999] px-2 py-1" key={field.key}>
                      {field.getValue(item)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
