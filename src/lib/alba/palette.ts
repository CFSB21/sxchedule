export type Palette = {
  background: string;
  foreground: string;
  primary: string;
  secondary: string;
  card: string;
  accent: string;
  muted: string;
  border: string;
};

export const DEFAULT_PALETTE: Palette = {
  background: "#121410",
  foreground: "#ece8e1",
  primary: "#b7c9bf",
  secondary: "#242720",
  card: "#1b1d19",
  accent: "#2a2e27",
  muted: "#9a9488",
  border: "#32362e",
};

export const PALETTE_FIELDS: {
  key: keyof Palette;
  label: string;
}[] = [
  { key: "background", label: "Fondo" },
  { key: "foreground", label: "Texto" },
  { key: "primary", label: "Principal" },
  { key: "secondary", label: "Secundario" },
  { key: "card", label: "Tarjetas" },
  { key: "accent", label: "Acento" },
  { key: "muted", label: "Texto suave" },
  { key: "border", label: "Bordes" },
];

const HEX = /^#([0-9a-fA-F]{6})$/;

export function isHex(value: string): value is `#${string}` {
  return HEX.test(value);
}

export function normalizePalette(
  input?: Partial<Palette> | null,
): Palette | undefined {
  if (!input) return undefined;
  const next: Palette = { ...DEFAULT_PALETTE };
  let any = false;
  for (const key of Object.keys(DEFAULT_PALETTE) as (keyof Palette)[]) {
    const value = input[key];
    if (typeof value === "string" && isHex(value)) {
      next[key] = value.toLowerCase();
      any = true;
    }
  }
  return any ? next : undefined;
}

function hexToRgb(hex: string): [number, number, number] | null {
  const m = HEX.exec(hex);
  if (!m) return null;
  const n = parseInt(m[1]!, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance(rgb: [number, number, number]) {
  const lin = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lin[0]! + 0.7152 * lin[1]! + 0.0722 * lin[2]!;
}

export function contrastOn(
  bg: string,
  light = "#ece8e1",
  dark = "#141612",
) {
  const rgb = hexToRgb(bg);
  if (!rgb) return dark;
  return luminance(rgb) > 0.45 ? dark : light;
}

function mix(a: string, b: string, t: number) {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  if (!A || !B) return a;
  const ch = (i: number) =>
    Math.round(A[i]! * (1 - t) + B[i]! * t)
      .toString(16)
      .padStart(2, "0");
  return `#${ch(0)}${ch(1)}${ch(2)}`;
}

const CSS_VARS = [
  "--color-background",
  "--color-foreground",
  "--color-card",
  "--color-card-foreground",
  "--color-popover",
  "--color-popover-foreground",
  "--color-primary",
  "--color-primary-foreground",
  "--color-secondary",
  "--color-secondary-foreground",
  "--color-muted",
  "--color-muted-foreground",
  "--color-accent",
  "--color-accent-foreground",
  "--color-border",
  "--color-input",
  "--color-ring",
  "--color-heatmap-0",
  "--color-heatmap-1",
  "--color-heatmap-2",
  "--color-heatmap-3",
  "--color-heatmap-4",
  "--color-day-ok",
  "--color-day-ok-fg",
  "--color-day-warn",
  "--color-day-warn-fg",
  "--color-day-fail",
  "--color-day-fail-fg",
  "--background",
  "--foreground",
] as const;

export function applyPalette(palette?: Partial<Palette> | null) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const merged = normalizePalette(palette);
  if (!merged) {
    for (const key of CSS_VARS) root.style.removeProperty(key);
    return;
  }
  const onPrimary = contrastOn(merged.primary);
  const set = (key: string, value: string) =>
    root.style.setProperty(key, value);
  set("--color-background", merged.background);
  set("--background", merged.background);
  set("--color-foreground", merged.foreground);
  set("--foreground", merged.foreground);
  set("--color-card", merged.card);
  set("--color-card-foreground", merged.foreground);
  set("--color-popover", merged.card);
  set("--color-popover-foreground", merged.foreground);
  set("--color-primary", merged.primary);
  set("--color-primary-foreground", onPrimary);
  set("--color-secondary", merged.secondary);
  set("--color-secondary-foreground", merged.foreground);
  set("--color-muted", merged.secondary);
  set("--color-muted-foreground", merged.muted);
  set("--color-accent", merged.accent);
  set("--color-accent-foreground", merged.foreground);
  set("--color-border", merged.border);
  set("--color-input", merged.border);
  set("--color-ring", merged.primary);
  set("--color-heatmap-0", merged.secondary);
  set("--color-heatmap-1", mix(merged.secondary, merged.primary, 0.35));
  set("--color-heatmap-2", mix(merged.secondary, merged.primary, 0.55));
  set("--color-heatmap-3", mix(merged.secondary, merged.primary, 0.78));
  set("--color-heatmap-4", mix(merged.primary, merged.foreground, 0.25));
  const ok = mix(merged.primary, "#4e9a62", 0.7);
  const warn = mix(merged.primary, "#d2a63a", 0.78);
  const fail = mix(merged.primary, "#d2675c", 0.78);
  set("--color-day-ok", ok);
  set("--color-day-ok-fg", contrastOn(ok));
  set("--color-day-warn", warn);
  set("--color-day-warn-fg", contrastOn(warn));
  set("--color-day-fail", fail);
  set("--color-day-fail-fg", contrastOn(fail));
}
