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

type AksuProject = {
  id: number;
  name: string;
  info?: Record<string, string>;
  kesif?: AksuPoz[];
  metraj?: AksuMetraj[];
};

const project = (aksuData as { projects: AksuProject[] }).projects[0];

export function getAksuProject() {
  return project;
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
