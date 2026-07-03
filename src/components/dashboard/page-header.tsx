import { cn } from "@/lib/utils";

export function PageHeader({
  title, description, action, className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-8 flex flex-col gap-4 animate-fade-in sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="space-y-1.5">
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight">{title}</h1>
        {description && <p className="text-[15px] text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}
