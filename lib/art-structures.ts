export type ArtStructureType =
  | "Hidrant"
  | "Vantuz"
  | "Tahliye"
  | "Ayrim Yapisi"
  | "Hat Kapama Vanasi";

export type ArtStructure = {
  id: string;
  code: string;
  line: string;
  kilometer: string;
  type: ArtStructureType;
  detail: string;
  status: "Tamamlanmadi" | "Tamamlandi";
  concreteSize?: string;
  coverSize?: string;
  airValveDiameter?: string;
  valveInstalled?: boolean;
  mechanicalInstalled?: boolean;
  steelPipeInstalled?: boolean;
  flangeInstalled?: boolean;
  coverInstalled?: boolean;
  needsRevision?: boolean;
  revisionNote?: string;
  includedInProgressPayment?: boolean;
  note?: string;
};

export const artStructuresStorageKey = "ys-art-structures-v1";
export const artStructurePresetsStorageKey = "ys-art-structure-presets-v1";

export const artStructureTypes: ArtStructureType[] = [
  "Hidrant",
  "Vantuz",
  "Tahliye",
  "Ayrim Yapisi",
  "Hat Kapama Vanasi"
];

export const defaultArtStructurePresets = [
  "Tek cikisli, hat sonu degil, sade",
  "Tek cikisli, hat sonu, sade",
  "Tek cikisli, hat sonu degil, vantuzlu",
  "Tek cikisli, hat sonu, vantuzlu",
  "Cift cikisli, hat sonu degil, sade",
  "Cift cikisli, hat sonu, sade",
  "Cift cikisli, hat sonu degil, vantuzlu",
  "Cift cikisli, hat sonu, vantuzlu",
  "Sade vantuz",
  "Cazibeli tahliye",
  "Pompajli tahliye",
  "Ayrim yapisi",
  "Hat kapama vanasi"
];

export const artStructures: ArtStructure[] = [
  {
    id: "sy-001",
    code: "SY-001",
    line: "S1 Anahat",
    kilometer: "0+420,00",
    type: "Vantuz",
    detail: "Sade vantuz",
    status: "Tamamlanmadi"
  },
  {
    id: "sy-002",
    code: "SY-002",
    line: "S1 Anahat",
    kilometer: "2+180,00",
    type: "Hidrant",
    detail: "Tek cikisli, hat sonu degil, sade",
    status: "Tamamlanmadi"
  },
  {
    id: "sy-003",
    code: "SY-003",
    line: "S1 Yedek-11",
    kilometer: "5+760,00",
    type: "Tahliye",
    detail: "Cazibeli tahliye",
    status: "Tamamlanmadi"
  },
  {
    id: "sy-004",
    code: "SY-004",
    line: "S1 Yedek-14",
    kilometer: "8+050,00",
    type: "Ayrim Yapisi",
    detail: "Yedek-11 ayrim noktasi",
    status: "Tamamlandi"
  },
  {
    id: "sy-005",
    code: "SY-005",
    line: "P1 Anahat",
    kilometer: "12+300,00",
    type: "Hat Kapama Vanasi",
    detail: "Ana hat kapama vanasi",
    status: "Tamamlanmadi"
  },
  {
    id: "sy-006",
    code: "SY-006",
    line: "S1 Yedek-14-2-1",
    kilometer: "15+520,00",
    type: "Hidrant",
    detail: "Cift cikisli, hat sonu, vantuzlu",
    status: "Tamamlanmadi",
    note: "15520. metredeki sanat yapisi"
  },
  {
    id: "sy-007",
    code: "SY-007",
    line: "P1 Anahat",
    kilometer: "18+900,00",
    type: "Tahliye",
    detail: "Pompajli tahliye",
    status: "Tamamlanmadi"
  }
];

export function kilometerToMeters(kilometer: string) {
  const normalized = kilometer.trim().replace(".", "").replace(",", ".");
  const [kmPart, meterPart = "0"] = normalized.split("+");
  const kilometers = Number(kmPart);
  const meters = Number(meterPart);

  if (Number.isNaN(kilometers) || Number.isNaN(meters)) {
    return Number.MAX_SAFE_INTEGER;
  }

  return kilometers * 1000 + meters;
}

export function getArtStructureLines() {
  return Array.from(new Set(artStructures.map((item) => item.line))).sort((a, b) =>
    a.localeCompare(b, "tr")
  );
}

export function sortArtStructuresByLineAndKm(items: ArtStructure[]) {
  return [...items].sort((a, b) => {
    const lineCompare = a.line.localeCompare(b.line, "tr", {
      numeric: true,
      sensitivity: "base"
    });

    if (lineCompare !== 0) return lineCompare;

    return kilometerToMeters(a.kilometer) - kilometerToMeters(b.kilometer);
  });
}
