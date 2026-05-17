const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export class PokemonTcgApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly details: unknown,
    public readonly rateLimit: {
      limit: string | null;
      remaining: string | null;
      reset: string | null;
    },
  ) {
    super(message);
  }
}

type RequestOptions = {
  timeoutMs?: number;
  retries?: number;
};

export class PokemonTcgHttpClient {
  constructor(private readonly apiKey: string) {}

  async getJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const retries = options.retries ?? 2;
    const timeoutMs = options.timeoutMs ?? 5000;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const requestInit: RequestInit = { signal: controller.signal };
        if (this.apiKey) {
          requestInit.headers = { 'X-Api-Key': this.apiKey };
        }

        const response = await fetch(`https://api.pokemontcg.io/v2${path}`, requestInit);

        if (!response.ok) {
          const details = await response.json().catch(() => null);
          throw new PokemonTcgApiError(`Pokemon TCG API error ${response.status}`, response.status, details, {
            limit: response.headers.get('x-ratelimit-limit'),
            remaining: response.headers.get('x-ratelimit-remaining'),
            reset: response.headers.get('x-ratelimit-reset'),
          });
        }

        return (await response.json()) as T;
      } catch (error) {
        if (attempt === retries) {
          throw error;
        }
        await delay(250 * (attempt + 1));
      } finally {
        clearTimeout(timer);
      }
    }

    throw new Error('Unreachable');
  }
}
