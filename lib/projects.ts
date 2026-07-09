export type ProjectDefinition = {
  id: "dim-baraji" | "aksu-tigh";
  name: string;
  description: string;
  href: string;
};

export const projects: ProjectDefinition[] = [
  {
    id: "dim-baraji",
    name: "Dim Baraji Sulamasi 2. Kisim",
    description: "Sanat yapilari, hatlar, hak edis ve santiye takip modulleri.",
    href: "/panel/dim-baraji"
  },
  {
    id: "aksu-tigh",
    name: "Aksu TIGH 1. Kisim",
    description: "Aksu metraj takip uygulamasindan tasinan kesif ve metraj ekrani.",
    href: "/panel/aksu-tigh"
  }
];

export function getProject(projectId: string) {
  return projects.find((project) => project.id === projectId);
}
