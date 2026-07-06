"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, Construction, HardHat, LogOut } from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase";
import { AppUser, getAppUser } from "@/lib/permissions";

type Profile = {
  full_name: string;
};

export default function PanelPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseClient(), []);
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f4f1ea] text-[#1d2522]">
        <p className="text-sm text-[#61706b]">Panel aciliyor...</p>
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

      <section className="mx-auto max-w-6xl px-5 py-10">
        <h1 className="text-2xl font-semibold">Panel</h1>
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
            <p className="mt-2 text-sm leading-6 text-[#61706b]">
              Hatlara bagli sanat yapilarini kilometre sirasi ve tur filtreleriyle takip et.
            </p>
          </Link>
        </div>
      </section>
    </main>
  );
}
