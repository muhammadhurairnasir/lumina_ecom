class MemCache {
  private cache = new Map<string, { value: any; expiry: number | null }>();

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    if (item.expiry && Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.value as T;
  }

  set(key: string, value: any, seconds: number): void {
    this.cache.set(key, {
      value,
      expiry: Date.now() + seconds * 1000
    });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }
}

export const memCache = new MemCache();
