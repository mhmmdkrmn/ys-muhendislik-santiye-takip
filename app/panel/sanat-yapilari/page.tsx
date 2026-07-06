"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Construction,
  Filter,
  HardHat,
  LogOut,
  MapPinned,
  Route
} from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase";
import {
  artStructures,
  artStructureTypes,
  getArtStructureLines,
  kilometerToMeters
} from "@/lib/art-structures";

type Profile = {
  full_name: string;
  role: "admin" | "saha";
};

export default function ArtStructuresPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseClient(), []);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("Tum Turler");
  const [lineFilter, setLineFilter] = useState("Tum Hatlar");

  const lines = useMemo(() => getArtStructureLines(), []);

  const filteredStructures = useMemo(() => {
    return artStructures
      .filter((item) => typeFilter === "Tum Turler" || item.type === typeFilter)
      .filter((item) => lineFilter === "Tum Hatlar" || item.line === lineFilter)
      .sort((a, b) => kilometerToMeters(a.kilometer) - kilometerToMeters(b.kilometer));
  }, [lineFilter, typeFilter]);

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
        .select("full_name, role")
        .eq("id", data.user.id)
        .single();

      setProfile(profileData);
      setIsLoading(false);
    });
  }, [router, supabase]);

  async function handleLogout() {
    if (!supabase) return;

    await supabase.auth.signOut();
    router.replace("/");
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
      <header className="border-b border-[#d7d0c4] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded bg-[#1f4d3a] text-white">
              <HardHat size={21} strokeWidth={2.2} />
            </span>
            <div>
              <p className="font-semibold">YS Muhendislik Santiye Takip</p>
              <p className="text-sm text-[#61706b]">
                {profile?.full_name ?? "Kullanici"} -{" "}
                {profile?.role === "admin" ? "Yonetici" : "Saha Kullanici"}
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

      <section className="mx-auto max-w-6xl px-5 py-8">
        <Link className="inline-flex items-center gap-2 text-sm font-medium text-[#61706b]" href="/panel">
          <ArrowLeft size={16} />
          Panele don
        </Link>

        <div className="mt-5 flex flex-col justify-between gap-4 border-b border-[#d7d0c4] pb-5 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-[#1f4d3a]">
              <Construction size={17} />
              Sanat Yapilari
            </div>
            <h1 className="mt-2 text-2xl font-semibold">Kilometre Sirali Liste</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#61706b]">
              Kayitlar hat ve ture gore filtrelenir; siralama kilometre bilgisinin metre
              karsiligina gore yapilir.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              <span className="inline-flex items-center gap-2">
                <Filter size={15} />
                Tur
              </span>
              <select
                className="min-w-48 rounded border border-[#c8c0b3] bg-white px-3 py-2 text-sm outline-none focus:border-[#1f4d3a]"
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
                className="min-w-48 rounded border border-[#c8c0b3] bg-white px-3 py-2 text-sm outline-none focus:border-[#1f4d3a]"
                onChange={(event) => setLineFilter(event.target.value)}
                value={lineFilter}
              >
                <option>Tum Hatlar</option>
                {lines.map((line) => (
                  <option key={line}>{line}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded border border-[#d7d0c4] bg-white">
          <div className="grid grid-cols-[120px_1fr_120px_150px] gap-4 border-b border-[#d7d0c4] bg-[#eef0ec] px-4 py-3 text-sm font-semibold text-[#33413c] max-md:hidden">
            <span>Kilometre</span>
            <span>Sanat yapisi</span>
            <span>Hat</span>
            <span>Durum</span>
          </div>

          <div className="divide-y divide-[#e4ded4]">
            {filteredStructures.map((item) => (
              <article
                className="grid gap-3 px-4 py-4 md:grid-cols-[120px_1fr_120px_150px] md:items-center"
                key={item.id}
              >
                <div className="flex items-center gap-2 font-semibold text-[#1f4d3a]">
                  <MapPinned size={16} />
                  {item.kilometer}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold">{item.code}</h2>
                    <span className="rounded bg-[#eef0ec] px-2 py-1 text-xs text-[#33413c]">
                      {item.type}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[#61706b]">{item.detail}</p>
                  {item.note ? <p className="mt-1 text-xs text-[#8a6a48]">{item.note}</p> : null}
                </div>
                <div className="text-sm font-medium">{item.line}</div>
                <div>
                  <span className="rounded bg-[#f4f1ea] px-3 py-2 text-sm text-[#33413c]">
                    {item.status}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
