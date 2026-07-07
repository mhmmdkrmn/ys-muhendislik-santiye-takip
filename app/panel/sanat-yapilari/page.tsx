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
  artStructures,
  artStructuresStorageKey,
  artStructureTypes,
  kilometerToMeters,
  sortArtStructuresByLineAndKm
} from "@/lib/art-structures";
import { defaultLines, linesStorageKey, mergeRequiredS1Lines, sortLines } from "@/lib/lines";

type Profile = {
  full_name: string;
};

type FormState = Omit<ArtStructure, "id">;

const emptyForm: FormState = {
  code: "",
  line: "",
  kilometer: "",
  type: "Hidrant",
  detail: "",
  status: "Tamamlanmadi",
  note: ""
};

function normalizeText(value: string) {
  return value.toLocaleLowerCase("tr-TR").trim();
}

function downloadCsv(items: ArtStructure[]) {
  const headers = ["No", "Hat", "Kilometre", "Metre", "Tur", "Ozellik", "Durum", "Not"];
  const rows = items.map((item) => [
    item.code,
    item.line,
    item.kilometer,
    kilometerToMeters(item.kilometer).toLocaleString("tr-TR"),
    item.type,
    item.detail,
    item.status,
    item.note ?? ""
  ]);

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
  const [items, setItems] = useState<ArtStructure[]>(artStructures);
  const [lineOptions, setLineOptions] = useState(defaultLines.map((line) => line.name));
  const [typeFilter, setTypeFilter] = useState("Tum Turler");
  const [lineFilter, setLineFilter] = useState("Tum Hatlar");
  const [statusFilter, setStatusFilter] = useState("Tum Durumlar");
  const [search, setSearch] = useState("");
  const [startKm, setStartKm] = useState("");
  const [endKm, setEndKm] = useState("");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

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
        if (!query) return true;
        return [item.code, item.line, item.kilometer, item.type, item.detail, item.note ?? ""]
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
  }, [endKm, items, lineFilter, search, startKm, statusFilter, typeFilter]);

  const counts = useMemo(() => {
    const completed = items.filter((item) => item.status === "Tamamlandi").length;
    return {
      total: items.length,
      completed,
      incomplete: items.length - completed
    };
  }, [items]);

  useEffect(() => {
    const savedLines = window.localStorage.getItem(linesStorageKey);
    if (savedLines) {
      const parsedLines = mergeRequiredS1Lines(JSON.parse(savedLines));
      window.localStorage.setItem(linesStorageKey, JSON.stringify(parsedLines));
      setLineOptions(sortLines(parsedLines).map((line) => line.name));
    }

    const hatParam = new URLSearchParams(window.location.search).get("hat");
    if (hatParam) {
      setLineFilter(hatParam);
    }

    const savedItems = window.localStorage.getItem(artStructuresStorageKey);
    if (savedItems) {
      setItems(JSON.parse(savedItems));
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(artStructuresStorageKey, JSON.stringify(items));
  }, [items]);

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
  }

  function openCreateForm() {
    if (!user?.canEdit) return;

    setForm({
      ...emptyForm,
      line: lineFilter !== "Tum Hatlar" ? lineFilter : lines[0] ?? "",
      code: `SY-${String(items.length + 1).padStart(3, "0")}`
    });
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
      note: item.note ?? ""
    });
    setEditingId(item.id);
    setIsFormOpen(true);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user?.canEdit) return;

    if (editingId) {
      setItems((currentItems) =>
        currentItems.map((item) => (item.id === editingId ? { ...item, ...form } : item))
      );
      resetForm();
      return;
    }

    setItems((currentItems) => [
      ...currentItems,
      {
        id: crypto.randomUUID(),
        ...form
      }
    ]);
    resetForm();
  }

  function deleteItem(itemId: string) {
    if (!user?.canEdit) return;

    const shouldDelete = window.confirm("Bu sanat yapisi silinsin mi?");
    if (!shouldDelete) return;

    setItems((currentItems) => currentItems.filter((item) => item.id !== itemId));
  }

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((currentForm) => ({ ...currentForm, [key]: value }));
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
              onClick={() => downloadCsv(filteredStructures)}
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
                Ozellik
                <input
                  className="rounded border border-[#c8c0b3] px-3 py-2 outline-none focus:border-[#1f4d3a]"
                  onChange={(event) => updateForm("detail", event.target.value)}
                  placeholder="Cift cikisli, hat sonu, vantuzlu"
                  required
                  value={form.detail}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Durum
                <select
                  className="rounded border border-[#c8c0b3] bg-white px-3 py-2 outline-none focus:border-[#1f4d3a]"
                  onChange={(event) =>
                    updateForm("status", event.target.value as ArtStructure["status"])
                  }
                  value={form.status}
                >
                  <option>Tamamlanmadi</option>
                  <option>Tamamlandi</option>
                </select>
              </label>
            </div>

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

        <div className="mt-5 grid gap-3 rounded border border-[#d7d0c4] bg-white p-4 md:grid-cols-6 print:hidden">
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

        <div className="mt-5 overflow-hidden rounded border border-[#d7d0c4] bg-white">
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
      </section>
    </main>
  );
}
