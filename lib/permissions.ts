export type AppUser = {
  email: string;
  name: string;
  title: string;
  canEdit: boolean;
  canExport: boolean;
};

export function getAppUser(email?: string | null, fallbackName = "Kullanici"): AppUser {
  const normalizedEmail = email?.toLocaleLowerCase("tr-TR") ?? "";

  if (normalizedEmail === "muhammed@ysmuhendislik.com") {
    return {
      email: normalizedEmail,
      name: "Muhammed Karaman",
      title: "Santiye Sefi",
      canEdit: true,
      canExport: true
    };
  }

  if (normalizedEmail === "aydin@ysmuhendislik.com") {
    return {
      email: normalizedEmail,
      name: "Aydin Akgun",
      title: "Proje Muduru",
      canEdit: false,
      canExport: true
    };
  }

  return {
    email: normalizedEmail,
    name: fallbackName,
    title: "Goruntuleme",
    canEdit: false,
    canExport: true
  };
}
