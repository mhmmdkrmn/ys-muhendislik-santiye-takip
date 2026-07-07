export type PipelineLine = {
  id: string;
  name: string;
  mainLine: "S1" | "P1";
  branchName: string;
  pipeNote?: string;
};

export const linesStorageKey = "ys-lines-v1";

export const defaultLines: PipelineLine[] = [
  {
    id: "line-s1-main",
    name: "S1 Anahat",
    mainLine: "S1",
    branchName: "Anahat",
    pipeNote: "Boru capi ve uzunluklari sonraki adimda girilecek"
  },
  {
    id: "line-s1-y11",
    name: "S1 Yedek-11",
    mainLine: "S1",
    branchName: "Yedek-11"
  },
  {
    id: "line-s1-y14",
    name: "S1 Yedek-14",
    mainLine: "S1",
    branchName: "Yedek-14"
  },
  {
    id: "line-s1-y14-2-1",
    name: "S1 Yedek14-2-1",
    mainLine: "S1",
    branchName: "Yedek14-2-1"
  },
  {
    id: "line-p1-main",
    name: "P1 Anahat",
    mainLine: "P1",
    branchName: "Anahat"
  }
];

export function buildLineName(mainLine: PipelineLine["mainLine"], branchName: string) {
  const cleanBranch = branchName.trim();
  return `${mainLine} ${cleanBranch || "Anahat"}`;
}

export function sortLines(lines: PipelineLine[]) {
  return [...lines].sort((a, b) =>
    a.name.localeCompare(b.name, "tr", {
      numeric: true,
      sensitivity: "base"
    })
  );
}
