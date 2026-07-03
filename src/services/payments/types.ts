// Payment gateway abstraction.
//
// Design goals (SOLID):
//  - Single responsibility: each provider only knows how to talk to its own API.
//  - Open/closed: add a new provider by implementing PaymentGatewayProvider — no
//    changes to callers.
//  - Liskov: every provider is interchangeable behind the interface.
//  - Interface segregation: a small, focused contract (initiate / verify).
//  - Dependency inversion: callers depend on the interface, resolved via a factory.
//
// NOTE: These are integration-ready scaffolds. They read configuration from
// environment variables and never hardcode credentials. Until the corresponding
// env vars are set and the real API calls are wired in, providers report
// themselves as unconfigured and initiate() returns a clear error.

export type GatewayId = "BKASH" | "NAGAD" | "ROCKET" | "SSLCOMMERZ";

export type InitiatePaymentInput = {
  invoiceId: string;
  amount: number;
  currency?: string; // defaults to BDT
  customerName?: string;
  customerPhone?: string;
  /** Where the gateway should redirect the payer back to. */
  callbackUrl: string;
};

export type InitiatePaymentResult =
  | { ok: true; redirectUrl: string; gatewayRef: string }
  | { ok: false; error: string };

export type VerifyPaymentResult =
  | { ok: true; status: "SUCCESS" | "PENDING" | "FAILED"; gatewayRef: string; amount?: number }
  | { ok: false; error: string };

export type RefundPaymentInput = {
  gatewayRef: string;
  amount: number;
  reason?: string;
};

export type RefundPaymentResult =
  | { ok: true; refundRef: string; amount: number }
  | { ok: false; error: string };

/** Result of verifying an incoming webhook's authenticity. */
export type WebhookVerifyResult =
  | { ok: true; gatewayRef: string; status: "SUCCESS" | "PENDING" | "FAILED"; amount?: number; invoiceId?: string }
  | { ok: false; error: string };

export interface PaymentGatewayProvider {
  readonly id: GatewayId;
  /** True when all required env vars are present. */
  isConfigured(): boolean;
  /** The env var names this provider needs (for the settings page). */
  requiredEnv(): string[];
  /** Begin a payment; returns a redirect URL for the hosted checkout. */
  initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult>;
  /** Verify/settle a payment by its gateway reference. */
  verify(gatewayRef: string): Promise<VerifyPaymentResult>;
  /** Refund (full or partial) a settled payment. */
  refund(input: RefundPaymentInput): Promise<RefundPaymentResult>;
  /**
   * Authenticate & parse an incoming webhook. Implementations must validate the
   * signature/secret before trusting the payload. Returns normalized fields.
   */
  parseWebhook(headers: Record<string, string>, rawBody: string): Promise<WebhookVerifyResult>;
}

/** Small helper for providers: read an env var, tracking which are missing. */
export function readEnv(keys: string[]): { values: Record<string, string>; missing: string[] } {
  const values: Record<string, string> = {};
  const missing: string[] = [];
  for (const k of keys) {
    const v = process.env[k];
    if (v && v.trim()) values[k] = v;
    else missing.push(k);
  }
  return { values, missing };
}

export const NOT_CONFIGURED = (id: GatewayId, missing: string[]): InitiatePaymentResult => ({
  ok: false,
  error: `${id} gateway is not configured. Missing environment variables: ${missing.join(", ")}.`,
});
