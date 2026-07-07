"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  GitBranch,
  HardHat,
  LogOut,
  Pencil,
  Plus,
  Save,
  Trash2,
  X
} from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase";
import { AppUser, getAppUser } from "@/lib/permissions";
import {
  ArtStructure,
  artStructures,
  artStructuresStorageKey,
  sortArtStructuresByLineAndKm
} from "@/lib/art-structures";
import {
  PipelineLine,
  buildLineName,
  defaultLines,
  linesStorageKey,
  mergeRequiredS1Lines,
  sortLines
} from "@/lib/lines";

type Profile = {
  full_name: string;
};

type LineForm = Omit<PipelineLine, "id" | "name">;

const emptyLineForm: LineForm = {
  mainLine: "S1",
  branchName: "Anahat",
  pipeNote: ""
};

export default function LinesPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseClient(), []);
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lines, setLines] = useState<PipelineLine[]>(defaultLines);
  const [structures, setStructures] = useState<ArtStructure[]>(artStructures);
  const [selectedLine, setSelectedLine] = useState(defaultLines[0]?.name ?? "");
  const [form, setForm] = useState<LineForm>(emptyLineForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const sortedLines = useMemo(() => sortLines(lines), [lines]);

  const selectedStructures = useMemo(() => {
    return sortArtStructuresByLineAndKm(
      structures.filter((structure) => structure.line === selectedLine)
    );
  }, [selectedLine, structures]);

  useEffect(() => {
    const savedLines = window.localStorage.getItem(linesStorageKey);
    if (savedLines) {
      const parsedLines = mergeRequiredS1Lines(JSON.parse(savedLines) as PipelineLine[]);
      setLines(parsedLines);
      window.localStorage.setItem(linesStorageKey, JSON.stringify(parsedLines));
      setSelectedLine(parsedLines[0]?.name ?? "");
    }

    const savedStructures = window.localStorage.getItem(artStructuresStorageKey);
    if (savedStructures) {
      setStructures(JSON.parse(savedStructures));
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(linesStorageKey, JSON.stringify(lines));
  }, [lines]);

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
        .single<Profile>();

      setUser(getAppUser(data.user.email, profileData?.full_name));
      setIsLoading(false);
    });
  }, [router, supabase]);

  async function handleLogout() {
    if (!supabase) return;

    await supabase.auth.signOut();
    router.replace("/");
  }

  function openCreateForm() {
    if (!user?.canEdit) return;

    setForm(emptyLineForm);
    setEditingId(null);
    setIsFormOpen(true);
  }

  function openEditForm(line: PipelineLine) {
    if (!user?.canEdit) return;

    setForm({
      mainLine: line.mainLine,
      branchName: line.branchName,
      pipeNote: line.pipeNote ?? ""
    });
    setEditingId(line.id);
    setIsFormOpen(true);
  }

  function closeForm() {
    setForm(emptyLineForm);
    setEditingId(null);
    setIsFormOpen(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user?.canEdit) return;

    const nextName = buildLineName(form.mainLine, form.branchName);

    if (editingId) {
      const previousLine = lines.find((line) => line.id === editingId);
      setLines((currentLines) =>
        currentLines.map((line) =>
          line.id === editingId
            ? {
                ...line,
                ...form,
                name: nextName
              }
            : line
        )
      );

      if (previousLine && previousLine.name !== nextName) {
        const nextStructures = structures.map((structure) =>
          structure.line === previousLine.name ? { ...structure, line: nextName } : structure
        );
        setStructures(nextStructures);
        window.localStorage.setItem(artStructuresStorageKey, JSON.stringify(nextStructures));
        setSelectedLine(nextName);
      }

      closeForm();
      return;
    }

    const nextLine: PipelineLine = {
      id: crypto.randomUUID(),
      name: nextName,
      ...form
    };

    setLines((currentLines) => [...currentLines, nextLine]);
    setSelectedLine(nextName);
    closeForm();
  }

  function deleteLine(line: PipelineLine) {
    if (!user?.canEdit) return;

    const structureCount = structures.filter((structure) => structure.line === line.name).length;
    if (structureCount > 0) {
      window.alert("Bu hatta bagli sanat yapilari var. Once yapilari baska hatta aktar.");
      return;
    }

    const shouldDelete = window.confirm("Bu hat silinsin mi?");
    if (!shouldDelete) return;

    const nextLines = lines.filter((item) => item.id !== line.id);
    setLines(nextLines);
    setSelectedLine(nextLines[0]?.name ?? "");
  }

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f4f1ea] text-[#1d2522]">
        <p className="text-sm text-[#61706b]">Hatlar aciliyor...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f1ea] text-[#1d2522]">
      <header className="border-b border-[#d7d0c4] bg-white">
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
        <Link className="inline-flex items-center gap-2 text-sm font-medium text-[#61706b]" href="/panel">
          <ArrowLeft size={16} />
          Panele don
        </Link>

        <div className="mt-5 flex flex-col justify-between gap-4 border-b border-[#d7d0c4] pb-5 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-[#1f4d3a]">
              <GitBranch size={17} />
              Hatlar
            </div>
            <h1 className="mt-2 text-2xl font-semibold">Anahat ve Yedek Hatlar</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#61706b]">
              S1 ve P1 anahatlarini, yedek hatlari ve hatta bagli sanat yapilarini takip et.
            </p>
          </div>

          {user?.canEdit ? (
            <button
              className="inline-flex items-center gap-2 rounded bg-[#1f4d3a] px-4 py-2 text-sm font-semibold text-white"
              onClick={openCreateForm}
              type="button"
            >
              <Plus size={16} />
              Yeni Hat
            </button>
          ) : null}
        </div>

        {isFormOpen && user?.canEdit ? (
          <form
            className="mt-5 grid gap-4 rounded border border-[#d7d0c4] bg-white p-4"
            onSubmit={handleSubmit}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">{editingId ? "Hatti duzenle" : "Yeni hat"}</h2>
              <button className="rounded p-2 text-[#61706b]" onClick={closeForm} type="button">
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-[180px_1fr_1fr]">
              <label className="grid gap-2 text-sm font-medium">
                Anahat
                <select
                  className="rounded border border-[#c8c0b3] bg-white px-3 py-2 outline-none focus:border-[#1f4d3a]"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      mainLine: event.target.value as PipelineLine["mainLine"]
                    }))
                  }
                  value={form.mainLine}
                >
                  <option>S1</option>
                  <option>P1</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Hat adi
                <input
                  className="rounded border border-[#c8c0b3] px-3 py-2 outline-none focus:border-[#1f4d3a]"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, branchName: event.target.value }))
                  }
                  placeholder="Anahat, Yedek-11, Yedek14-2-1"
                  required
                  value={form.branchName}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Boru bilgisi notu
                <input
                  className="rounded border border-[#c8c0b3] px-3 py-2 outline-none focus:border-[#1f4d3a]"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, pipeNote: event.target.value }))
                  }
                  placeholder="Cap/uzunluk sonraki adim"
                  value={form.pipeNote}
                />
              </label>
            </div>

            <p className="rounded bg-[#eef0ec] px-3 py-2 text-sm text-[#33413c]">
              Olusacak hat adi: <strong>{buildLineName(form.mainLine, form.branchName)}</strong>
            </p>

            <div className="flex justify-end gap-2">
              <button
                className="rounded border border-[#c8c0b3] bg-white px-4 py-2 text-sm font-semibold"
                onClick={closeForm}
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

        <div className="mt-5 grid gap-5 lg:grid-cols-[340px_1fr]">
          <aside className="rounded border border-[#d7d0c4] bg-white">
            <div className="border-b border-[#d7d0c4] px-4 py-3 font-semibold">Hat Listesi</div>
            <div className="divide-y divide-[#e4ded4]">
              {sortedLines.map((line) => {
                const count = structures.filter((structure) => structure.line === line.name).length;
                return (
                  <button
                    className={
                      selectedLine === line.name
                        ? "grid w-full gap-1 bg-[#eef0ec] px-4 py-3 text-left"
                        : "grid w-full gap-1 px-4 py-3 text-left hover:bg-[#f8f6f1]"
                    }
                    key={line.id}
                    onClick={() => setSelectedLine(line.name)}
                    type="button"
                  >
                    <span className="font-semibold">{line.name}</span>
                    <span className="text-sm text-[#61706b]">{count} sanat yapisi</span>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="rounded border border-[#d7d0c4] bg-white">
            <div className="flex flex-col justify-between gap-3 border-b border-[#d7d0c4] px-4 py-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-lg font-semibold">{selectedLine || "Hat secilmedi"}</h2>
                <p className="mt-1 text-sm text-[#61706b]">
                  {selectedStructures.length} bagli sanat yapisi
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  className="inline-flex items-center gap-2 rounded border border-[#c8c0b3] bg-white px-3 py-2 text-sm font-semibold"
                  href={`/panel/sanat-yapilari?hat=${encodeURIComponent(selectedLine)}`}
                >
                  <FileText size={16} />
                  Sanat Yapilari
                </Link>
                {user?.canEdit && selectedLine ? (
                  <>
                    <button
                      className="inline-flex size-9 items-center justify-center rounded border border-[#c8c0b3] bg-white"
                      onClick={() => {
                        const line = lines.find((item) => item.name === selectedLine);
                        if (line) openEditForm(line);
                      }}
                      title="Duzenle"
                      type="button"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="inline-flex size-9 items-center justify-center rounded border border-[#d8b6ad] bg-white text-[#9c3d2f]"
                      onClick={() => {
                        const line = lines.find((item) => item.name === selectedLine);
                        if (line) deleteLine(line);
                      }}
                      title="Sil"
                      type="button"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                ) : null}
              </div>
            </div>

            <div className="divide-y divide-[#e4ded4]">
              {selectedStructures.map((structure) => (
                <article className="grid gap-2 px-4 py-3 md:grid-cols-[110px_1fr_130px]" key={structure.id}>
                  <span className="font-semibold text-[#1f4d3a]">{structure.kilometer}</span>
                  <div>
                    <p className="font-semibold">{structure.code}</p>
                    <p className="text-sm text-[#61706b]">{structure.detail}</p>
                  </div>
                  <span className="text-sm text-[#33413c]">{structure.status}</span>
                </article>
              ))}

              {selectedStructures.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-[#61706b]">
                  Bu hatta bagli sanat yapisi yok.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
