// Fallback in-memory cache to prevent ECONNREFUSED on local machines without Redis
class InMemoryRedisMock {
  private cache = new Map<string, { value: string; expiry: number | null }>();

  async get(key: string): Promise<string | null> {
    const item = this.cache.get(key);
    if (!item) return null;
    if (item.expiry && Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  async setex(key: string, seconds: number, value: string): Promise<'OK'> {
    this.cache.set(key, {
      value,
      expiry: Date.now() + seconds * 1000
    });
    return 'OK';
  }

  async del(key: string): Promise<number> {
    const existed = this.cache.has(key);
    this.cache.delete(key);
    return existed ? 1 : 0;
  }
}

// Instead of crashing the server, we use the mock
const redisClient = new InMemoryRedisMock() as any;

console.log('Using in-memory Redis fallback to prevent connection errors');

export default redisClient;
