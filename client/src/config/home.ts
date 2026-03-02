export const HOMES = [
  {id: "123", label: "Home A (123)"},
  {id: "456", label: "Home B (456)"},
] as const;

export type HomeId = (typeof HOMES)[number]["id"];
