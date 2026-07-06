"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HardHat, LogOut } from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase";

type Profile = {
  full_name: string;
  role: "admin" | "saha";
};

export default function PanelPage() {
  const router = useRouter();
  const supabase = createSupabaseClient();
  const [profile, setProfile] = useState<Profile | null>(null);
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

      <section className="mx-auto max-w-6xl px-5 py-10">
        <h1 className="text-2xl font-semibold">Panel</h1>
        <p className="mt-2 text-[#61706b]">
          Bu alan sonraki adimda santiye takip ekranlari icin duzenlenecek.
        </p>
      </section>
    </main>
  );
}
