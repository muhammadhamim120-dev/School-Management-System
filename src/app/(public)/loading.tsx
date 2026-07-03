import { GraduationCap } from "lucide-react";

export default function PublicLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5">
      <div className="relative">
        <div className="absolute inset-0 animate-ping rounded-2xl bg-primary/30" style={{ animationDuration: "1.6s" }} />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-float">
          <GraduationCap className="h-7 w-7" />
        </div>
      </div>
      <div className="h-1 w-40 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-1/2 animate-[shimmer_1.2s_infinite] rounded-full bg-primary" />
      </div>
    </div>
  );
}
