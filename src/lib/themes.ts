export type ThemeType = {
  preset: string;
  radius: string;
  scale: string;
  contentLayout: string;
};

export const DEFAULT_THEME: ThemeType = {
  preset: "default",
  radius: "default",
  scale: "none",
  contentLayout: "default",
};

export const THEMES: Array<{
  name: string;
  value: string;
  colors: string[];
}> = [
  {
    name: "default",
    value: "default",
    colors: ["hsl(0, 0%, 0%)", "hsl(0, 0%, 100%)"],
  },
];
