"use client";
/**
 * AIVoiceWidget
 * ───────────────────────────────────────────────────────────────────────────
 * A premium floating AI-Voice button for the public website, powered by the
 * OFFICIAL core SDK `@vapi-ai/web` (not the React wrapper, which hit a
 * `"... is not a constructor"` ESM/CJS interop error under Next.js bundling).
 *
 * Mount it ONCE in the public layout (`src/app/(public)/layout.tsx`) so it
 * appears only on marketing pages and never on the admin dashboard, parent
 * portal, or auth pages.
 *
 *   <AIVoiceWidget />
 *
 * Configuration (client-safe, `NEXT_PUBLIC_`-prefixed):
 *   - NEXT_PUBLIC_VAPI_PUBLIC_KEY
 *   - NEXT_PUBLIC_VAPI_ASSISTANT_ID
 *
 * If either is missing the widget renders nothing.
 *
 * Correctness guarantees:
 *   • One Vapi instance per tab (module-level singleton, lazy, init-guarded).
 *   • The Vapi class is resolved defensively from `@vapi-ai/web` to survive
 *     every bundler interop shape (default export vs. namespace).
 *   • The SDK is loaded via dynamic `import()` so it is never in the initial
 *     bundle and never evaluated during SSR.
 */
import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Mic, MicOff, PhoneOff, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type Vapi from "@vapi-ai/web";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
const ASSISTANT_ID = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;

const EASE = [0.22, 1, 0.36, 1] as const;

/* ─────────────────────────── Vapi singleton ───────────────────────────
 * The SDK ships as CommonJS (`exports.default = Vapi`). Under Next.js the
 * default import can arrive as the module namespace object, which is not a
 * constructor — that is exactly what crashed the previous React-SDK approach.
 * Here we resolve the constructor defensively (unwrap `.default` as needed),
 * create the client exactly once, and reuse it for the tab's lifetime.
 */
type VapiClient = Vapi;
type VapiCtor = new (apiToken: string, apiBaseUrl?: string) => VapiClient;

let vapiInstance: VapiClient | null = null;
let initPromise: Promise<VapiClient> | null = null;

async function getVapi(publicKey: string): Promise<VapiClient> {
  if (vapiInstance) return vapiInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    // Dynamic import keeps the SDK (WebRTC/Daily) out of the server bundle.
    const mod = (await import("@vapi-ai/web")) as {
      default?: VapiCtor;
      Vapi?: VapiCtor;
    } & Record<string, unknown>;

    // Resolve the constructor across interop shapes:
    //   - mod.default is the class (webpack esModuleInterop) ✅ normal case
    //   - mod is the class itself (rare)
    //   - mod.default is STILL a namespace with its own .default (double-wrapped)
    let Ctor: unknown = mod.default ?? mod;
    if (typeof Ctor !== "function" && (Ctor as { default?: VapiCtor })?.default) {
      Ctor = (Ctor as { default: VapiCtor }).default;
    }
    if (typeof Ctor !== "function") {
      throw new TypeError(
        "Could not resolve the Vapi constructor from @vapi-ai/web. " +
          "Verify @vapi-ai/web is installed and not duplicated.",
      );
    }
    vapiInstance = new (Ctor as VapiCtor)(publicKey);
    return vapiInstance;
  })();

  // If init fails, allow a later retry (don't cache the failure).
  try {
    return await initPromise;
  } catch (e) {
    initPromise = null;
    throw e;
  }
}

/* ─────────────────────────── useAIVoiceCall hook ───────────────────────────
 * Replaces the removed `useVapiCall` from @vapi-ai/client-sdk-react with an
 * equivalent surface driven directly by @vapi-ai/web events.
 */
interface VoiceCallApi {
  isCallActive: boolean;
  isSpeaking: boolean;
  volumeLevel: number;
  connectionStatus: "disconnected" | "connecting" | "connected";
  isMuted: boolean;
  startCall: () => Promise<void>;
  endCall: () => Promise<void>;
  toggleMute: () => void;
}

function useAIVoiceCall(publicKey: string, assistantId: string): VoiceCallApi {
  const clientRef = React.useRef<VapiClient | null>(null);
  const volRef = React.useRef(0);
  const rafRef = React.useRef<number | null>(null);

  const [connectionStatus, setConnectionStatus] =
    React.useState<VoiceCallApi["connectionStatus"]>("disconnected");
  const [isCallActive, setIsCallActive] = React.useState(false);
  const [isSpeaking, setIsSpeaking] = React.useState(false);
  const [volumeLevel, setVolumeLevel] = React.useState(0);
  const [isMuted, setIsMuted] = React.useState(false);

  // Attach the SDK event listeners once the singleton is ready.
  React.useEffect(() => {
    let disposed = false;
    type Pair = [event: Parameters<VapiClient["on"]>[0], handler: (...a: unknown[]) => void];
    const pairs: Pair[] = [];

    getVapi(publicKey)
      .then((client) => {
        if (disposed) return;
        clientRef.current = client;

        const onCallStart = () => {
          setConnectionStatus("connected");
          setIsCallActive(true);
          setIsMuted(client.isMuted());
        };
        const onCallEnd = () => {
          setConnectionStatus("disconnected");
          setIsCallActive(false);
          setIsSpeaking(false);
          setVolumeLevel(0);
        };
        const onSpeechStart = () => setIsSpeaking(true);
        const onSpeechEnd = () => setIsSpeaking(false);
        const onError = (e: unknown) =>
          console.error("[vapi] voice error:", (e as Error)?.message ?? e);
        // Volume fires very frequently — coalesce to one state update per frame.
        const onVolume = (v: unknown) => {
          volRef.current = typeof v === "number" ? v : 0;
          if (rafRef.current == null) {
            rafRef.current = requestAnimationFrame(() => {
              rafRef.current = null;
              setVolumeLevel(volRef.current);
            });
          }
        };

        ([
          ["call-start", onCallStart],
          ["call-end", onCallEnd],
          ["speech-start", onSpeechStart],
          ["speech-end", onSpeechEnd],
          ["error", onError],
          ["volume-level", onVolume],
        ] as Pair[]).forEach(([event, handler]) => {
          client.on(event, handler as never);
          pairs.push([event, handler]);
        });
      })
      .catch((err) => console.error("[vapi] init failed:", err));

    return () => {
      disposed = true;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      const client = clientRef.current;
      if (client) {
        for (const [event, handler] of pairs) {
          try {
            client.off(event, handler as never);
          } catch {
            /* listener cleanup is best-effort */
          }
        }
      }
    };
  }, [publicKey]);

  const startCall = React.useCallback(async () => {
    const client = clientRef.current ?? (await getVapi(publicKey));
    if (connectionStatus !== "disconnected") return; // guard against duplicate starts
    setConnectionStatus("connecting");
    try {
      await client.start(assistantId);
    } catch (e) {
      setConnectionStatus("disconnected");
      console.error("[vapi] start failed:", (e as Error)?.message ?? e);
    }
  }, [assistantId, connectionStatus, publicKey]);

  const endCall = React.useCallback(async () => {
    const client = clientRef.current;
    if (!client) return;
    try {
      await client.stop();
    } catch (e) {
      console.error("[vapi] stop failed:", (e as Error)?.message ?? e);
      setConnectionStatus("disconnected");
      setIsCallActive(false);
    }
  }, []);

  const toggleMute = React.useCallback(() => {
    const client = clientRef.current;
    if (!client) return;
    const next = !client.isMuted();
    client.setMuted(next);
    setIsMuted(next);
  }, []);

  return { isCallActive, isSpeaking, volumeLevel, connectionStatus, isMuted, startCall, endCall, toggleMute };
}

/* ─────────────────────────── component ─────────────────────────── */

export function AIVoiceWidget() {
  // Defer until after hydration: the SDK touches browser-only APIs, so this
  // avoids any SSR/hydration mismatch and keeps the widget out of server HTML.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!mounted) return null;
  if (!PUBLIC_KEY || !ASSISTANT_ID) return null;

  return <WidgetInner publicKey={PUBLIC_KEY} assistantId={ASSISTANT_ID} />;
}

function WidgetInner({ publicKey, assistantId }: { publicKey: string; assistantId: string }) {
  const reduce = useReducedMotion();
  const [open, setOpen] = React.useState(false);

  const closeRef = React.useRef<HTMLButtonElement | null>(null);
  const fabRef = React.useRef<HTMLButtonElement | null>(null);
  const prevFocus = React.useRef<HTMLElement | null>(null);

  const { isCallActive, isSpeaking, volumeLevel, connectionStatus, isMuted, startCall, endCall, toggleMute } =
    useAIVoiceCall(publicKey, assistantId);

  const connecting = connectionStatus === "connecting";
  const live = isCallActive || connecting;

  React.useEffect(() => {
    if (live) setOpen(true);
  }, [live]);

  // While the panel is open: lock body scroll, support Escape, manage focus.
  React.useEffect(() => {
    if (!open) return;
    prevFocus.current = (document.activeElement as HTMLElement) ?? null;
    const focusTimer = setTimeout(() => closeRef.current?.focus(), 60);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      clearTimeout(focusTimer);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      prevFocus.current?.focus?.();
    };
  }, [open]);

  const onFabClick = () => {
    if (!live) {
      void startCall();
      setOpen(true);
    } else {
      setOpen((o) => !o);
    }
  };

  const statusText = connecting
    ? "Connecting…"
    : isCallActive
      ? isSpeaking
        ? "Assistant is speaking"
        : "Listening — how can I help?"
      : "Tap to talk to Greenwood AI";

  return (
    <div
      className={cn(
        "pointer-events-none fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 flex flex-col items-end gap-3",
      )}
      aria-live="off"
    >
      <div aria-live="polite" className="sr-only">
        {open ? statusText : ""}
      </div>

      {/* Active-call panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="ai-voice-panel"
            role="dialog"
            aria-modal="true"
            aria-label="AI voice call"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.28, ease: EASE }}
            className="glass pointer-events-auto w-[calc(100vw-2rem)] max-w-[330px] origin-bottom-right overflow-hidden rounded-3xl border border-white/25 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <div
                  aria-hidden
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-sm"
                >
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold leading-tight">Greenwood AI</p>
                  <p className="truncate text-[11px] text-muted-foreground">{statusText}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {live && (
                  <span
                    aria-hidden
                    className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400"
                  >
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> LIVE
                  </span>
                )}
                <button
                  ref={closeRef}
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Minimise voice panel"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Body: mic orb + equalizer */}
            <div className="flex flex-col items-center gap-2 px-4 py-6">
              <MicOrb live={live} speaking={isSpeaking} volume={volumeLevel} muted={isMuted} connecting={connecting} />
              <p className="mt-2 text-sm font-semibold">{statusText}</p>
              <Equalizer active={live && isSpeaking} volume={volumeLevel} />
              <p className="max-w-[260px] text-center text-[11px] leading-relaxed text-muted-foreground">
                {live
                  ? "Speak naturally. I can help with admissions, fees, timings and more."
                  : "Ask about admissions, fees, class timings, or book a visit."}
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between gap-2 border-t border-white/10 px-4 py-3">
              <button
                type="button"
                onClick={toggleMute}
                disabled={!live}
                aria-pressed={isMuted}
                aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
                className={cn(
                  "flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isMuted
                    ? "bg-destructive/15 text-destructive"
                    : "bg-white/10 text-foreground hover:bg-white/20",
                )}
              >
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                {isMuted ? "Unmute" : "Mute"}
              </button>
              <button
                type="button"
                onClick={() => void endCall()}
                disabled={!live}
                aria-label="End call"
                className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-destructive px-4 py-2 text-xs font-semibold text-destructive-foreground shadow-sm transition-all hover:brightness-110 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
              >
                <PhoneOff className="h-4 w-4" /> End call
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating action button */}
      <motion.button
        ref={fabRef}
        type="button"
        onClick={onFabClick}
        aria-label={live ? "AI voice call in progress — open panel" : "Start AI voice call"}
        aria-expanded={open}
        initial={reduce ? false : { opacity: 0, scale: 0.6, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.94 }}
        transition={{ type: "spring", stiffness: 300, damping: 22, delay: 0.15 }}
        className={cn(
          "glass pointer-events-auto relative flex h-14 w-14 items-center justify-center rounded-full border border-white/25 shadow-xl transition-colors sm:h-16 sm:w-16",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 rounded-full opacity-70 blur-md transition-opacity",
            live ? "opacity-70" : "opacity-0",
          )}
          style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.45), transparent 70%)" }}
        />

        {live && !reduce && (
          <>
            {[0, 0.6, 1.2].map((delay) => (
              <motion.span
                key={delay}
                aria-hidden
                className="absolute rounded-full border-2 border-primary"
                style={{ width: 56, height: 56 }}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1.5, opacity: [0, 0.5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: EASE, delay }}
              />
            ))}
          </>
        )}

        {live ? (
          <span className="relative flex items-center justify-center text-primary">
            {connecting ? (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-6 w-6 rounded-full border-2 border-primary/30 border-t-primary"
              />
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </span>
        ) : (
          <span className="flex items-center justify-center text-foreground" aria-hidden>
            <Mic className="h-6 w-6" />
          </span>
        )}

        {!live && !reduce && (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full border border-primary/40"
            animate={{ scale: [1, 1.25], opacity: [0.5, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: EASE }}
          />
        )}
      </motion.button>
    </div>
  );
}

/* ─────────────────────────── pieces ─────────────────────────── */

function MicOrb({
  live,
  speaking,
  volume,
  muted,
  connecting,
}: {
  live: boolean;
  speaking: boolean;
  volume: number;
  muted: boolean;
  connecting: boolean;
}) {
  const reduce = useReducedMotion();
  const scale = live && !reduce ? 1 + Math.min(0.18, (volume || 0) * 0.25) : 1;
  return (
    <div className="relative flex h-20 w-20 items-center justify-center" aria-hidden>
      <motion.div
        className={cn(
          "flex h-20 w-20 items-center justify-center rounded-full ring-1 backdrop-blur-xl",
          "bg-gradient-to-br to-card/80",
          live ? "from-primary/20 ring-primary/40" : "from-muted-foreground/10 ring-border/60",
        )}
        animate={{ scale }}
        transition={{ duration: 0.12 }}
        style={{ color: live ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}
      >
        <div
          className="pointer-events-none absolute inset-0 rounded-full opacity-60 blur-md"
          style={{
            background: live
              ? "radial-gradient(circle at 50% 50%, hsl(var(--primary)), transparent 70%)"
              : "transparent",
          }}
        />
        {connecting ? (
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary"
          />
        ) : muted ? (
          <MicOff className="h-7 w-7" />
        ) : (
          <Mic className="h-7 w-7" />
        )}
      </motion.div>
      {live && speaking && !reduce && (
        <motion.span
          className="absolute -right-1 top-1 h-3 w-3 rounded-full bg-emerald-500"
          animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      )}
    </div>
  );
}

function Equalizer({ active, volume }: { active: boolean; volume: number }) {
  const reduce = useReducedMotion();
  const bars = 5;
  const level = Math.max(0.15, Math.min(1, volume || 0));
  return (
    <div className="flex h-5 items-end gap-[3px]" aria-hidden>
      {Array.from({ length: bars }).map((_, i) => {
        const center = ((i - (bars - 1) / 2) / (bars - 1)) * 2;
        const wave = active && !reduce ? Math.max(0.2, 1 - Math.abs(center) * (1 - level)) : 0.3;
        return (
          <motion.span
            key={i}
            className="w-[3px] rounded-full bg-primary/70"
            style={{ height: "100%", transformOrigin: "bottom" }}
            animate={active && !reduce ? { scaleY: [wave * 0.5, wave, wave * 0.6] } : { scaleY: 0.3 }}
            transition={
              active && !reduce
                ? { duration: 0.5, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay: i * 0.08 }
                : { duration: 0.2 }
            }
          />
        );
      })}
    </div>
  );
}
