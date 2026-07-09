"use client";

import Link from "next/link";
import { ArrowLeft, HardHat, LogOut, ShieldCheck, UsersRound } from "lucide-react";
import { projects } from "@/lib/projects";
import { useCurrentUser } from "@/lib/use-current-user";

const knownUsers = [
  {
    email: "muhammed@ysmuhendislik.com",
    name: "Muhammed Karaman",
    title: "Santiye Sefi",
    projects: ["dim-baraji", "aksu-tigh"],
    permission: "Tam yetki"
  },
  {
    email: "aydin@ysmuhendislik.com",
    name: "Aydin Akgun",
    title: "Proje Muduru",
    projects: ["dim-baraji", "aksu-tigh"],
    permission: "Tam yetki"
  },
  {
    email: "bouth@ysmuhendislik.com",
    name: "Bouth",
    title: "Goruntuleme",
    projects: ["dim-baraji"],
    permission: "Goruntuleme"
  }
];

export default function UsersPage() {
  const { isLoading, logout, user } = useCurrentUser();

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f4f1ea] text-[#1d2522]">
        <p className="text-sm text-[#61706b]">Kullanicilar aciliyor...</p>
      </main>
    );
  }

  if (!user?.canManageUsers) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f4f1ea] px-5 text-center text-[#1d2522]">
        <p>Bu ekrana erisim yetkin yok.</p>
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
              <p className="font-semibold">Kullanici ve Proje Yetkileri</p>
              <p className="text-sm text-[#61706b]">
                {user.name} - {user.title}
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

      <section className="mx-auto max-w-6xl px-5 py-8">
        <Link className="inline-flex items-center gap-2 text-sm font-medium text-[#61706b]" href="/panel">
          <ArrowLeft size={16} />
          Proje secimine don
        </Link>

        <div className="mt-5 border-b border-[#d7d0c4] pb-5">
          <div className="flex items-center gap-2 text-sm font-medium text-[#1f4d3a]">
            <UsersRound size={17} />
            Kullanicilar
          </div>
          <h1 className="mt-2 text-2xl font-semibold">Proje Yetkileri</h1>
          <p className="mt-2 text-sm leading-6 text-[#61706b]">
            Bu ekran simdilik mevcut yetki haritasini gosterir. Sonraki adimda buradan Supabase
            kullanicisi olusturma ve proje yetkisi kaydetme eklenir.
          </p>
        </div>

        <div className="mt-5 overflow-hidden rounded border border-[#d7d0c4] bg-white">
          <div className="grid grid-cols-[1fr_160px_160px_1fr] gap-4 border-b border-[#d7d0c4] bg-[#eef0ec] px-4 py-3 text-sm font-semibold max-md:hidden">
            <span>Kullanici</span>
            <span>Unvan</span>
            <span>Yetki</span>
            <span>Projeler</span>
          </div>
          <div className="divide-y divide-[#e4ded4]">
            {knownUsers.map((knownUser) => (
              <article
                className="grid gap-3 px-4 py-4 md:grid-cols-[1fr_160px_160px_1fr] md:items-center"
                key={knownUser.email}
              >
                <div>
                  <p className="font-semibold">{knownUser.name}</p>
                  <p className="text-sm text-[#61706b]">{knownUser.email}</p>
                </div>
                <span>{knownUser.title}</span>
                <span className="inline-flex items-center gap-2 text-sm">
                  <ShieldCheck size={15} />
                  {knownUser.permission}
                </span>
                <div className="flex flex-wrap gap-2">
                  {projects
                    .filter((project) => knownUser.projects.includes(project.id))
                    .map((project) => (
                      <span className="rounded bg-[#eef0ec] px-2 py-1 text-xs" key={project.id}>
                        {project.name}
                      </span>
                    ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
