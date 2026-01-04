export type ThemeType = {
  preset: string;
  radius: string;
  scale: string;
  contentLayout: string;
};

export const DEFAULT_THEME: ThemeType = {
  preset: "default",
  radius: "md",
  scale: "none",
  contentLayout: "full",
};

export const THEMES: Array<{
  name: string;
  value: string;
  colors: string[];
}> = [
  {
    name: "Default",
    value: "default",
    colors: ["hsl(0, 0%, 9%)", "hsl(0, 0%, 98%)"],
  },
  {
    name: "Blue",
    value: "blue",
    colors: ["hsl(221, 83%, 53%)", "hsl(210, 100%, 97%)"],
  },
  {
    name: "Green",
    value: "green",
    colors: ["hsl(142, 76%, 36%)", "hsl(138, 76%, 97%)"],
  },
  {
    name: "Orange",
    value: "orange",
    colors: ["hsl(24, 94%, 50%)", "hsl(24, 100%, 97%)"],
  },
  {
    name: "Red",
    value: "red",
    colors: ["hsl(0, 72%, 51%)", "hsl(0, 86%, 97%)"],
  },
  {
    name: "Violet",
    value: "violet",
    colors: ["hsl(262, 83%, 58%)", "hsl(270, 100%, 98%)"],
  },
  {
    name: "Yellow",
    value: "yellow",
    colors: ["hsl(47, 96%, 53%)", "hsl(48, 100%, 96%)"],
  },
  {
    name: "Slate",
    value: "slate",
    colors: ["hsl(215, 25%, 27%)", "hsl(210, 40%, 98%)"],
  },
];
