"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppUser, getAppUser } from "@/lib/permissions";
import { createSupabaseClient } from "@/lib/supabase";

type Profile = {
  full_name: string;
};

export function useCurrentUser() {
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
        .single<Profile>();

      setUser(getAppUser(data.user.email, profileData?.full_name));
      setIsLoading(false);
    });
  }, [router, supabase]);

  async function logout() {
    if (!supabase) return;

    await supabase.auth.signOut();
    router.replace("/");
  }

  return { isLoading, logout, supabase, user };
}
