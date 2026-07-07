export type PipelineLine = {
  id: string;
  name: string;
  mainLine: "S1" | "P1";
  branchName: string;
  pipeNote?: string;
};

export const linesStorageKey = "ys-lines-v1";

export const s1BranchNames = [
  "Yedek-11",
  "Yedek-12",
  "Yedek-13",
  "Yedek-13-A",
  "Yedek-14",
  "Yedek-14-1",
  "Yedek-14-2",
  "Yedek-14-2-1",
  "Yedek-15",
  "Yedek-16",
  "Yedek-16-1",
  "Yedek-17",
  "Yedek-18",
  "Yedek-18-A",
  "Yedek-19",
  "Yedek-20",
  "Yedek-20-A",
  "Yedek-20-B",
  "Yedek-20-B-1",
  "Yedek-21",
  "Yedek-21-1",
  "Yedek-21-2",
  "Yedek-21-3",
  "Yedek-21-4",
  "Yedek-22",
  "Yedek-22-1",
  "Yedek-23",
  "Yedek-23-1",
  "Yedek-23-2",
  "Yedek-24",
  "Yedek-25",
  "Yedek-26"
];

export const s1BranchLines: PipelineLine[] = s1BranchNames.map((branchName) => ({
  id: `line-s1-${branchName.toLowerCase().replaceAll(" ", "-").replaceAll("--", "-")}`,
  name: buildLineName("S1", branchName),
  mainLine: "S1",
  branchName
}));

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
    name: "S1 Yedek-14-2-1",
    mainLine: "S1",
    branchName: "Yedek-14-2-1"
  },
  {
    id: "line-p1-main",
    name: "P1 Anahat",
    mainLine: "P1",
    branchName: "Anahat"
  },
  ...s1BranchLines.filter(
    (line) =>
      !["S1 Yedek-11", "S1 Yedek-14", "S1 Yedek-14-2-1"].includes(line.name)
  )
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

export function mergeRequiredS1Lines(lines: PipelineLine[]) {
  const existingNames = new Set(lines.map((line) => line.name));
  const missingLines = s1BranchLines.filter((line) => !existingNames.has(line.name));

  return sortLines([...lines, ...missingLines]);
}
