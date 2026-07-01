export function PageHero({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <section className="border-b bg-gradient-to-br from-primary/10 via-background to-background">
      <div className="container py-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">{subtitle}</p>}
      </div>
    </section>
  );
}
