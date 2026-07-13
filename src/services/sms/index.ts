// SMS gateway abstraction.
//
// SOLID/DIP: callers depend on the SmsProvider interface, resolved via
// getSmsProvider(). The active provider is chosen with the SMS_PROVIDER env
// var; each provider declares the env vars it needs and reports isConfigured()
// so the UI can show availability. No credentials are hardcoded.
//
// Each provider's send() makes a REAL HTTP POST to the operator's API (base
// URL + credentials all come from env vars). Bangladeshi SMS gateway response
// shapes vary by operator and account plan, so success detection is
// conservative: HTTP 2xx with no provider-reported error = success, and any
// returned message id is captured as providerRef for delivery-report (DLR)
// correlation. If your operator uses a different request schema, adjust the
// payload mapping below — all endpoints/auth stay env-driven.

export type SmsSendInput = { to: string; text: string };
export type SmsSendResult = {
  to: string;
  ok: boolean;
  error?: string;
  /** Provider message id, used to correlate inbound delivery reports. */
  providerRef?: string | null;
};

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

/** Normalize a Bangladeshi MSISDN to 88-prefixed international format. */
function normalizeMsisdn(phone: string): string {
  let p = (phone || "").replace(/[^\d]/g, "");
  if (!p) return p;
  if (p.startsWith("00")) p = p.slice(2);
  if (p.startsWith("88")) return p;
  if (p.startsWith("0")) return "88" + p;
  return p;
}

type ParsedResponse = {
  ok: boolean;
  status: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json: any | null;
  text: string;
};

/** POST JSON with an AbortController timeout. Returns parsed JSON (or null) + raw text. */
async function postJson(
  url: string,
  payload: unknown,
  headers: Record<string, string> = {},
  timeoutMs = 20000
): Promise<ParsedResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: "no-store",
    });
    const text = await res.text();
    let json: unknown = null;
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        /* provider returned a non-JSON body — leave json null, fall back to text */
      }
    }
    return { ok: res.ok, status: res.status, json, text };
  } finally {
    clearTimeout(timer);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function looksLikeError(json: any): boolean {
  if (!json || typeof json !== "object") return false;
  const code = String(
    json.status_code ?? json.ErrorCode ?? json.error_code ?? json.code ?? json.status ?? ""
  ).toUpperCase();
  // Common success markers across BD providers; anything else is treated as failure.
  if (code && !["200", "OK", "SUCCESS", "SUCCES", "0000", "ACCEPTED", "SENT"].includes(code)) {
    return true;
  }
  if (typeof json.status === "string" && /fail|error|invalid|reject|denied/i.test(json.status)) {
    return true;
  }
  return false;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractRef(json: any): string | null {
  if (!json || typeof json !== "object") return null;
  const direct =
    json.csms_id ?? json.message_id ?? json.msgId ?? json.messageId ??
    json.id ?? json.reference ?? json.tracking_id ?? null;
  if (direct) return String(direct);
  if (Array.isArray(json.data) && json.data[0]) {
    const first = json.data[0];
    return first?.message_id ?? first?.csms_id ?? first?.id ?? null;
  }
  return null;
}

/** Shared success/error mapper used after a provider HTTP call. */
function mapBatchResult(
  messages: SmsSendInput[],
  res: ParsedResponse,
  label: string
): SmsSendResult[] {
  const providerError =
    !res.ok || looksLikeError(jsonOrNull(res.json))
      ? `${label} HTTP ${res.status}: ${humanError(res.json) || res.text.slice(0, 160) || "send failed"}`
      : null;
  if (providerError) {
    return messages.map((m) => ({ to: m.to, ok: false, error: providerError }));
  }
  const ref = extractRef(res.json);
  return messages.map((m) => ({ to: m.to, ok: true, providerRef: ref }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function jsonOrNull(json: unknown): any {
  return json as any;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function humanError(json: any): string {
  if (!json || typeof json !== "object") return "";
  return String(
    json.status_message ?? json.Message ?? json.message ?? json.error ??
    json.errorMessage ?? json.detail ?? ""
  );
}

/** SSL Wireless (sms.sslwireless.com) — bulk SMS HTTP API. */
class SslWirelessProvider implements SmsProvider {
  readonly id = "SSL_WIRELESS";
  requiredEnv() {
    return ["SSL_SMS_API_TOKEN", "SSL_SMS_SID", "SSL_SMS_BASE_URL"];
  }
  isConfigured() {
    return readEnv(this.requiredEnv()).missing.length === 0;
  }
  async send(messages: SmsSendInput[]): Promise<SmsSendResult[]> {
    const { values, missing } = readEnv(this.requiredEnv());
    if (missing.length) return notConfigured(this.id, messages);
    const payload = {
      sid: values.SSL_SMS_SID,
      token: values.SSL_SMS_API_TOKEN,
      msisdn: messages.map((m) => normalizeMsisdn(m.to)).join(","),
      sms: messages[0]?.text ?? "",
      csms_id: `sms-${Date.now()}`,
    };
    try {
      const res = await postJson(values.SSL_SMS_BASE_URL, payload);
      return mapBatchResult(messages, res, "SSL Wireless");
    } catch (e) {
      return messages.map((m) => ({ to: m.to, ok: false, error: (e as Error).message }));
    }
  }
}

/** Grameenphone enterprise SMS. */
class GrameenphoneProvider implements SmsProvider {
  readonly id = "GP";
  requiredEnv() {
    return ["GP_SMS_CLIENT_ID", "GP_SMS_CLIENT_SECRET", "GP_SMS_BASE_URL"];
  }
  isConfigured() {
    return readEnv(this.requiredEnv()).missing.length === 0;
  }
  async send(messages: SmsSendInput[]): Promise<SmsSendResult[]> {
    const { values } = readEnv(this.requiredEnv());
    const payload = {
      clientId: values.GP_SMS_CLIENT_ID,
      clientSecret: values.GP_SMS_CLIENT_SECRET,
      senderId: process.env.GP_SMS_SENDER_ID || "SchoolSMS",
      msisdn: messages.map((m) => normalizeMsisdn(m.to)).join(","),
      message: messages[0]?.text ?? "",
    };
    try {
      const res = await postJson(values.GP_SMS_BASE_URL, payload);
      return mapBatchResult(messages, res, "Grameenphone");
    } catch (e) {
      return messages.map((m) => ({ to: m.to, ok: false, error: (e as Error).message }));
    }
  }
}

/** Robi Bulk SMS — enterprise HTTP API. */
class RobiProvider implements SmsProvider {
  readonly id = "ROBI";
  requiredEnv() {
    return ["ROBI_SMS_API_KEY", "ROBI_SMS_BASE_URL"];
  }
  isConfigured() {
    return readEnv(this.requiredEnv()).missing.length === 0;
  }
  async send(messages: SmsSendInput[]): Promise<SmsSendResult[]> {
    const { values } = readEnv(this.requiredEnv());
    const payload = {
      APIKey: values.ROBI_SMS_API_KEY,
      SenderID: process.env.ROBI_SMS_SENDER_ID || "SchoolSMS",
      MobileNumber: messages.map((m) => normalizeMsisdn(m.to)).join(","),
      Message: messages[0]?.text ?? "",
      IsUnicode: false,
    };
    try {
      const res = await postJson(values.ROBI_SMS_BASE_URL, payload);
      return mapBatchResult(messages, res, "Robi");
    } catch (e) {
      return messages.map((m) => ({ to: m.to, ok: false, error: (e as Error).message }));
    }
  }
}

/** Banglalink Bulk SMS — enterprise HTTP API. */
class BanglalinkProvider implements SmsProvider {
  readonly id = "BANGLALINK";
  requiredEnv() {
    return ["BANGLALINK_SMS_API_KEY", "BANGLALINK_SMS_SENDER_ID", "BANGLALINK_SMS_BASE_URL"];
  }
  isConfigured() {
    return readEnv(this.requiredEnv()).missing.length === 0;
  }
  async send(messages: SmsSendInput[]): Promise<SmsSendResult[]> {
    const { values } = readEnv(this.requiredEnv());
    const payload = {
      apiKey: values.BANGLALINK_SMS_API_KEY,
      senderId: values.BANGLALINK_SMS_SENDER_ID,
      mobileNumber: messages.map((m) => normalizeMsisdn(m.to)).join(","),
      message: messages[0]?.text ?? "",
    };
    try {
      const res = await postJson(values.BANGLALINK_SMS_BASE_URL, payload);
      return mapBatchResult(messages, res, "Banglalink");
    } catch (e) {
      return messages.map((m) => ({ to: m.to, ok: false, error: (e as Error).message }));
    }
  }
}

/** Generic HTTP provider — for any REST SMS gateway not covered above. */
class GenericHttpProvider implements SmsProvider {
  readonly id = "GENERIC_HTTP";
  requiredEnv() {
    return ["SMS_HTTP_BASE_URL", "SMS_HTTP_API_KEY"];
  }
  isConfigured() {
    return readEnv(this.requiredEnv()).missing.length === 0;
  }
  async send(messages: SmsSendInput[]): Promise<SmsSendResult[]> {
    const { values } = readEnv(this.requiredEnv());
    const payload = {
      apiKey: values.SMS_HTTP_API_KEY,
      senderId: process.env.SMS_HTTP_SENDER_ID || "SchoolSMS",
      to: messages.map((m) => normalizeMsisdn(m.to)).join(","),
      message: messages[0]?.text ?? "",
    };
    try {
      const res = await postJson(values.SMS_HTTP_BASE_URL, payload, {
        Authorization: `Bearer ${values.SMS_HTTP_API_KEY}`,
      });
      return mapBatchResult(messages, res, "Generic HTTP");
    } catch (e) {
      return messages.map((m) => ({ to: m.to, ok: false, error: (e as Error).message }));
    }
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
    providers: Object.values(registry).map((p) => ({
      id: p.id,
      configured: p.isConfigured(),
      requiredEnv: p.requiredEnv(),
    })),
  };
}
