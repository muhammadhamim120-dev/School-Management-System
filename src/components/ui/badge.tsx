import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/10 text-primary",
        secondary: "border-border bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive/10 text-destructive",
        outline: "border-border text-foreground",
        success: "border-transparent bg-success/12 text-success",
        warning: "border-transparent bg-warning/15 text-warning",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

const dotColor: Record<string, string> = {
  default: "bg-primary",
  secondary: "bg-muted-foreground",
  destructive: "bg-destructive",
  outline: "bg-muted-foreground",
  success: "bg-success",
  warning: "bg-warning",
};

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dotColor[variant ?? "default"])} />}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
