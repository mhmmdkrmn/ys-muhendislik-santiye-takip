import aksuData from "@/data/aksu-santiye-verileri.json";

type AksuPoz = {
  poz_no: string;
  ad: string;
  birim: string;
  metraj: number;
  fiyat: number;
  toplam: number;
};

type AksuMetraj = {
  id?: number | string;
  tarih?: string;
  poz_no?: string;
  miktar?: number;
  birim?: string;
  tutar?: number;
  imalat_yeri?: string;
  aciklama?: string;
};

type AksuHakedis = {
  no?: number | string;
  tarih?: string;
  kesin?: boolean;
  toplam_bu_hakedis?: number;
  tahakkuk_kdv_dahil?: number;
};

type AksuProject = {
  id: number;
  name: string;
  info?: Record<string, string>;
  kesif?: AksuPoz[];
  metraj?: AksuMetraj[];
  hakedis?: AksuHakedis[];
  fiyat_farki?: {
    rows?: Array<Record<string, string | number | undefined>>;
    [key: string]: unknown;
  };
};

const project = (aksuData as { projects: AksuProject[] }).projects[0];

function repairText(value: string) {
  try {
    const bytes = Uint8Array.from(value, (char) => char.charCodeAt(0));
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return value;
  }
}

function repairProjectText(projectData: AksuProject): AksuProject {
  return {
    ...projectData,
    name: repairText(projectData.name),
    info: Object.fromEntries(
      Object.entries(projectData.info ?? {}).map(([key, value]) => [key, repairText(value)])
    ),
    kesif: (projectData.kesif ?? []).map((row) => ({
      ...row,
      ad: repairText(row.ad),
      birim: repairText(row.birim)
    })),
    metraj: projectData.metraj ?? [],
    hakedis: projectData.hakedis ?? [],
    fiyat_farki: projectData.fiyat_farki
  };
}

export function getAksuProject() {
  return repairProjectText(project);
}

export function formatCurrency(value?: number) {
  return new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  }).format(value ?? 0);
}

export function formatQuantity(value?: number) {
  return new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 3
  }).format(value ?? 0);
}

export function getAksuMetrajSummary(projectData = getAksuProject()) {
  const pozMap = new Map((projectData.kesif ?? []).map((poz) => [poz.poz_no, poz]));
  const summary = new Map<string, { pozNo: string; ad: string; birim: string; quantity: number; amount: number }>();

  for (const record of projectData.metraj ?? []) {
    const pozNo = record.poz_no ?? "";
    const poz = pozMap.get(pozNo);
    const current = summary.get(pozNo) ?? {
      pozNo,
      ad: poz?.ad ?? "",
      birim: record.birim ?? poz?.birim ?? "",
      quantity: 0,
      amount: 0
    };
    current.quantity += Number(record.miktar ?? 0);
    current.amount += Number(record.tutar ?? 0);
    summary.set(pozNo, current);
  }

  return Array.from(summary.values()).sort((a, b) => a.pozNo.localeCompare(b.pozNo, "tr"));
}

export function getAksuProgressPercent(projectData = getAksuProject()) {
  const totalKesif = (projectData.kesif ?? []).reduce((sum, row) => sum + (row.toplam ?? 0), 0);
  const totalMetraj = (projectData.metraj ?? []).reduce((sum, row) => sum + (row.tutar ?? 0), 0);
  if (!totalKesif) return 0;
  return (totalMetraj / totalKesif) * 100;
}
