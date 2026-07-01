import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function Field({
  label, error, children, className, required,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label>{label}{required && <span className="text-destructive"> *</span>}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
