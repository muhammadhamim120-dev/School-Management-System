import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Greenwood Parent Portal",
  description: "Attendance, results, routine, homework, fees and more for guardians.",
  manifest: "/portal-manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Greenwood" },
};

export const viewport: Viewport = {
  themeColor: "#0f766e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-[#f5f5f7] text-[#1d1d1f] antialiased dark:bg-black dark:text-[#f5f5f7]">
      {children}
      <script
        dangerouslySetInnerHTML={{
          __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/portal-sw.js').catch(function(){})})}`,
        }}
      />
    </div>
  );
}
