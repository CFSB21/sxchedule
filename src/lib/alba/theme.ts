export type ThemeMode = "light" | "dark";

export const THEME_STORAGE_KEY = "sxchedule-theme";

export const THEME_BOOT_SCRIPT = `try{if(localStorage.getItem("${THEME_STORAGE_KEY}")==="dark")document.documentElement.classList.add("dark")}catch(e){}`;

export function applyTheme(theme: ThemeMode) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* private mode */
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", theme === "dark" ? "#121410" : "#2F4A40");
  }
}
