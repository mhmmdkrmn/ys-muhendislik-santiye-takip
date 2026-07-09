export type AppUser = {
  email: string;
  name: string;
  title: string;
  canEdit: boolean;
  canExport: boolean;
  canManageUsers: boolean;
  projectIds: string[];
};

export function getAppUser(email?: string | null, fallbackName = "Kullanici"): AppUser {
  const normalizedEmail = email?.toLocaleLowerCase("tr-TR") ?? "";

  if (normalizedEmail === "muhammed@ysmuhendislik.com") {
    return {
      email: normalizedEmail,
      name: "Muhammed Karaman",
      title: "Santiye Sefi",
      canEdit: true,
      canExport: true,
      canManageUsers: true,
      projectIds: ["dim-baraji", "aksu-tigh"]
    };
  }

  if (normalizedEmail === "aydin@ysmuhendislik.com") {
    return {
      email: normalizedEmail,
      name: "Aydin Akgun",
      title: "Proje Muduru",
      canEdit: true,
      canExport: true,
      canManageUsers: false,
      projectIds: ["dim-baraji", "aksu-tigh"]
    };
  }

  if (normalizedEmail === "bouth@ysmuhendislik.com") {
    return {
      email: normalizedEmail,
      name: "Bouth",
      title: "Goruntuleme",
      canEdit: false,
      canExport: true,
      canManageUsers: false,
      projectIds: ["dim-baraji"]
    };
  }

  return {
    email: normalizedEmail,
    name: fallbackName,
    title: "Goruntuleme",
    canEdit: false,
    canExport: true,
    canManageUsers: false,
    projectIds: ["dim-baraji"]
  };
}

export function canAccessProject(user: AppUser | null, projectId: string) {
  return Boolean(user?.projectIds.includes(projectId));
}
