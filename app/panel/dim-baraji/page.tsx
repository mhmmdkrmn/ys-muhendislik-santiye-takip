"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Construction,
  GitBranch,
  HardHat,
  LogOut
} from "lucide-react";
import { canAccessProject } from "@/lib/permissions";
import { useCurrentUser } from "@/lib/use-current-user";

export default function DimProjectPage() {
  const { isLoading, logout, user } = useCurrentUser();

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f4f1ea] text-[#1d2522]">
        <p className="text-sm text-[#61706b]">Proje aciliyor...</p>
      </main>
    );
  }

  if (!canAccessProject(user, "dim-baraji")) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f4f1ea] px-5 text-center text-[#1d2522]">
        <p>Bu projeye erisim yetkin yok.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f1ea] text-[#1d2522]">
      <header className="border-b border-[#d7d0c4] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded bg-[#1f4d3a] text-white">
              <HardHat size={21} strokeWidth={2.2} />
            </span>
            <div>
              <p className="font-semibold">Dim Baraji Sulamasi 2. Kisim</p>
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

      <section className="mx-auto max-w-6xl px-5 py-10">
        <Link className="inline-flex items-center gap-2 text-sm font-medium text-[#61706b]" href="/panel">
          <ArrowLeft size={16} />
          Proje secimine don
        </Link>
        <h1 className="mt-5 text-2xl font-semibold">Dim Baraji Sulamasi 2. Kisim</h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            className="group rounded border border-[#d7d0c4] bg-white p-5 shadow-sm transition hover:border-[#1f4d3a]"
            href="/panel/sanat-yapilari"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="grid size-11 place-items-center rounded bg-[#eef0ec] text-[#1f4d3a]">
                <Construction size={22} />
              </span>
              <ArrowUpRight className="text-[#61706b] transition group-hover:text-[#1f4d3a]" size={19} />
            </div>
            <h2 className="mt-5 text-lg font-semibold">Sanat Yapilari</h2>
          </Link>
          <Link
            className="group rounded border border-[#d7d0c4] bg-white p-5 shadow-sm transition hover:border-[#1f4d3a]"
            href="/panel/hatlar"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="grid size-11 place-items-center rounded bg-[#eef0ec] text-[#1f4d3a]">
                <GitBranch size={22} />
              </span>
              <ArrowUpRight className="text-[#61706b] transition group-hover:text-[#1f4d3a]" size={19} />
            </div>
            <h2 className="mt-5 text-lg font-semibold">Hatlar</h2>
          </Link>
        </div>
      </section>
    </main>
  );
}
