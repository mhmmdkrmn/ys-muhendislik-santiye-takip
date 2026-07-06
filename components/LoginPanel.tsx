"use client";

import { FormEvent, useEffect, useState } from "react";
import { LockKeyhole, LogOut, ShieldCheck } from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase";

type Profile = {
  full_name: string;
  role: "admin" | "saha";
};

export function LoginPanel() {
  const supabase = createSupabaseClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [message, setMessage] = useState("Supabase baglantisi hazir.");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setMessage("Supabase ortam degiskenleri eksik.");
      return;
    }

    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      await loadProfile(data.user.id);
    });
  }, [supabase]);

  async function loadProfile(userId: string) {
    if (!supabase) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", userId)
      .single();

    if (error) {
      setMessage("Giris basarili, profil rolu henuz tanimli degil.");
      return;
    }

    setProfile(data);
    setMessage(`${data.full_name} olarak giris yapildi.`);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setMessage("Supabase baglantisi bulunamadi.");
      return;
    }

    setIsLoading(true);
    setMessage("Giris kontrol ediliyor...");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setMessage("Giris basarisiz. E-posta veya sifreyi kontrol et.");
      setIsLoading(false);
      return;
    }

    if (data.user) {
      await loadProfile(data.user.id);
    }

    setIsLoading(false);
  }

  async function handleLogout() {
    if (!supabase) return;

    await supabase.auth.signOut();
    setProfile(null);
    setPassword("");
    setMessage("Cikis yapildi.");
  }

  if (profile) {
    return (
      <div className="mt-6 rounded bg-[#f4f1ea] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-[#1f4d3a]">
              <ShieldCheck size={16} />
              Aktif oturum
            </p>
            <p className="mt-2 text-lg font-semibold">{profile.full_name}</p>
            <p className="mt-1 text-sm text-[#61706b]">
              Yetki: {profile.role === "admin" ? "Yonetici" : "Saha Kullanici"}
            </p>
          </div>
          <button
            className="inline-flex items-center justify-center rounded border border-[#c8c0b3] bg-white px-3 py-2 text-sm"
            onClick={handleLogout}
            type="button"
          >
            <LogOut size={16} />
          </button>
        </div>
        <p className="mt-4 text-sm text-[#61706b]">{message}</p>
      </div>
    );
  }

  return (
    <form className="mt-6 grid gap-3" onSubmit={handleSubmit}>
      <label className="grid gap-2 text-sm font-medium">
        E-posta
        <input
          className="rounded border border-[#c8c0b3] px-3 py-3 text-sm outline-none focus:border-[#1f4d3a]"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="muhammed@ysmuhendislik.com"
          type="email"
          value={email}
        />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Sifre
        <input
          className="rounded border border-[#c8c0b3] px-3 py-3 text-sm outline-none focus:border-[#1f4d3a]"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Supabase kullanici sifresi"
          type="password"
          value={password}
        />
      </label>
      <button
        className="mt-2 inline-flex items-center justify-center gap-2 rounded bg-[#1f4d3a] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isLoading}
        type="submit"
      >
        <LockKeyhole size={17} />
        {isLoading ? "Kontrol ediliyor" : "Giris yap"}
      </button>
      <p className="text-sm text-[#61706b]">{message}</p>
    </form>
  );
}
