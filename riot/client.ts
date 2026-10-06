/**
 * Minimal Riot API HTTP client.
 *
 * Runtime-neutral on purpose: it only uses fetch, Headers, URL and AbortController,
 * so the same code can run in Node tooling today and in a server runtime later.
 * The API key is sent in the X-Riot-Token header and is never part of a URL or log.
 *
 * Source: https://developer.riotgames.com/docs/portal (API keys, rate limits, response codes).
 */
import { hostFor, type Route } from "./routing.ts";

export interface RiotClientOptions {
  apiKey: string;
  /** Override fetch, e.g. for tests. Defaults to the global fetch. */
  fetch?: typeof fetch;
  /** Abort a request after this many milliseconds. Default 10000. */
  timeoutMs?: number;
  /** Automatic retries on 429 and transient 5xx responses. Default 2. */
  maxRetries?: number;
  /** Sent as User-Agent so Riot can identify the product. */
  userAgent?: string;
}

/** Rate-limit headers Riot returns on every response. */
export interface RateLimitSnapshot {
  appLimit: string | null;
  appCount: string | null;
  methodLimit: string | null;
  methodCount: string | null;
  /** Only present on 429: "application", "method" or "service". */
  limitType: string | null;
  /** Only present on 429 (and some 5xx), in seconds. */
  retryAfterSeconds: number | null;
}

export interface RiotResponse<T> {
  data: T;
  status: number;
  latencyMs: number;
  rateLimit: RateLimitSnapshot;
  /** Request URL. Never contains the API key. */
  url: string;
}

export class RiotApiError extends Error {
  readonly status: number;
  readonly url: string;
  /** Riot's own message from the error body, when present. */
  readonly riotMessage: string | null;
  readonly rateLimit: RateLimitSnapshot;
  readonly latencyMs: number;

  constructor(args: {
    status: number;
    url: string;
    riotMessage: string | null;
    rateLimit: RateLimitSnapshot;
    latencyMs: number;
  }) {
    super(
      `Riot API ${args.status} for ${args.url}${args.riotMessage ? `: ${args.riotMessage}` : ""}`,
    );
    this.name = "RiotApiError";
    this.status = args.status;
    this.url = args.url;
    this.riotMessage = args.riotMessage;
    this.rateLimit = args.rateLimit;
    this.latencyMs = args.latencyMs;
  }
}

type QueryValue = string | number | boolean | undefined;

const RETRYABLE_STATUSES = new Set([429, 502, 503, 504]);

export class RiotClient {
  private readonly apiKey: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly userAgent: string;

  constructor(options: RiotClientOptions) {
    if (!options.apiKey) throw new Error("RiotClient requires an apiKey");
    this.apiKey = options.apiKey;
    this.fetchImpl = options.fetch ?? fetch;
    this.timeoutMs = options.timeoutMs ?? 10_000;
    this.maxRetries = options.maxRetries ?? 2;
    this.userAgent = options.userAgent ?? "Valtrices/0.1.0 (local development)";
  }

  /** Performs a GET against `https://{route}.api.riotgames.com{path}`. */
  async get<T>(
    route: Route,
    path: string,
    query?: Record<string, QueryValue>,
  ): Promise<RiotResponse<T>> {
    const url = new URL(path, hostFor(route));
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }

    let attempt = 0;
    for (;;) {
      const result = await this.once<T>(url.toString());
      if (result.ok) return result.response;

      const { error } = result;
      if (attempt >= this.maxRetries || !RETRYABLE_STATUSES.has(error.status)) throw error;
      attempt += 1;
      const waitMs = (error.rateLimit.retryAfterSeconds ?? 2 ** attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }

  private async once<T>(
    url: string,
  ): Promise<{ ok: true; response: RiotResponse<T> } | { ok: false; error: RiotApiError }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    const started = performance.now();
    try {
      const res = await this.fetchImpl(url, {
        method: "GET",
        headers: {
          "X-Riot-Token": this.apiKey,
          Accept: "application/json",
          "User-Agent": this.userAgent,
        },
        signal: controller.signal,
      });
      const latencyMs = Math.round(performance.now() - started);
      const rateLimit = readRateLimit(res.headers);

      if (!res.ok) {
        const riotMessage = await readRiotMessage(res);
        return {
          ok: false,
          error: new RiotApiError({ status: res.status, url, riotMessage, rateLimit, latencyMs }),
        };
      }

      const data = (await res.json()) as T;
      return { ok: true, response: { data, status: res.status, latencyMs, rateLimit, url } };
    } finally {
      clearTimeout(timer);
    }
  }
}

function readRateLimit(headers: Headers): RateLimitSnapshot {
  const retryAfter = headers.get("Retry-After");
  return {
    appLimit: headers.get("X-App-Rate-Limit"),
    appCount: headers.get("X-App-Rate-Limit-Count"),
    methodLimit: headers.get("X-Method-Rate-Limit"),
    methodCount: headers.get("X-Method-Rate-Limit-Count"),
    limitType: headers.get("X-Rate-Limit-Type"),
    retryAfterSeconds: retryAfter !== null && retryAfter !== "" ? Number(retryAfter) : null,
  };
}

/** Riot error bodies look like { status: { message, status_code } }. */
async function readRiotMessage(res: Response): Promise<string | null> {
  try {
    const body = (await res.json()) as { status?: { message?: string } };
    return body.status?.message ?? null;
  } catch {
    return null;
  }
}
