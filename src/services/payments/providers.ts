import {
  type PaymentGatewayProvider,
  type InitiatePaymentInput,
  type InitiatePaymentResult,
  type VerifyPaymentResult,
  readEnv,
  NOT_CONFIGURED,
} from "./types";

// Each provider declares the env vars it needs. Real API wiring goes inside
// initiate()/verify() where marked — the structure is ready for it.

export class BkashProvider implements PaymentGatewayProvider {
  readonly id = "BKASH" as const;
  private required = ["BKASH_APP_KEY", "BKASH_APP_SECRET", "BKASH_USERNAME", "BKASH_PASSWORD", "BKASH_BASE_URL"];
  isConfigured() {
    return readEnv(this.required).missing.length === 0;
  }
  async initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const { missing } = readEnv(this.required);
    if (missing.length) return NOT_CONFIGURED(this.id, missing);
    // TODO: call bKash Tokenized Checkout — grant token, then create payment.
    // Return the bKash bkashURL as redirectUrl and paymentID as gatewayRef.
    return { ok: false, error: "bKash live integration pending: wire Tokenized Checkout in BkashProvider.initiate()." };
  }
  async verify(gatewayRef: string): Promise<VerifyPaymentResult> {
    const { missing } = readEnv(this.required);
    if (missing.length) return { ok: false, error: `bKash not configured (${missing.join(", ")}).` };
    // TODO: call bKash /execute or /query payment with gatewayRef.
    return { ok: false, error: "bKash verify pending." };
  }
}

export class NagadProvider implements PaymentGatewayProvider {
  readonly id = "NAGAD" as const;
  private required = ["NAGAD_MERCHANT_ID", "NAGAD_MERCHANT_PRIVATE_KEY", "NAGAD_PG_PUBLIC_KEY", "NAGAD_BASE_URL"];
  isConfigured() {
    return readEnv(this.required).missing.length === 0;
  }
  async initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const { missing } = readEnv(this.required);
    if (missing.length) return NOT_CONFIGURED(this.id, missing);
    // TODO: Nagad checkout — initialize then complete, signing with merchant key.
    return { ok: false, error: "Nagad live integration pending: wire checkout in NagadProvider.initiate()." };
  }
  async verify(gatewayRef: string): Promise<VerifyPaymentResult> {
    const { missing } = readEnv(this.required);
    if (missing.length) return { ok: false, error: `Nagad not configured (${missing.join(", ")}).` };
    return { ok: false, error: "Nagad verify pending." };
  }
}

export class RocketProvider implements PaymentGatewayProvider {
  readonly id = "ROCKET" as const;
  private required = ["ROCKET_MERCHANT_ID", "ROCKET_API_KEY", "ROCKET_BASE_URL"];
  isConfigured() {
    return readEnv(this.required).missing.length === 0;
  }
  async initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const { missing } = readEnv(this.required);
    if (missing.length) return NOT_CONFIGURED(this.id, missing);
    // TODO: Rocket (DBBL) merchant API.
    return { ok: false, error: "Rocket live integration pending: wire API in RocketProvider.initiate()." };
  }
  async verify(gatewayRef: string): Promise<VerifyPaymentResult> {
    const { missing } = readEnv(this.required);
    if (missing.length) return { ok: false, error: `Rocket not configured (${missing.join(", ")}).` };
    return { ok: false, error: "Rocket verify pending." };
  }
}

export class SslcommerzProvider implements PaymentGatewayProvider {
  readonly id = "SSLCOMMERZ" as const;
  private required = ["SSLCOMMERZ_STORE_ID", "SSLCOMMERZ_STORE_PASSWORD", "SSLCOMMERZ_BASE_URL"];
  isConfigured() {
    return readEnv(this.required).missing.length === 0;
  }
  async initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const { missing } = readEnv(this.required);
    if (missing.length) return NOT_CONFIGURED(this.id, missing);
    // TODO: SSLCommerz session create — POST to gwprocess; return GatewayPageURL.
    return { ok: false, error: "SSLCommerz live integration pending: wire session create in SslcommerzProvider.initiate()." };
  }
  async verify(gatewayRef: string): Promise<VerifyPaymentResult> {
    const { missing } = readEnv(this.required);
    if (missing.length) return { ok: false, error: `SSLCommerz not configured (${missing.join(", ")}).` };
    // TODO: validate via SSLCommerz validator API using val_id.
    return { ok: false, error: "SSLCommerz verify pending." };
  }
}
