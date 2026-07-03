"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search, CornerDownLeft, ArrowUp, ArrowDown } from "lucide-react";
import { navItems } from "@/lib/nav";

type Item = { label: string; href: string; group: string };

// Flattened, searchable nav destinations for the ⌘K palette.
const ITEMS: Item[] = navItems.map((n) => ({ label: n.label, href: n.href, group: "Navigate" }));

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault(); setOpen((o) => !o);
      } else if (e.key === "Escape") setOpen(false);
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-command-palette", onOpen);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("open-command-palette", onOpen); };
  }, []);

  React.useEffect(() => { if (open) { setQuery(""); setActive(0); setTimeout(() => inputRef.current?.focus(), 40); } }, [open]);

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ITEMS;
    return ITEMS.filter((i) => i.label.toLowerCase().includes(q));
  }, [query]);

  React.useEffect(() => { setActive(0); }, [query]);

  const go = (href: string) => { setOpen(false); router.push(href); };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter" && results[active]) { e.preventDefault(); go(results[active].href); }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[14vh]"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
        >
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: -6 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="glass relative w-full max-w-xl overflow-hidden rounded-2xl shadow-float"
          >
            <div className="flex items-center gap-3 border-b border-border/60 px-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={onKeyDown}
                placeholder="Search pages…"
                className="h-14 w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
              />
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">ESC</kbd>
            </div>
            <div className="max-h-[52vh] overflow-y-auto p-2">
              {results.length === 0 ? (
                <div className="px-3 py-10 text-center text-sm text-muted-foreground">No results for “{query}”.</div>
              ) : results.map((r, i) => (
                <button
                  key={r.href}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(r.href)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                    i === active ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-accent/60"
                  }`}
                >
                  <span className="font-medium">{r.label}</span>
                  {i === active && <CornerDownLeft className="h-3.5 w-3.5 text-primary" />}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4 border-t border-border/60 px-4 py-2 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1"><ArrowUp className="h-3 w-3" /><ArrowDown className="h-3 w-3" /> navigate</span>
              <span className="flex items-center gap-1"><CornerDownLeft className="h-3 w-3" /> open</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
