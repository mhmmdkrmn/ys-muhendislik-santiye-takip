"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  ClipboardList,
  FileSpreadsheet,
  HardHat,
  LogOut,
  Pencil,
  Plus,
  Save,
  Trash2
} from "lucide-react";
import { AksuHakedis, AksuHakedisRow, AksuMetraj, AksuPoz, AksuProject, formatCurrency, formatQuantity, getAksuMetrajSummary, getAksuProgressPercent, getAksuProject } from "@/lib/aksu-data";
import {
  createAksuMetraj,
  createAksuPoz,
  deleteAksuHakedis,
  deleteAksuMetraj,
  deleteAksuPoz,
  fetchAksuProject,
  seedAksuFromJson,
  updateAksuMetraj,
  updateAksuPoz,
  upsertAksuHakedis
} from "@/lib/aksu-supabase";
import { canAccessProject } from "@/lib/permissions";
import { createSupabaseClient } from "@/lib/supabase";
import { useCurrentUser } from "@/lib/use-current-user";

const tabs = ["Genel", "Keşif", "Pozlar", "Metraj", "Metraj İcmali", "Raporlar", "Fiyat Farkı", "Revize Fiyat", "Hakediş"];
const blankPoz: AksuPoz = { poz_no: "", ad: "", birim: "", metraj: 0, fiyat: 0, toplam: 0 };
const blankMetraj: AksuMetraj = {
  tarih: new Date().toISOString().slice(0, 10),
  poz_no: "",
  miktar: 0,
  imalat_yeri: "",
  aciklama: ""
};

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(";")).join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AksuTighPage() {
  const { isLoading: userLoading, logout, user } = useCurrentUser();
  const [activeTab, setActiveTab] = useState("Genel");
  const [project, setProject] = useState<AksuProject>(() => ({ ...getAksuProject(), kesif: [], metraj: [], hakedis: [] }));
  const [dataLoading, setDataLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pozForm, setPozForm] = useState<AksuPoz>(blankPoz);
  const [metrajForm, setMetrajForm] = useState<AksuMetraj>(blankMetraj);
  const [hakedisDate, setHakedisDate] = useState(new Date().toISOString().slice(0, 10));

  const supabase = useMemo(() => createSupabaseClient(), []);
  const userCanEdit = Boolean(user?.canEdit);

  const loadProject = useCallback(async () => {
    if (!supabase) {
      setError("Supabase bağlantısı bulunamadı.");
      setDataLoading(false);
      return;
    }
    setDataLoading(true);
    setError("");
    try {
      setProject(await fetchAksuProject(supabase));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Aksu verileri okunamadı. Supabase SQL'i çalıştırılmış olmalı.");
      setProject({ ...getAksuProject(), kesif: [], metraj: [], hakedis: [] });
    } finally {
      setDataLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (!userLoading && user) {
      loadProject();
    }
  }, [loadProject, user, userLoading]);

  const pozMap = useMemo(() => new Map((project.kesif ?? []).map((poz) => [poz.poz_no, poz])), [project.kesif]);
  const metrajSummary = useMemo(() => getAksuMetrajSummary(project), [project]);
  const kesifTotal = project.kesif?.reduce((sum, row) => sum + Number(row.toplam ?? 0), 0) ?? 0;
  const metrajTotal = project.metraj?.reduce((sum, row) => sum + Number(row.tutar ?? 0), 0) ?? 0;
  const progress = getAksuProgressPercent(project);

  async function runAction(action: () => Promise<void>, success: string) {
    if (!supabase) return;
    setError("");
    setMessage("");
    try {
      await action();
      await loadProject();
      setMessage(success);
    } catch (err) {
      setError(err instanceof Error ? err.message : "İşlem tamamlanamadı.");
    }
  }

  async function handleSeed() {
    await runAction(async () => seedAksuFromJson(supabase!), "Eski Aksu verileri Supabase'e aktarıldı.");
  }

  async function savePoz(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const total = Number(pozForm.metraj ?? 0) * Number(pozForm.fiyat ?? 0);
    const payload = { ...pozForm, toplam: total };
    await runAction(
      async () => {
        if (pozForm.id) await updateAksuPoz(supabase!, String(pozForm.id), payload);
        else await createAksuPoz(supabase!, payload);
        setPozForm(blankPoz);
      },
      "Poz kaydedildi."
    );
  }

  async function saveMetraj(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const poz = pozMap.get(String(metrajForm.poz_no ?? ""));
    await runAction(
      async () => {
        if (metrajForm.id) await updateAksuMetraj(supabase!, String(metrajForm.id), metrajForm, poz);
        else await createAksuMetraj(supabase!, metrajForm, poz);
        setMetrajForm({ ...blankMetraj, poz_no: metrajForm.poz_no });
      },
      "Metraj kaydedildi."
    );
  }

  async function createHakedis() {
    const hakedis = buildHakedis(project, hakedisDate);
    await runAction(async () => {
      await upsertAksuHakedis(supabase!, hakedis);
    }, "Hakediş oluşturuldu.");
  }

  if (userLoading) {
    return <Loading text="Aksu TİGH açılıyor..." />;
  }

  if (!canAccessProject(user, "aksu-tigh")) {
    return <Loading text="Bu projeye erişim yetkin yok." />;
  }

  return (
    <main className="min-h-screen bg-[#f4f1ea] text-[#1d2522]">
      <header className="border-b border-[#d7d0c4] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded bg-[#1f4d3a] text-white">
              <HardHat size={21} />
            </span>
            <div>
              <p className="font-semibold">Aksu TİGH 1. Kısım</p>
              <p className="text-sm text-[#61706b]">{user?.name ?? "Kullanıcı"} - {user?.title ?? "Görüntüleme"}</p>
            </div>
          </div>
          <button className="inline-flex items-center gap-2 rounded border border-[#c8c0b3] bg-white px-3 py-2 text-sm font-medium" onClick={logout} type="button">
            <LogOut size={16} />
            Çıkış
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8">
        <Link className="inline-flex items-center gap-2 text-sm font-medium text-[#61706b]" href="/panel">
          <ArrowLeft size={16} />
          Proje seçimine dön
        </Link>

        <div className="mt-5 border-b border-[#d7d0c4] pb-5">
          <div className="flex items-center gap-2 text-sm font-medium text-[#1f4d3a]">
            <ClipboardList size={17} />
            Aksu Metraj Takip
          </div>
          <h1 className="mt-2 text-2xl font-semibold">Aksu TİGH 1. Kısım</h1>
          <p className="mt-2 text-sm leading-6 text-[#61706b]">{project.name}</p>
        </div>

        {message ? <Notice tone="success" text={message} /> : null}
        {error ? <Notice tone="error" text={error} /> : null}

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button className={activeTab === tab ? "shrink-0 rounded bg-[#1f4d3a] px-3 py-2 text-sm font-semibold text-white" : "shrink-0 rounded border border-[#c8c0b3] bg-white px-3 py-2 text-sm font-semibold"} key={tab} onClick={() => setActiveTab(tab)} type="button">
              {tab}
            </button>
          ))}
        </div>

        {dataLoading ? <div className="mt-5 rounded border border-[#d7d0c4] bg-white p-5 text-sm text-[#61706b]">Veriler yükleniyor...</div> : null}

        {!dataLoading && (project.kesif?.length ?? 0) === 0 ? (
          <div className="mt-5 rounded border border-[#d7d0c4] bg-white p-5">
            <h2 className="font-semibold">Aksu verileri henüz Supabase'te yok</h2>
            <p className="mt-2 text-sm text-[#61706b]">Ilk kurulum icin eski Aksu uygulamasindan gelen keşif, metraj ve hakediş verilerini veritabanina aktar.</p>
            {userCanEdit ? (
              <button className="mt-4 inline-flex items-center gap-2 rounded bg-[#1f4d3a] px-3 py-2 text-sm font-semibold text-white" onClick={handleSeed} type="button">
                <Save size={16} />
                Eski verileri aktar
              </button>
            ) : null}
          </div>
        ) : null}

        {activeTab === "Genel" ? (
          <section className="mt-5 grid gap-5">
            <div className="grid gap-3 md:grid-cols-4">
              <SummaryCard label="Genel ilerleme" value={`%${formatQuantity(progress)}`} />
              <SummaryCard label="Keşif poz sayısı" value={String(project.kesif?.length ?? 0)} />
              <SummaryCard label="Metraj kaydı" value={String(project.metraj?.length ?? 0)} />
              <SummaryCard label="Hakediş sayısı" value={String(project.hakedis?.length ?? 0)} />
            </div>
            <InfoGrid info={project.info ?? {}} />
          </section>
        ) : null}

        {activeTab === "Keşif" ? (
          <KesifPanel
            form={pozForm}
            rows={project.kesif ?? []}
            total={kesifTotal}
            userCanEdit={userCanEdit}
            onCancel={() => setPozForm(blankPoz)}
            onDelete={(id) => runAction(async () => deleteAksuPoz(supabase!, id), "Poz silindi.")}
            onEdit={setPozForm}
            onFormChange={setPozForm}
            onSubmit={savePoz}
          />
        ) : null}

        {activeTab === "Pozlar" ? <PozlarTable rows={project.kesif ?? []} /> : null}

        {activeTab === "Metraj" ? (
          <MetrajPanel
            form={metrajForm}
            pozlar={project.kesif ?? []}
            rows={project.metraj ?? []}
            userCanEdit={userCanEdit}
            onCancel={() => setMetrajForm(blankMetraj)}
            onDelete={(id) => runAction(async () => deleteAksuMetraj(supabase!, id), "Metraj silindi.")}
            onEdit={setMetrajForm}
            onFormChange={setMetrajForm}
            onSubmit={saveMetraj}
          />
        ) : null}

        {activeTab === "Metraj İcmali" ? <MetrajIcmali rows={metrajSummary} total={metrajTotal} /> : null}
        {activeTab === "Raporlar" ? <ReportsPanel project={project} summary={metrajSummary} /> : null}
        {activeTab === "Fiyat Farkı" ? <FiyatFarkiPanel project={project} /> : null}
        {activeTab === "Revize Fiyat" ? <RevizeFiyatPanel project={project} /> : null}
        {activeTab === "Hakediş" ? (
          <HakedisPanel
            date={hakedisDate}
            rows={project.hakedis ?? []}
            userCanEdit={userCanEdit}
            onCreate={createHakedis}
            onDateChange={setHakedisDate}
            onDelete={(id) => runAction(async () => deleteAksuHakedis(supabase!, id), "Hakediş silindi.")}
          />
        ) : null}
      </section>
    </main>
  );
}

function Loading({ text }: { text: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f1ea] px-5 text-center text-[#1d2522]">
      <p className="text-sm text-[#61706b]">{text}</p>
    </main>
  );
}

function Notice({ text, tone }: { text: string; tone: "success" | "error" }) {
  return <div className={tone === "success" ? "mt-5 rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800" : "mt-5 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"}>{text}</div>;
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-[#d7d0c4] bg-white p-4">
      <p className="text-sm text-[#61706b]">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function InfoGrid({ info }: { info: Record<string, string> }) {
  return (
    <div className="rounded border border-[#d7d0c4] bg-white p-4">
      <h2 className="font-semibold">Proje Bilgileri</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {Object.entries(info).map(([key, value]) => (
          <div className="rounded bg-[#f8f6f1] px-3 py-2" key={key}>
            <p className="text-xs uppercase text-[#61706b]">{key.replaceAll("_", " ")}</p>
            <p className="mt-1 font-medium">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function KesifPanel(props: {
  form: AksuPoz;
  rows: AksuPoz[];
  total: number;
  userCanEdit: boolean;
  onCancel: () => void;
  onDelete: (id: string) => void;
  onEdit: (row: AksuPoz) => void;
  onFormChange: (row: AksuPoz) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const { form, rows, total, userCanEdit, onCancel, onDelete, onEdit, onFormChange, onSubmit } = props;
  return (
    <div className="mt-5 grid gap-4">
      {userCanEdit ? (
        <form className="grid gap-3 rounded border border-[#d7d0c4] bg-white p-4 md:grid-cols-6" onSubmit={onSubmit}>
          <Input label="Poz No" value={form.poz_no} onChange={(value) => onFormChange({ ...form, poz_no: value })} />
          <Input className="md:col-span-2" label="Poz Adı" value={form.ad} onChange={(value) => onFormChange({ ...form, ad: value })} />
          <Input label="Birim" value={form.birim} onChange={(value) => onFormChange({ ...form, birim: value })} />
          <Input label="Metraj" type="number" value={String(form.metraj ?? 0)} onChange={(value) => onFormChange({ ...form, metraj: Number(value) })} />
          <Input label="Fiyat" type="number" value={String(form.fiyat ?? 0)} onChange={(value) => onFormChange({ ...form, fiyat: Number(value) })} />
          <div className="flex items-end gap-2 md:col-span-6">
            <button className="inline-flex items-center gap-2 rounded bg-[#1f4d3a] px-3 py-2 text-sm font-semibold text-white" type="submit">
              <Save size={16} />
              Kaydet
            </button>
            <button className="rounded border border-[#c8c0b3] bg-white px-3 py-2 text-sm font-semibold" onClick={onCancel} type="button">Temizle</button>
          </div>
        </form>
      ) : null}
      <div className="overflow-hidden rounded border border-[#d7d0c4] bg-white">
        <div className="flex items-center justify-between border-b border-[#d7d0c4] bg-[#eef0ec] px-4 py-3">
          <span className="font-semibold">Keşif</span>
          <span className="text-sm font-semibold">Toplam: {formatCurrency(total)} TL</span>
        </div>
        <ActionTable
          headers={["Poz No", "Poz Adı", "Birim", "Metraj", "Fiyat", "Toplam"]}
          rows={rows.map((row) => ({
            key: String(row.id ?? row.poz_no),
            cells: [row.poz_no, row.ad, row.birim, formatQuantity(row.metraj), formatCurrency(row.fiyat), formatCurrency(row.toplam)],
            item: row
          }))}
          userCanEdit={userCanEdit}
          onDelete={(row) => row.id && onDelete(String(row.id))}
          onEdit={onEdit}
        />
      </div>
    </div>
  );
}

function PozlarTable({ rows }: { rows: AksuPoz[] }) {
  return (
    <div className="mt-5 overflow-hidden rounded border border-[#d7d0c4] bg-white">
      <div className="border-b border-[#d7d0c4] bg-[#eef0ec] px-4 py-3 font-semibold">Pozlar</div>
      <DataTable headers={["Poz No", "Poz Adı", "Birim", "Sözleşme Metrajı"]} rows={rows.map((row) => [row.poz_no, row.ad, row.birim, formatQuantity(row.metraj)])} />
    </div>
  );
}

function MetrajPanel(props: {
  form: AksuMetraj;
  pozlar: AksuPoz[];
  rows: AksuMetraj[];
  userCanEdit: boolean;
  onCancel: () => void;
  onDelete: (id: string) => void;
  onEdit: (row: AksuMetraj) => void;
  onFormChange: (row: AksuMetraj) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const { form, pozlar, rows, userCanEdit, onCancel, onDelete, onEdit, onFormChange, onSubmit } = props;
  return (
    <div className="mt-5 grid gap-4">
      {userCanEdit ? (
        <form className="grid gap-3 rounded border border-[#d7d0c4] bg-white p-4 md:grid-cols-6" onSubmit={onSubmit}>
          <Input label="Tarih" type="date" value={form.tarih ?? ""} onChange={(value) => onFormChange({ ...form, tarih: value })} />
          <label className="grid gap-1 text-sm font-medium">
            Poz
            <select className="rounded border border-[#c8c0b3] bg-white px-3 py-2" value={form.poz_no ?? ""} onChange={(event) => onFormChange({ ...form, poz_no: event.target.value })} required>
              <option value="">Sec</option>
              {pozlar.map((poz) => <option key={poz.poz_no} value={poz.poz_no}>{poz.poz_no} - {poz.ad}</option>)}
            </select>
          </label>
          <Input label="Miktar" type="number" value={String(form.miktar ?? 0)} onChange={(value) => onFormChange({ ...form, miktar: Number(value) })} />
          <Input label="İmalat Yeri" value={form.imalat_yeri ?? ""} onChange={(value) => onFormChange({ ...form, imalat_yeri: value })} />
          <Input className="md:col-span-2" label="Açıklama" value={form.aciklama ?? ""} onChange={(value) => onFormChange({ ...form, aciklama: value })} />
          <div className="flex items-end gap-2 md:col-span-6">
            <button className="inline-flex items-center gap-2 rounded bg-[#1f4d3a] px-3 py-2 text-sm font-semibold text-white" type="submit">
              <Plus size={16} />
              Kaydet
            </button>
            <button className="rounded border border-[#c8c0b3] bg-white px-3 py-2 text-sm font-semibold" onClick={onCancel} type="button">Temizle</button>
          </div>
        </form>
      ) : null}
      <div className="overflow-hidden rounded border border-[#d7d0c4] bg-white">
        <div className="border-b border-[#d7d0c4] bg-[#eef0ec] px-4 py-3 font-semibold">Metraj Kayıtları</div>
        <ActionTable
          headers={["Tarih", "Poz No", "Miktar", "Birim", "Tutar", "İmalat Yeri", "Açıklama"]}
          rows={rows.map((row) => ({
            key: String(row.id ?? `${row.tarih}-${row.poz_no}`),
            cells: [row.tarih ?? "", row.poz_no ?? "", formatQuantity(row.miktar), row.birim ?? "", formatCurrency(row.tutar), row.imalat_yeri ?? "", row.aciklama ?? ""],
            item: row
          }))}
          userCanEdit={userCanEdit}
          onDelete={(row) => row.id && onDelete(String(row.id))}
          onEdit={onEdit}
        />
      </div>
    </div>
  );
}

function MetrajIcmali({ rows, total }: { rows: Array<{ pozNo: string; ad: string; birim: string; quantity: number; amount: number }>; total: number }) {
  return (
    <div className="mt-5 overflow-hidden rounded border border-[#d7d0c4] bg-white">
      <div className="flex items-center justify-between border-b border-[#d7d0c4] bg-[#eef0ec] px-4 py-3">
        <span className="font-semibold">Metraj İcmali</span>
        <span className="text-sm font-semibold">Toplam: {formatCurrency(total)} TL</span>
      </div>
      <DataTable headers={["Poz No", "Poz Adı", "Birim", "Toplam Miktar", "Toplam Tutar"]} rows={rows.map((row) => [row.pozNo, row.ad, row.birim, formatQuantity(row.quantity), formatCurrency(row.amount)])} />
    </div>
  );
}

function ReportsPanel({ project, summary }: { project: AksuProject; summary: Array<{ pozNo: string; ad: string; birim: string; quantity: number; amount: number }> }) {
  return (
    <div className="mt-5 grid gap-3 md:grid-cols-3">
      <ReportButton title="Keşif Excel" onClick={() => downloadCsv("aksu-kesif.csv", [["Poz No", "Poz Adı", "Birim", "Metraj", "Fiyat", "Toplam"], ...(project.kesif ?? []).map((row) => [row.poz_no, row.ad, row.birim, formatQuantity(row.metraj), formatCurrency(row.fiyat), formatCurrency(row.toplam)])])} />
      <ReportButton title="Metraj Excel" onClick={() => downloadCsv("aksu-metraj.csv", [["Tarih", "Poz No", "Miktar", "Birim", "Tutar", "İmalat Yeri", "Açıklama"], ...(project.metraj ?? []).map((row) => [row.tarih ?? "", row.poz_no ?? "", formatQuantity(row.miktar), row.birim ?? "", formatCurrency(row.tutar), row.imalat_yeri ?? "", row.aciklama ?? ""])])} />
      <ReportButton title="Metraj İcmali Excel" onClick={() => downloadCsv("aksu-metraj-icmali.csv", [["Poz No", "Poz Adı", "Birim", "Toplam Miktar", "Toplam Tutar"], ...summary.map((row) => [row.pozNo, row.ad, row.birim, formatQuantity(row.quantity), formatCurrency(row.amount)])])} />
    </div>
  );
}

function ReportButton({ onClick, title }: { onClick: () => void; title: string }) {
  return (
    <button className="rounded border border-[#d7d0c4] bg-white p-5 text-left" onClick={onClick} type="button">
      <FileSpreadsheet size={22} className="text-[#1f4d3a]" />
      <h2 className="mt-4 font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-[#61706b]">CSV/Excel olarak indir.</p>
    </button>
  );
}

function FiyatFarkiPanel({ project }: { project: AksuProject }) {
  const rows = project.fiyat_farki?.rows ?? [];
  return (
    <div className="mt-5 overflow-hidden rounded border border-[#d7d0c4] bg-white">
      <div className="flex items-center gap-2 border-b border-[#d7d0c4] bg-[#eef0ec] px-4 py-3 font-semibold">
        <BarChart3 size={17} />
        Fiyat Farkı Katsayıları
      </div>
      <DataTable headers={["Kod", "Katsayı", "Baz", "Açıklama"]} rows={rows.map((row) => [String(row.code ?? ""), formatQuantity(Number(row.katsayi ?? 0)), formatQuantity(Number(row.baz ?? 0)), String(row.aciklama ?? "")])} />
    </div>
  );
}

function RevizeFiyatPanel({ project }: { project: AksuProject }) {
  const rows = buildRevisionRows(project);
  return (
    <div className="mt-5 overflow-hidden rounded border border-[#d7d0c4] bg-white">
      <div className="border-b border-[#d7d0c4] bg-[#eef0ec] px-4 py-3 font-semibold">Revize Fiyat Kontrolu</div>
      <DataTable headers={["Poz No", "Poz Adı", "Sözleşme", "Toplam İmalat", "%20 Sınır", "Revize Miktar", "Revize Fiyat"]} rows={rows.map((row) => [row.pozNo, row.ad, formatQuantity(row.contractQty), formatQuantity(row.totalQty), formatQuantity(row.normalLimit), formatQuantity(row.revisedQty), formatCurrency(row.revisedPrice)])} />
    </div>
  );
}

function HakedisPanel(props: {
  date: string;
  rows: AksuHakedis[];
  userCanEdit: boolean;
  onCreate: () => void;
  onDateChange: (value: string) => void;
  onDelete: (id: string) => void;
}) {
  const { date, rows, userCanEdit, onCreate, onDateChange, onDelete } = props;
  return (
    <div className="mt-5 grid gap-4">
      {userCanEdit ? (
        <div className="flex flex-wrap items-end gap-3 rounded border border-[#d7d0c4] bg-white p-4">
          <Input label="Hakediş tarihi" type="date" value={date} onChange={onDateChange} />
          <button className="inline-flex items-center gap-2 rounded bg-[#1f4d3a] px-3 py-2 text-sm font-semibold text-white" onClick={onCreate} type="button">
            <Plus size={16} />
            Hakediş oluştur
          </button>
        </div>
      ) : null}
      <div className="overflow-hidden rounded border border-[#d7d0c4] bg-white">
        <div className="border-b border-[#d7d0c4] bg-[#eef0ec] px-4 py-3 font-semibold">Hakedişler</div>
        <ActionTable
          headers={["No", "Tarih", "Durum", "Bu Hakediş", "KDV Dahil Tahakkuk"]}
          rows={rows.map((row) => ({
            key: String(row.id ?? row.no),
            cells: [String(row.no ?? ""), row.tarih ?? "", row.kesin ? "Kesin" : "Taslak", formatCurrency(row.toplam_bu_hakedis), formatCurrency(row.tahakkuk_kdv_dahil)],
            item: row
          }))}
          userCanEdit={userCanEdit}
          onDelete={(row) => row.id && onDelete(String(row.id))}
        />
      </div>
    </div>
  );
}

function Input({ className = "", label, onChange, type = "text", value }: { className?: string; label: string; onChange: (value: string) => void; type?: string; value: string }) {
  return (
    <label className={`grid gap-1 text-sm font-medium ${className}`}>
      {label}
      <input className="rounded border border-[#c8c0b3] bg-white px-3 py-2" onChange={(event) => onChange(event.target.value)} required type={type} value={value} />
    </label>
  );
}

function ActionTable<T>({ headers, rows, userCanEdit, onDelete, onEdit }: { headers: string[]; rows: Array<{ key: string; cells: string[]; item: T }>; userCanEdit: boolean; onDelete?: (item: T) => void; onEdit?: (item: T) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] border-collapse text-sm">
        <thead>
          <tr className="bg-[#f8f6f1] text-left">
            {headers.map((header) => <th className="border-b border-[#d7d0c4] px-3 py-2" key={header}>{header}</th>)}
            {userCanEdit ? <th className="w-28 border-b border-[#d7d0c4] px-3 py-2">??lem</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? rows.map((row) => (
            <tr key={row.key}>
              {row.cells.map((cell, index) => <td className="border-b border-[#eee8dc] px-3 py-2" key={`${row.key}-${index}`}>{cell}</td>)}
              {userCanEdit ? (
                <td className="border-b border-[#eee8dc] px-3 py-2">
                  <div className="flex gap-2">
                    {onEdit ? <IconButton label="Düzenle" onClick={() => onEdit(row.item)} icon={<Pencil size={15} />} /> : null}
                    {onDelete ? <IconButton label="Sil" onClick={() => onDelete(row.item)} icon={<Trash2 size={15} />} danger /> : null}
                  </div>
                </td>
              ) : null}
            </tr>
          )) : (
            <tr>
              <td className="px-3 py-8 text-center text-[#61706b]" colSpan={headers.length + (userCanEdit ? 1 : 0)}>Kayıt yok.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function IconButton({ danger, icon, label, onClick }: { danger?: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button aria-label={label} className={danger ? "grid size-8 place-items-center rounded border border-red-200 bg-red-50 text-red-700" : "grid size-8 place-items-center rounded border border-[#c8c0b3] bg-white text-[#1d2522]"} onClick={onClick} title={label} type="button">
      {icon}
    </button>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] border-collapse text-sm">
        <thead>
          <tr className="bg-[#f8f6f1] text-left">
            {headers.map((header) => <th className="border-b border-[#d7d0c4] px-3 py-2" key={header}>{header}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? rows.map((row, rowIndex) => (
            <tr key={`${row[0]}-${rowIndex}`}>
              {row.map((cell, cellIndex) => <td className="border-b border-[#eee8dc] px-3 py-2" key={`${cellIndex}-${cell}`}>{cell}</td>)}
            </tr>
          )) : (
            <tr>
              <td className="px-3 py-8 text-center text-[#61706b]" colSpan={headers.length}>Kayıt yok.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function buildHakedis(project: AksuProject, date: string): AksuHakedis {
  const hakedisRows = project.hakedis ?? [];
  const previous = [...hakedisRows].filter((item) => item.kesin).sort((a, b) => String(b.tarih).localeCompare(String(a.tarih)))[0];
  const nextNo = Math.max(0, ...hakedisRows.map((item) => Number(item.no ?? 0))) + 1;
  const pozMap = new Map((project.kesif ?? []).map((poz) => [poz.poz_no, poz]));
  const previousTotals = new Map<string, number>();
  for (const row of previous?.rows ?? []) {
    previousTotals.set(row.poz_no ?? "", Number(row.toplam_miktar ?? 0));
  }
  const totals = new Map<string, { miktar: number; yerler: string[]; ids: Array<string | number> }>();
  for (const record of project.metraj ?? []) {
    if (!record.tarih || record.tarih > date) continue;
    const pozNo = record.poz_no ?? "";
    const current = totals.get(pozNo) ?? { miktar: 0, yerler: [], ids: [] };
    current.miktar += Number(record.miktar ?? 0);
    if (record.imalat_yeri && !current.yerler.includes(record.imalat_yeri)) current.yerler.push(record.imalat_yeri);
    if (record.id) current.ids.push(record.id);
    totals.set(pozNo, current);
  }
  const rows: AksuHakedisRow[] = [];
  for (const [pozNo, total] of totals) {
    const poz = pozMap.get(pozNo);
    const price = Number(poz?.fiyat ?? 0);
    const previousQty = previousTotals.get(pozNo) ?? 0;
    const currentQty = total.miktar - previousQty;
    rows.push({
      poz_no: pozNo,
      aciklama: poz?.ad ?? "",
      birim: poz?.birim ?? "",
      imalat_yeri: total.yerler.slice(0, 3).join(", "),
      birim_fiyat: price,
      fiili_toplam_miktar: total.miktar,
      toplam_miktar: total.miktar,
      onceki_miktar: previousQty,
      bu_miktar: currentQty,
      toplam_tutar: total.miktar * price,
      onceki_tutar: previousQty * price,
      bu_tutar: currentQty * price
    });
  }
  const thisAmount = rows.reduce((sum, row) => sum + Number(row.bu_tutar ?? 0), 0);
  const contractTotal = (project.kesif ?? []).reduce((sum, row) => sum + Number(row.toplam ?? 0), 0);
  return {
    no: nextNo,
    tarih: date,
    kesin: false,
    onceki_no: previous?.no ?? "",
    metraj_ids: Array.from(totals.values()).flatMap((item) => item.ids),
    rows: rows.sort((a, b) => String(a.poz_no).localeCompare(String(b.poz_no), "tr")),
    toplam_sozlesme_tutari: contractTotal,
    onceki_sozlesme_tutari: previous?.toplam_bu_hakedis ?? 0,
    sozlesme_tutari: thisAmount,
    fiyat_farki: 0,
    toplam_bu_hakedis: thisAmount,
    tahakkuk_kdv_dahil: thisAmount * 1.2
  };
}

function buildRevisionRows(project: AksuProject) {
  const summary = getAksuMetrajSummary(project);
  return summary
    .map((item) => {
      const poz = project.kesif?.find((row) => row.poz_no === item.pozNo);
      const contractQty = Number(poz?.metraj ?? 0);
      const normalLimit = contractQty * 1.2;
      const revisedQty = Math.max(0, item.quantity - normalLimit);
      return {
        pozNo: item.pozNo,
        ad: item.ad,
        contractQty,
        totalQty: item.quantity,
        normalLimit,
        revisedQty,
        revisedPrice: revisedQty > 0 ? Number(poz?.fiyat ?? 0) * 0.9 : 0
      };
    })
    .filter((item) => item.revisedQty > 0);
}
