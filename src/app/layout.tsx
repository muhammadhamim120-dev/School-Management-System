import type { Metadata } from "next";
import { Inter, Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { I18nProvider } from "@/components/i18n-provider";
import { Toaster } from "@/components/ui/toaster";
import { GlobalLoading } from "@/components/dashboard/global-loading";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const bangla = Noto_Sans_Bengali({ subsets: ["bengali"], variable: "--font-bangla" });

export const metadata: Metadata = {
  title: "Greenwood International School",
  description: "A modern School Management System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${bangla.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <I18nProvider>
            <GlobalLoading />
            {children}
            <Toaster />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
