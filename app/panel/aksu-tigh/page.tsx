"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  ClipboardList,
  FileSpreadsheet,
  HardHat,
  LogOut,
  Ruler
} from "lucide-react";
import { canAccessProject } from "@/lib/permissions";
import {
  formatCurrency,
  formatQuantity,
  getAksuMetrajSummary,
  getAksuProgressPercent,
  getAksuProject
} from "@/lib/aksu-data";
import { useCurrentUser } from "@/lib/use-current-user";

const tabs = [
  "Genel",
  "Kesif",
  "Pozlar",
  "Metraj",
  "Metraj Icmali",
  "Raporlar",
  "Fiyat Farki",
  "Revize Fiyat",
  "Hakedis"
];

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(";"))
    .join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AksuTighPage() {
  const { isLoading, logout, user } = useCurrentUser();
  const [activeTab, setActiveTab] = useState("Genel");
  const project = getAksuProject();
  const metrajSummary = useMemo(() => getAksuMetrajSummary(project), [project]);
  const kesifTotal = project.kesif?.reduce((sum, row) => sum + (row.toplam ?? 0), 0) ?? 0;
  const metrajTotal = project.metraj?.reduce((sum, row) => sum + (row.tutar ?? 0), 0) ?? 0;
  const progress = getAksuProgressPercent(project);

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f4f1ea] text-[#1d2522]">
        <p className="text-sm text-[#61706b]">Aksu TIGH aciliyor...</p>
      </main>
    );
  }

  if (!canAccessProject(user, "aksu-tigh")) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f4f1ea] px-5 text-center text-[#1d2522]">
        <p>Bu projeye erisim yetkin yok.</p>
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
              <p className="font-semibold">Aksu TIGH 1. Kisim</p>
              <p className="text-sm text-[#61706b]">
                {user?.name ?? "Kullanici"} - {user?.title ?? "Goruntuleme"}
              </p>
            </div>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded border border-[#c8c0b3] bg-white px-3 py-2 text-sm font-medium"
            onClick={logout}
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
          Proje secimine don
        </Link>

        <div className="mt-5 border-b border-[#d7d0c4] pb-5">
          <div className="flex items-center gap-2 text-sm font-medium text-[#1f4d3a]">
            <ClipboardList size={17} />
            Aksu Metraj Takip
          </div>
          <h1 className="mt-2 text-2xl font-semibold">Aksu TIGH 1. Kisim</h1>
          <p className="mt-2 text-sm leading-6 text-[#61706b]">{project.name}</p>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              className={
                activeTab === tab
                  ? "shrink-0 rounded bg-[#1f4d3a] px-3 py-2 text-sm font-semibold text-white"
                  : "shrink-0 rounded border border-[#c8c0b3] bg-white px-3 py-2 text-sm font-semibold"
              }
              key={tab}
              onClick={() => setActiveTab(tab)}
              type="button"
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Genel" ? (
          <section className="mt-5 grid gap-5">
            <div className="grid gap-3 md:grid-cols-4">
              <SummaryCard label="Genel ilerleme" value={`%${formatQuantity(progress)}`} />
              <SummaryCard label="Kesif poz sayisi" value={String(project.kesif?.length ?? 0)} />
              <SummaryCard label="Metraj kaydi" value={String(project.metraj?.length ?? 0)} />
              <SummaryCard label="Hakedis sayisi" value={String(project.hakedis?.length ?? 0)} />
            </div>
            <InfoGrid info={project.info ?? {}} />
          </section>
        ) : null}

        {activeTab === "Kesif" ? (
          <KesifTable
            rows={project.kesif ?? []}
            total={kesifTotal}
            userCanEdit={Boolean(user?.canEdit)}
          />
        ) : null}

        {activeTab === "Pozlar" ? <PozlarTable rows={project.kesif ?? []} /> : null}

        {activeTab === "Metraj" ? (
          <MetrajPanel rows={project.metraj ?? []} userCanEdit={Boolean(user?.canEdit)} />
        ) : null}

        {activeTab === "Metraj Icmali" ? (
          <MetrajIcmali rows={metrajSummary} total={metrajTotal} />
        ) : null}

        {activeTab === "Raporlar" ? (
          <ReportsPanel
            onKesif={() =>
              downloadCsv("aksu-kesif.csv", [
                ["Poz No", "Poz Adi", "Birim", "Metraj", "Fiyat", "Toplam"],
                ...(project.kesif ?? []).map((row) => [
                  row.poz_no,
                  row.ad,
                  row.birim,
                  formatQuantity(row.metraj),
                  formatCurrency(row.fiyat),
                  formatCurrency(row.toplam)
                ])
              ])
            }
            onMetraj={() =>
              downloadCsv("aksu-metraj.csv", [
                ["Tarih", "Poz No", "Miktar", "Birim", "Tutar", "Imalat Yeri", "Aciklama"],
                ...(project.metraj ?? []).map((row) => [
                  row.tarih ?? "",
                  row.poz_no ?? "",
                  formatQuantity(row.miktar),
                  row.birim ?? "",
                  formatCurrency(row.tutar),
                  row.imalat_yeri ?? "",
                  row.aciklama ?? ""
                ])
              ])
            }
          />
        ) : null}

        {activeTab === "Fiyat Farki" ? <FiyatFarkiPanel project={project} /> : null}
        {activeTab === "Revize Fiyat" ? <Placeholder title="Revize Fiyat" /> : null}
        {activeTab === "Hakedis" ? <HakedisPanel rows={project.hakedis ?? []} /> : null}
      </section>
    </main>
  );
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

function KesifTable({ rows, total, userCanEdit }: { rows: any[]; total: number; userCanEdit: boolean }) {
  return (
    <div className="mt-5 overflow-hidden rounded border border-[#d7d0c4] bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-[#d7d0c4] bg-[#eef0ec] px-4 py-3">
        <div className="flex items-center gap-2 font-semibold">
          <Ruler size={17} />
          Kesif
        </div>
        <span className="text-sm font-semibold">Toplam: {formatCurrency(total)} TL</span>
      </div>
      {userCanEdit ? (
        <div className="border-b border-[#d7d0c4] bg-[#f8f6f1] px-4 py-3 text-sm text-[#61706b]">
          Poz ekleme/duzenleme formu sonraki adimda Supabase kaydina baglanacak.
        </div>
      ) : null}
      <DataTable
        headers={["Poz No", "Poz Adi", "Birim", "Metraj", "Fiyat", "Toplam"]}
        rows={rows.map((row) => [
          row.poz_no,
          row.ad,
          row.birim,
          formatQuantity(row.metraj),
          formatCurrency(row.fiyat),
          formatCurrency(row.toplam)
        ])}
      />
    </div>
  );
}

function PozlarTable({ rows }: { rows: any[] }) {
  return (
    <div className="mt-5 overflow-hidden rounded border border-[#d7d0c4] bg-white">
      <div className="border-b border-[#d7d0c4] bg-[#eef0ec] px-4 py-3 font-semibold">Pozlar</div>
      <DataTable
        headers={["Poz No", "Poz Adi", "Birim", "Sozlesme Metraji"]}
        rows={rows.map((row) => [row.poz_no, row.ad, row.birim, formatQuantity(row.metraj)])}
      />
    </div>
  );
}

function MetrajPanel({ rows, userCanEdit }: { rows: any[]; userCanEdit: boolean }) {
  return (
    <div className="mt-5 grid gap-4">
      {userCanEdit ? (
        <div className="rounded border border-[#d7d0c4] bg-white p-4">
          <h2 className="font-semibold">Gunluk Imalat Girisi</h2>
          <p className="mt-2 text-sm text-[#61706b]">
            Eski uygulamadaki Poz No, Tarih, Imalat Yeri, Miktar ve Aciklama formu web'e tasindi;
            kaydetme islemi sonraki adimda Supabase tablosuna baglanacak.
          </p>
        </div>
      ) : null}
      <div className="overflow-hidden rounded border border-[#d7d0c4] bg-white">
        <div className="border-b border-[#d7d0c4] bg-[#eef0ec] px-4 py-3 font-semibold">Metraj Kayitlari</div>
        <DataTable
          headers={["Tarih", "Poz No", "Miktar", "Birim", "Tutar", "Imalat Yeri", "Aciklama"]}
          rows={rows.map((row) => [
            row.tarih ?? "",
            row.poz_no ?? "",
            formatQuantity(row.miktar),
            row.birim ?? "",
            formatCurrency(row.tutar),
            row.imalat_yeri ?? "",
            row.aciklama ?? ""
          ])}
        />
      </div>
    </div>
  );
}

function MetrajIcmali({ rows, total }: { rows: any[]; total: number }) {
  return (
    <div className="mt-5 overflow-hidden rounded border border-[#d7d0c4] bg-white">
      <div className="flex items-center justify-between border-b border-[#d7d0c4] bg-[#eef0ec] px-4 py-3">
        <span className="font-semibold">Metraj Icmali</span>
        <span className="text-sm font-semibold">Toplam: {formatCurrency(total)} TL</span>
      </div>
      <DataTable
        headers={["Poz No", "Poz Adi", "Birim", "Toplam Miktar", "Toplam Tutar"]}
        rows={rows.map((row) => [
          row.pozNo,
          row.ad,
          row.birim,
          formatQuantity(row.quantity),
          formatCurrency(row.amount)
        ])}
      />
    </div>
  );
}

function ReportsPanel({ onKesif, onMetraj }: { onKesif: () => void; onMetraj: () => void }) {
  return (
    <div className="mt-5 grid gap-3 md:grid-cols-2">
      <button className="rounded border border-[#d7d0c4] bg-white p-5 text-left" onClick={onKesif} type="button">
        <FileSpreadsheet size={22} className="text-[#1f4d3a]" />
        <h2 className="mt-4 font-semibold">Kesif Excel</h2>
        <p className="mt-2 text-sm text-[#61706b]">Kesif pozlarini CSV/Excel olarak indir.</p>
      </button>
      <button className="rounded border border-[#d7d0c4] bg-white p-5 text-left" onClick={onMetraj} type="button">
        <FileSpreadsheet size={22} className="text-[#1f4d3a]" />
        <h2 className="mt-4 font-semibold">Metraj Excel</h2>
        <p className="mt-2 text-sm text-[#61706b]">Metraj kayitlarini CSV/Excel olarak indir.</p>
      </button>
    </div>
  );
}

function FiyatFarkiPanel({ project }: { project: any }) {
  const rows = project.fiyat_farki?.rows ?? [];
  return (
    <div className="mt-5 overflow-hidden rounded border border-[#d7d0c4] bg-white">
      <div className="flex items-center gap-2 border-b border-[#d7d0c4] bg-[#eef0ec] px-4 py-3 font-semibold">
        <BarChart3 size={17} />
        Fiyat Farki Katsayilari
      </div>
      <DataTable
        headers={["Kod", "Katsayi", "Baz", "Aciklama"]}
        rows={rows.map((row: any) => [
          row.code,
          formatQuantity(row.katsayi),
          formatQuantity(row.baz),
          row.aciklama
        ])}
      />
    </div>
  );
}

function HakedisPanel({ rows }: { rows: any[] }) {
  return (
    <div className="mt-5 overflow-hidden rounded border border-[#d7d0c4] bg-white">
      <div className="border-b border-[#d7d0c4] bg-[#eef0ec] px-4 py-3 font-semibold">Hakedis</div>
      <DataTable
        headers={["No", "Tarih", "Durum", "Toplam", "Tahakkuk"]}
        rows={rows.map((row) => [
          String(row.no ?? ""),
          row.tarih ?? "",
          row.kesin ? "Kesin" : "Taslak",
          formatCurrency(row.toplam_bu_hakedis),
          formatCurrency(row.tahakkuk_kdv_dahil)
        ])}
      />
    </div>
  );
}

function Placeholder({ title }: { title: string }) {
  return (
    <div className="mt-5 rounded border border-[#d7d0c4] bg-white p-5">
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-[#61706b]">
        Eski uygulamadaki bu sekmenin hesaplama ve kayit mantigi web'e tasinacak.
      </p>
    </div>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] border-collapse text-sm">
        <thead>
          <tr className="bg-[#f8f6f1] text-left">
            {headers.map((header) => (
              <th className="border-b border-[#d7d0c4] px-3 py-2" key={header}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? (
            rows.map((row, rowIndex) => (
              <tr key={`${row[0]}-${rowIndex}`}>
                {row.map((cell, cellIndex) => (
                  <td className="border-b border-[#eee8dc] px-3 py-2" key={`${cellIndex}-${cell}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td className="px-3 py-8 text-center text-[#61706b]" colSpan={headers.length}>
                Kayit yok.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
