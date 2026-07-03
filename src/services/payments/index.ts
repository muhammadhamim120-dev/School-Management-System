import type { GatewayId, PaymentGatewayProvider } from "./types";
import { BkashProvider, NagadProvider, RocketProvider, SslcommerzProvider } from "./providers";

// Single place to resolve a provider by id. Callers depend on the interface,
// not the concrete classes (dependency inversion).
const registry: Record<GatewayId, PaymentGatewayProvider> = {
  BKASH: new BkashProvider(),
  NAGAD: new NagadProvider(),
  ROCKET: new RocketProvider(),
  SSLCOMMERZ: new SslcommerzProvider(),
};

export function getPaymentGateway(id: GatewayId): PaymentGatewayProvider {
  return registry[id];
}

export function isGatewayId(v: string): v is GatewayId {
  return v === "BKASH" || v === "NAGAD" || v === "ROCKET" || v === "SSLCOMMERZ";
}

/** Report which gateways are configured + their required env vars (for settings UI). */
export function gatewayAvailability(): { id: GatewayId; configured: boolean; requiredEnv: string[] }[] {
  return (Object.keys(registry) as GatewayId[]).map((id) => ({
    id,
    configured: registry[id].isConfigured(),
    requiredEnv: registry[id].requiredEnv(),
  }));
}

export type {
  GatewayId, PaymentGatewayProvider,
  InitiatePaymentInput, InitiatePaymentResult,
  VerifyPaymentResult, RefundPaymentInput, RefundPaymentResult, WebhookVerifyResult,
} from "./types";
