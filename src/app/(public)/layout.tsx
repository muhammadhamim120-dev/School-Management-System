import { PublicNavbar } from "@/components/public/navbar";
import { PublicFooter } from "@/components/public/footer";
import { AuroraBackground } from "@/components/ux/aurora-background";
import { PageTransition } from "@/components/ux/motion";
import { ScrollProgress } from "@/components/public/scroll-progress";
import { AIVoiceWidget } from "@/components/AIVoiceWidget";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Cinematic aurora + particle background with mouse parallax */}
      <AuroraBackground />
      <ScrollProgress />
      <PublicNavbar />
      <main className="flex-1">
        <PageTransition>{children}</PageTransition>
      </main>
      <PublicFooter />
      {/* Floating AI voice assistant — bottom-right, all public pages */}
      <AIVoiceWidget />
    </div>
  );
}
