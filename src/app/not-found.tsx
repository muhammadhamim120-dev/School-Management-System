import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
      {/* aurora accent */}
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.25] dark:opacity-[0.12]" />
      <div className="relative">
        <p className="text-[80px] font-bold leading-none tracking-tighter text-gradient sm:text-[120px] lg:text-[160px]">404</p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">Page not found</h1>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
        </p>
        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Link href="/" className="press glow inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-elevated transition-transform hover:scale-[1.02]">
            <Home className="h-4 w-4" /> Back to home
          </Link>
          <Link href="/contact" className="press inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card/60 px-6 py-3 text-sm font-medium transition-colors hover:bg-accent">
            <ArrowLeft className="h-4 w-4" /> Contact us
          </Link>
        </div>
      </div>
    </div>
  );
}
