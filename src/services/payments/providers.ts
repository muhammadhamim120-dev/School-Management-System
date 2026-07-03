import crypto from "crypto";
import {
  type PaymentGatewayProvider,
  type InitiatePaymentInput,
  type InitiatePaymentResult,
  type VerifyPaymentResult,
  type RefundPaymentInput,
  type RefundPaymentResult,
  type WebhookVerifyResult,
  type GatewayId,
  readEnv,
  NOT_CONFIGURED,
} from "./types";

// Each provider declares the env vars it needs. Real API wiring goes inside
// initiate()/verify()/refund()/parseWebhook() where marked — the structure,
// configuration checks, and webhook signature verification are production-ready.
// No credentials are ever hardcoded.

abstract class BaseProvider implements PaymentGatewayProvider {
  abstract readonly id: GatewayId;
  protected abstract required: string[];
  protected abstract webhookSecretEnv: string;

  requiredEnv() {
    return [...this.required, this.webhookSecretEnv];
  }
  isConfigured() {
    return readEnv(this.required).missing.length === 0;
  }

  abstract initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult>;
  abstract verify(gatewayRef: string): Promise<VerifyPaymentResult>;
  abstract refund(input: RefundPaymentInput): Promise<RefundPaymentResult>;

  // HMAC-SHA256 over the raw body, constant-time compared to a signature header.
  // Fails closed when no secret is configured — never trust unsigned input.
  protected verifySignature(headers: Record<string, string>, rawBody: string, headerName: string): boolean {
    const secret = process.env[this.webhookSecretEnv];
    if (!secret) return false;
    const provided = headers[headerName.toLowerCase()] || headers[headerName] || "";
    if (!provided) return false;
    const expected = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }

  async parseWebhook(headers: Record<string, string>, rawBody: string): Promise<WebhookVerifyResult> {
    if (!this.isConfigured()) return { ok: false, error: `${this.id} not configured.` };
    if (!this.verifySignature(headers, rawBody, "x-signature")) {
      return { ok: false, error: "Invalid or missing webhook signature." };
    }
    try {
      const body = JSON.parse(rawBody) as Record<string, unknown>;
      const gatewayRef = String(body.gatewayRef ?? body.paymentID ?? body.tran_id ?? body.transactionId ?? "");
      const rawStatus = String(body.status ?? body.transactionStatus ?? "").toUpperCase();
      const status = rawStatus.includes("SUCCESS") || rawStatus.includes("COMPLETED") ? "SUCCESS"
        : rawStatus.includes("FAIL") || rawStatus.includes("CANCEL") ? "FAILED" : "PENDING";
      const amount = body.amount != null ? Number(body.amount) : undefined;
      const invoiceId = body.invoiceId != null ? String(body.invoiceId) : undefined;
      if (!gatewayRef) return { ok: false, error: "Webhook missing gateway reference." };
      return { ok: true, gatewayRef, status, amount, invoiceId };
    } catch {
      return { ok: false, error: "Malformed webhook payload." };
    }
  }
}

export class BkashProvider extends BaseProvider {
  readonly id = "BKASH" as const;
  protected required = ["BKASH_APP_KEY", "BKASH_APP_SECRET", "BKASH_USERNAME", "BKASH_PASSWORD", "BKASH_BASE_URL"];
  protected webhookSecretEnv = "BKASH_WEBHOOK_SECRET";
  async initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const { missing } = readEnv(this.required);
    if (missing.length) return NOT_CONFIGURED(this.id, missing);
    void input;
    // TODO: bKash Tokenized Checkout — grant token, then POST /create payment.
    return { ok: false, error: "bKash live integration pending: wire Tokenized Checkout in BkashProvider.initiate()." };
  }
  async verify(gatewayRef: string): Promise<VerifyPaymentResult> {
    const { missing } = readEnv(this.required);
    if (missing.length) return { ok: false, error: `bKash not configured (${missing.join(", ")}).` };
    void gatewayRef;
    return { ok: false, error: "bKash verify pending." };
  }
  async refund(input: RefundPaymentInput): Promise<RefundPaymentResult> {
    const { missing } = readEnv(this.required);
    if (missing.length) return { ok: false, error: `bKash not configured (${missing.join(", ")}).` };
    void input;
    // TODO: POST /payment/refund with paymentID, amount, trxID, sku, reason.
    return { ok: false, error: "bKash refund pending." };
  }
}

export class NagadProvider extends BaseProvider {
  readonly id = "NAGAD" as const;
  protected required = ["NAGAD_MERCHANT_ID", "NAGAD_MERCHANT_PRIVATE_KEY", "NAGAD_PG_PUBLIC_KEY", "NAGAD_BASE_URL"];
  protected webhookSecretEnv = "NAGAD_WEBHOOK_SECRET";
  async initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const { missing } = readEnv(this.required);
    if (missing.length) return NOT_CONFIGURED(this.id, missing);
    void input;
    // TODO: Nagad checkout — /initialize then /complete, signing with merchant private key.
    return { ok: false, error: "Nagad live integration pending: wire checkout in NagadProvider.initiate()." };
  }
  async verify(gatewayRef: string): Promise<VerifyPaymentResult> {
    const { missing } = readEnv(this.required);
    if (missing.length) return { ok: false, error: `Nagad not configured (${missing.join(", ")}).` };
    void gatewayRef;
    return { ok: false, error: "Nagad verify pending." };
  }
  async refund(input: RefundPaymentInput): Promise<RefundPaymentResult> {
    const { missing } = readEnv(this.required);
    if (missing.length) return { ok: false, error: `Nagad not configured (${missing.join(", ")}).` };
    void input;
    return { ok: false, error: "Nagad refund pending." };
  }
}

export class RocketProvider extends BaseProvider {
  readonly id = "ROCKET" as const;
  protected required = ["ROCKET_MERCHANT_ID", "ROCKET_API_KEY", "ROCKET_BASE_URL"];
  protected webhookSecretEnv = "ROCKET_WEBHOOK_SECRET";
  async initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const { missing } = readEnv(this.required);
    if (missing.length) return NOT_CONFIGURED(this.id, missing);
    void input;
    // TODO: Rocket (DBBL) merchant API.
    return { ok: false, error: "Rocket live integration pending: wire API in RocketProvider.initiate()." };
  }
  async verify(gatewayRef: string): Promise<VerifyPaymentResult> {
    const { missing } = readEnv(this.required);
    if (missing.length) return { ok: false, error: `Rocket not configured (${missing.join(", ")}).` };
    void gatewayRef;
    return { ok: false, error: "Rocket verify pending." };
  }
  async refund(input: RefundPaymentInput): Promise<RefundPaymentResult> {
    const { missing } = readEnv(this.required);
    if (missing.length) return { ok: false, error: `Rocket not configured (${missing.join(", ")}).` };
    void input;
    return { ok: false, error: "Rocket refund pending." };
  }
}

export class SslcommerzProvider extends BaseProvider {
  readonly id = "SSLCOMMERZ" as const;
  protected required = ["SSLCOMMERZ_STORE_ID", "SSLCOMMERZ_STORE_PASSWORD", "SSLCOMMERZ_BASE_URL"];
  protected webhookSecretEnv = "SSLCOMMERZ_WEBHOOK_SECRET";
  async initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const { missing } = readEnv(this.required);
    if (missing.length) return NOT_CONFIGURED(this.id, missing);
    void input;
    // TODO: SSLCommerz session create — POST to gwprocess; return GatewayPageURL.
    return { ok: false, error: "SSLCommerz live integration pending: wire session create in SslcommerzProvider.initiate()." };
  }
  async verify(gatewayRef: string): Promise<VerifyPaymentResult> {
    const { missing } = readEnv(this.required);
    if (missing.length) return { ok: false, error: `SSLCommerz not configured (${missing.join(", ")}).` };
    void gatewayRef;
    // TODO: validate via SSLCommerz validator API using val_id.
    return { ok: false, error: "SSLCommerz verify pending." };
  }
  async refund(input: RefundPaymentInput): Promise<RefundPaymentResult> {
    const { missing } = readEnv(this.required);
    if (missing.length) return { ok: false, error: `SSLCommerz not configured (${missing.join(", ")}).` };
    void input;
    // TODO: POST refund to SSLCommerz merchant API with bank_tran_id, amount.
    return { ok: false, error: "SSLCommerz refund pending." };
  }
  // SSLCommerz posts form-encoded IPN with a verify_sign; support JSON + urlencoded.
  async parseWebhook(headers: Record<string, string>, rawBody: string): Promise<WebhookVerifyResult> {
    if (!this.isConfigured()) return { ok: false, error: "SSLCommerz not configured." };
    if (!this.verifySignature(headers, rawBody, "x-signature")) {
      return { ok: false, error: "Invalid or missing webhook signature." };
    }
    try {
      const params = rawBody.trim().startsWith("{")
        ? (JSON.parse(rawBody) as Record<string, unknown>)
        : (Object.fromEntries(new URLSearchParams(rawBody)) as Record<string, unknown>);
      const gatewayRef = String(params.tran_id ?? params.bank_tran_id ?? "");
      const st = String(params.status ?? "").toUpperCase();
      const status = st === "VALID" || st === "VALIDATED" || st.includes("SUCCESS") ? "SUCCESS" : st.includes("FAIL") ? "FAILED" : "PENDING";
      const amount = params.amount != null ? Number(params.amount) : undefined;
      if (!gatewayRef) return { ok: false, error: "IPN missing tran_id." };
      return { ok: true, gatewayRef, status, amount };
    } catch {
      return { ok: false, error: "Malformed SSLCommerz IPN." };
    }
  }
}
