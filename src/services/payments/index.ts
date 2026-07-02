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

/** Report which gateways are configured — useful for the UI to show availability. */
export function gatewayAvailability(): { id: GatewayId; configured: boolean }[] {
  return (Object.keys(registry) as GatewayId[]).map((id) => ({
    id,
    configured: registry[id].isConfigured(),
  }));
}

export type { GatewayId, PaymentGatewayProvider } from "./types";
