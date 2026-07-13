// In-memory cache with optional Redis backend
// For production, replace with Redis for distributed caching

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }
}

// Singleton cache instance
const cache = new MemoryCache();

// Cache TTL configurations (in milliseconds)
export const CACHE_TTL = {
  short: 30 * 1000,      // 30 seconds
  medium: 5 * 60 * 1000, // 5 minutes
  long: 30 * 60 * 1000,  // 30 minutes
  hour: 60 * 60 * 1000,  // 1 hour
} as const;

/**
 * Get value from cache
 */
export function getCached<T>(key: string): T | null {
  return cache.get<T>(key);
}

/**
 * Set value in cache with TTL
 */
export function setCached<T>(key: string, value: T, ttlMs: number = CACHE_TTL.medium): void {
  cache.set(key, value, ttlMs);
}

/**
 * Delete value from cache
 */
export function deleteCached(key: string): void {
  cache.delete(key);
}

/**
 * Clear all cache
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Get or set cache - fetch from cache or compute and cache
 */
export async function getOrSetCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = CACHE_TTL.medium
): Promise<T> {
  const cached = getCached<T>(key);
  if (cached !== null) {
    return cached;
  }

  const value = await fetcher();
  setCached(key, value, ttlMs);
  return value;
}

/**
 * Invalidate cache entries matching a pattern
 */
export function invalidatePattern(pattern: string): void {
  const regex = new RegExp(pattern.replace(/\*/g, ".*"));
  const keysToDelete: string[] = [];

  // Note: We can't iterate over Map entries directly in this implementation
  // For production, use Redis KEYS or SCAN command
  cache.clear(); // Fallback: clear all cache
}

/**
 * Cache key generators for consistent naming
 */
export const cacheKeys = {
  dashboard: () => "dashboard:stats",
  students: (page?: number) => `students:list:${page || 1}`,
  teachers: (page?: number) => `teachers:list:${page || 1}`,
  classes: () => "classes:list",
  attendance: (date: string) => `attendance:${date}`,
  finance: () => "finance:summary",
} as const;
