// GPS / vehicle-tracking abstraction.
//
// Static route/vehicle/driver management works with no external service. Live
// location is optional: if a tracking provider is configured via environment
// variables, getVehicleLocation() can fetch a live fix; otherwise it falls back
// to the last-known location persisted on the Vehicle row.
//
// This follows the same SOLID/DIP pattern as the payment gateways: callers
// depend on the VehicleTracker interface, resolved via getVehicleTracker().
// No credentials are hardcoded.

export type VehicleLocation = { lat: number; lng: number; at: string; source: "live" | "last-known" };

export interface VehicleTracker {
  readonly id: string;
  isConfigured(): boolean;
  /** Live fix for a vehicle by its tracker device id. */
  getLocation(deviceId: string): Promise<VehicleLocation | null>;
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

/**
 * Generic REST tracker. Configure with:
 *   GPS_PROVIDER_BASE_URL  — provider API base
 *   GPS_PROVIDER_API_KEY   — API key/token
 * The exact request/response shape is provider-specific; wire it in fetchLive().
 */
export class RestVehicleTracker implements VehicleTracker {
  readonly id = "REST";
  private required = ["GPS_PROVIDER_BASE_URL", "GPS_PROVIDER_API_KEY"];
  isConfigured() {
    return readEnv(this.required).missing.length === 0;
  }
  async getLocation(_deviceId: string): Promise<VehicleLocation | null> {
    if (!this.isConfigured()) return null;
    // TODO: call the configured provider using GPS_PROVIDER_BASE_URL/API_KEY and
    // map its response to VehicleLocation. Returning null until wired.
    return null;
  }
}

let cached: VehicleTracker | null = null;
export function getVehicleTracker(): VehicleTracker {
  if (!cached) cached = new RestVehicleTracker();
  return cached;
}

export function trackingConfigured(): boolean {
  return getVehicleTracker().isConfigured();
}
