"use client";
import { useI18n } from "@/components/i18n-provider";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { HelpCircle } from "lucide-react";

export function Field({
  label, error, children, className, required, helpText,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
  helpText?: string;
}) {
  const { tx } = useI18n();
  const translatedError = tx(error);
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center gap-1.5">
        <Label className="text-sm font-medium">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
        {helpText && (
          <div className="group relative">
            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-md bg-popover text-popover-foreground text-xs font-normal shadow-md border border-border opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 whitespace-nowrap max-w-[200px] text-wrap">
              {helpText}
            </div>
          </div>
        )}
      </div>
      {children}
      {translatedError && (
        <p className="text-xs text-destructive animate-shake">{translatedError}</p>
      )}
      {helpText && !translatedError && (
        <p className="text-xs text-muted-foreground/60">{helpText}</p>
      )}
    </div>
  );
}
