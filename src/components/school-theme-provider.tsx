"use client";
import * as React from "react";
import { request } from "@/services/api-client";

type Theme = {
  primary?: string;
  secondary?: string;
  accent?: string;
  background?: string;
  foreground?: string;
  muted?: string;
  borderRadius?: string;
};

type SettingsResponse = {
  theme?: Theme | null;
  customCss?: string | null;
  logo?: string | null;
  schoolName?: string;
};

function hexToHsl(hex: string): string | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return `0 0% ${Math.round(l * 100)}%`;
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const mapping: [keyof Theme, string][] = [
    ["primary", "--primary"],
    ["secondary", "--secondary"],
    ["accent", "--accent"],
    ["background", "--background"],
    ["foreground", "--foreground"],
    ["muted", "--muted"],
  ];
  for (const [key, cssVar] of mapping) {
    const val = theme[key];
    if (typeof val === "string" && val.startsWith("#")) {
      const hsl = hexToHsl(val);
      if (hsl) root.style.setProperty(cssVar, hsl);
    }
  }
  if (theme.borderRadius) {
    root.style.setProperty("--radius", theme.borderRadius);
  }
}

export function SchoolThemeProvider({ children }: { children: React.ReactNode }) {
  const styleRef = React.useRef<HTMLStyleElement | null>(null);

  React.useEffect(() => {
    request<SettingsResponse>("/api/settings")
      .then((data) => {
        if (data.theme) applyTheme(data.theme);
        if (data.customCss) {
          if (!styleRef.current) {
            styleRef.current = document.createElement("style");
            styleRef.current.setAttribute("id", "school-custom-css");
            document.head.appendChild(styleRef.current);
          }
          styleRef.current.textContent = data.customCss;
        }
      })
      .catch(() => {});
  }, []);

  return <>{children}</>;
}
