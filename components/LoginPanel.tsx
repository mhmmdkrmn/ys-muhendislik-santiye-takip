"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase";

export function LoginPanel() {
  const router = useRouter();
  const supabase = createSupabaseClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setMessage("Baglanti ayarlari eksik.");
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      router.replace("/panel");
    });
  }, [router, supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setMessage("Supabase baglantisi bulunamadi.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setMessage("Giris basarisiz. Kullanici adi veya sifreyi kontrol et.");
      setIsLoading(false);
      return;
    }

    if (data.user) {
      router.push("/panel");
    }

    setIsLoading(false);
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <label className="grid gap-2 text-sm font-medium">
        Kullanici adi
        <input
          className="rounded border border-[#c8c0b3] px-3 py-3 text-sm outline-none focus:border-[#1f4d3a]"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Kullanici adi"
          type="email"
          value={email}
        />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Sifre
        <input
          className="rounded border border-[#c8c0b3] px-3 py-3 text-sm outline-none focus:border-[#1f4d3a]"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Sifre"
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
        {isLoading ? "Kontrol ediliyor" : "Giris"}
      </button>
      {message ? <p className="text-sm text-[#9c3d2f]">{message}</p> : null}
    </form>
  );
}
