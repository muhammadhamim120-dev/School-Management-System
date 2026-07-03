// SMS gateway abstraction.
//
// Same SOLID/DIP pattern as the payment gateways: callers depend on the
// SmsProvider interface, resolved via getSmsProvider(). The active provider is
// chosen with the SMS_PROVIDER env var; each provider declares the env vars it
// needs and reports isConfigured() so the UI can show availability. No
// credentials are hardcoded. Until a provider's send() is wired to its real
// HTTP API, it returns a "not configured / pending" result and messages are
// stored as DRAFT/QUEUED rather than actually dispatched.

export type SmsSendInput = { to: string; text: string };
export type SmsSendResult = { to: string; ok: boolean; error?: string };

export interface SmsProvider {
  readonly id: string;
  isConfigured(): boolean;
  requiredEnv(): string[];
  send(messages: SmsSendInput[]): Promise<SmsSendResult[]>;
}

function readEnv(keys: string[]): { values: Record<string, string>; missing: string[] } {
  const values: Record<string, string> = {};
  const missing: string[] = [];
  for (const k of keys) {
    const v = process.env[k];
    if (v && v.trim()) values[k] = v;
    else missing.push(k);
  }
  return { values, missing };
}

function notConfigured(id: string, to: SmsSendInput[]): SmsSendResult[] {
  return to.map((m) => ({ to: m.to, ok: false, error: `${id} provider not configured` }));
}

/** SSL Wireless (sms.net.bd / smsplus) — common in Bangladesh. */
class SslWirelessProvider implements SmsProvider {
  readonly id = "SSL_WIRELESS";
  requiredEnv() { return ["SSL_SMS_API_TOKEN", "SSL_SMS_SID", "SSL_SMS_BASE_URL"]; }
  isConfigured() { return readEnv(this.requiredEnv()).missing.length === 0; }
  async send(messages: SmsSendInput[]): Promise<SmsSendResult[]> {
    if (!this.isConfigured()) return notConfigured(this.id, messages);
    // TODO: POST to SSL_SMS_BASE_URL with SSL_SMS_API_TOKEN + SSL_SMS_SID.
    return messages.map((m) => ({ to: m.to, ok: false, error: "pending: SSL Wireless send not wired" }));
  }
}

/** Grameenphone enterprise SMS. */
class GrameenphoneProvider implements SmsProvider {
  readonly id = "GP";
  requiredEnv() { return ["GP_SMS_CLIENT_ID", "GP_SMS_CLIENT_SECRET", "GP_SMS_BASE_URL"]; }
  isConfigured() { return readEnv(this.requiredEnv()).missing.length === 0; }
  async send(messages: SmsSendInput[]): Promise<SmsSendResult[]> {
    if (!this.isConfigured()) return notConfigured(this.id, messages);
    return messages.map((m) => ({ to: m.to, ok: false, error: "pending: GP send not wired" }));
  }
}

/** Robi enterprise SMS. */
class RobiProvider implements SmsProvider {
  readonly id = "ROBI";
  requiredEnv() { return ["ROBI_SMS_API_KEY", "ROBI_SMS_BASE_URL"]; }
  isConfigured() { return readEnv(this.requiredEnv()).missing.length === 0; }
  async send(messages: SmsSendInput[]): Promise<SmsSendResult[]> {
    if (!this.isConfigured()) return notConfigured(this.id, messages);
    return messages.map((m) => ({ to: m.to, ok: false, error: "pending: Robi send not wired" }));
  }
}

/** Banglalink enterprise Bulk SMS. */
class BanglalinkProvider implements SmsProvider {
  readonly id = "BANGLALINK";
  requiredEnv() { return ["BANGLALINK_SMS_API_KEY", "BANGLALINK_SMS_SENDER_ID", "BANGLALINK_SMS_BASE_URL"]; }
  isConfigured() { return readEnv(this.requiredEnv()).missing.length === 0; }
  async send(messages: SmsSendInput[]): Promise<SmsSendResult[]> {
    if (!this.isConfigured()) return notConfigured(this.id, messages);
    // TODO: POST to BANGLALINK_SMS_BASE_URL with api_key + sender_id.
    return messages.map((m) => ({ to: m.to, ok: false, error: "pending: Banglalink send not wired" }));
  }
}

/** Generic HTTP provider — for any REST SMS gateway (incl. Banglalink). */
class GenericHttpProvider implements SmsProvider {
  readonly id = "GENERIC_HTTP";
  requiredEnv() { return ["SMS_HTTP_BASE_URL", "SMS_HTTP_API_KEY"]; }
  isConfigured() { return readEnv(this.requiredEnv()).missing.length === 0; }
  async send(messages: SmsSendInput[]): Promise<SmsSendResult[]> {
    if (!this.isConfigured()) return notConfigured(this.id, messages);
    return messages.map((m) => ({ to: m.to, ok: false, error: "pending: generic HTTP send not wired" }));
  }
}

const registry: Record<string, SmsProvider> = {
  SSL_WIRELESS: new SslWirelessProvider(),
  GP: new GrameenphoneProvider(),
  ROBI: new RobiProvider(),
  BANGLALINK: new BanglalinkProvider(),
  GENERIC_HTTP: new GenericHttpProvider(),
};

export function getSmsProvider(): SmsProvider {
  const id = (process.env.SMS_PROVIDER || "SSL_WIRELESS").toUpperCase();
  return registry[id] ?? registry.SSL_WIRELESS;
}

export function smsAvailability() {
  const active = getSmsProvider();
  return {
    active: active.id,
    configured: active.isConfigured(),
    providers: Object.values(registry).map((p) => ({ id: p.id, configured: p.isConfigured(), requiredEnv: p.requiredEnv() })),
  };
}
