"use client";

import Link from "next/link";
import { ArrowLeft, ClipboardList, HardHat, LogOut, Ruler } from "lucide-react";
import { canAccessProject } from "@/lib/permissions";
import { formatCurrency, formatQuantity, getAksuProject } from "@/lib/aksu-data";
import { useCurrentUser } from "@/lib/use-current-user";

export default function AksuTighPage() {
  const { isLoading, logout, user } = useCurrentUser();
  const project = getAksuProject();
  const total = project.kesif?.reduce((sum, row) => sum + (row.toplam ?? 0), 0) ?? 0;

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
          <p className="mt-2 text-sm leading-6 text-[#61706b]">
            Eski Aksu Metraj Takip uygulamasindan alinan kesif ve metraj verileri web ekranina
            tasiniyor. Bu ilk surumde kesif pozlari ve ozetler goruntulenir.
          </p>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded border border-[#d7d0c4] bg-white p-4">
            <p className="text-sm text-[#61706b]">Kesif poz sayisi</p>
            <p className="mt-1 text-2xl font-semibold">{project.kesif?.length ?? 0}</p>
          </div>
          <div className="rounded border border-[#d7d0c4] bg-white p-4">
            <p className="text-sm text-[#61706b]">Kesif toplam</p>
            <p className="mt-1 text-2xl font-semibold">{formatCurrency(total)} TL</p>
          </div>
          <div className="rounded border border-[#d7d0c4] bg-white p-4">
            <p className="text-sm text-[#61706b]">Metraj kaydi</p>
            <p className="mt-1 text-2xl font-semibold">{project.metraj?.length ?? 0}</p>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded border border-[#d7d0c4] bg-white">
          <div className="flex items-center gap-2 border-b border-[#d7d0c4] bg-[#eef0ec] px-4 py-3 font-semibold">
            <Ruler size={17} />
            Kesif Pozlari
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-sm">
              <thead>
                <tr className="bg-[#f8f6f1] text-left">
                  <th className="border-b border-[#d7d0c4] px-3 py-2">Poz No</th>
                  <th className="border-b border-[#d7d0c4] px-3 py-2">Imalat</th>
                  <th className="border-b border-[#d7d0c4] px-3 py-2">Birim</th>
                  <th className="border-b border-[#d7d0c4] px-3 py-2 text-right">Metraj</th>
                  <th className="border-b border-[#d7d0c4] px-3 py-2 text-right">Fiyat</th>
                  <th className="border-b border-[#d7d0c4] px-3 py-2 text-right">Toplam</th>
                </tr>
              </thead>
              <tbody>
                {(project.kesif ?? []).map((row) => (
                  <tr key={row.poz_no}>
                    <td className="border-b border-[#eee8dc] px-3 py-2 font-semibold">{row.poz_no}</td>
                    <td className="border-b border-[#eee8dc] px-3 py-2">{row.ad}</td>
                    <td className="border-b border-[#eee8dc] px-3 py-2">{row.birim}</td>
                    <td className="border-b border-[#eee8dc] px-3 py-2 text-right">
                      {formatQuantity(row.metraj)}
                    </td>
                    <td className="border-b border-[#eee8dc] px-3 py-2 text-right">
                      {formatCurrency(row.fiyat)}
                    </td>
                    <td className="border-b border-[#eee8dc] px-3 py-2 text-right">
                      {formatCurrency(row.toplam)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
