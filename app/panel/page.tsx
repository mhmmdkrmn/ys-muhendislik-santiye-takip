"use client";

import Link from "next/link";
import { ArrowUpRight, FolderKanban, LogOut, UsersRound } from "lucide-react";
import { canAccessProject } from "@/lib/permissions";
import { projects } from "@/lib/projects";
import { useCurrentUser } from "@/lib/use-current-user";

export default function PanelPage() {
  const { isLoading, logout, user } = useCurrentUser();

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f4f1ea] text-[#1d2522]">
        <p className="text-sm text-[#61706b]">Projeler aciliyor...</p>
      </main>
    );
  }

  const allowedProjects = projects.filter((project) => canAccessProject(user, project.id));

  return (
    <main className="min-h-screen bg-[#f4f1ea] text-[#1d2522]">
      <header className="border-b border-[#d7d0c4] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div>
            <p className="font-semibold">YS Muhendislik Santiye Takip</p>
            <p className="text-sm text-[#61706b]">
              {user?.name ?? "Kullanici"} - {user?.title ?? "Goruntuleme"}
            </p>
          </div>
          <div className="flex gap-2">
            {user?.canManageUsers ? (
              <Link
                className="inline-flex items-center gap-2 rounded border border-[#c8c0b3] bg-white px-3 py-2 text-sm font-medium"
                href="/panel/kullanicilar"
              >
                <UsersRound size={16} />
                Kullanicilar
              </Link>
            ) : null}
            <button
              className="inline-flex items-center gap-2 rounded border border-[#c8c0b3] bg-white px-3 py-2 text-sm font-medium"
              onClick={logout}
              type="button"
            >
              <LogOut size={16} />
              Cikis
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-10">
        <h1 className="text-2xl font-semibold">Proje Secimi</h1>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {allowedProjects.map((project) => (
            <Link
              className="group rounded border border-[#d7d0c4] bg-white p-5 shadow-sm transition hover:border-[#1f4d3a]"
              href={project.href}
              key={project.id}
            >
              <div className="flex items-start justify-between gap-4">
                <span className="grid size-11 place-items-center rounded bg-[#eef0ec] text-[#1f4d3a]">
                  <FolderKanban size={22} />
                </span>
                <ArrowUpRight className="text-[#61706b] transition group-hover:text-[#1f4d3a]" size={19} />
              </div>
              <h2 className="mt-5 text-lg font-semibold">{project.name}</h2>
              <p className="mt-2 text-sm leading-6 text-[#61706b]">{project.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
