import { cn } from "@/lib/utils";

// Shimmer skeleton — a moving highlight reads as more premium than a flat pulse.
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("shimmer rounded-md", className)} {...props} />;
}
export { Skeleton };
