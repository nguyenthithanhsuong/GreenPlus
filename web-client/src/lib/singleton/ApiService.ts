export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export class ApiService {
  private static instance: ApiService;
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();
  private cacheDuration = 5 * 60 * 1000; // 5 minutes

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private getCacheKey(url: string, options?: RequestInit): string {
    return `${url}:${JSON.stringify(options || {})}`;
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.cacheDuration;
  }

  private unwrapResponse<T>(payload: unknown): T {
    if (payload && typeof payload === "object" && "data" in payload) {
      return (payload as ApiResponse<T>).data as T;
    }

    return payload as T;
  }

  private getErrorMessage(payload: unknown, fallback: string): string {
    if (
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      typeof (payload as ApiResponse<unknown>).error === "string"
    ) {
      return (payload as ApiResponse<unknown>).error ?? fallback;
    }

    return fallback;
  }

  async get<T>(url: string, useCache = true): Promise<T> {
    const cacheKey = this.getCacheKey(url);
    const cached = this.cache.get(cacheKey);

    if (useCache && cached && this.isCacheValid(cached.timestamp)) {
      return cached.data as T;
    }

    const response = await fetch(url);
    const payload = (await response.json()) as unknown;

    if (!response.ok) {
      throw new Error(this.getErrorMessage(payload, `HTTP ${response.status}`));
    }

    const result = this.unwrapResponse<T>(payload);

    if (useCache) {
      this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
    }

    return result;
  }

  async post<T>(url: string, body: unknown): Promise<T> {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const payload = (await response.json()) as unknown;

    if (!response.ok) {
      throw new Error(this.getErrorMessage(payload, `HTTP ${response.status}`));
    }

    return this.unwrapResponse<T>(payload);
  }

  async put<T>(url: string, body: unknown): Promise<T> {
    const response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const payload = (await response.json()) as unknown;

    if (!response.ok) {
      throw new Error(this.getErrorMessage(payload, `HTTP ${response.status}`));
    }

    return this.unwrapResponse<T>(payload);
  }

  async delete<T>(url: string, body?: unknown): Promise<T> {
    const response = await fetch(url, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });

    const payload = (await response.json()) as unknown;

    if (!response.ok) {
      throw new Error(this.getErrorMessage(payload, `HTTP ${response.status}`));
    }

    return this.unwrapResponse<T>(payload);
  }

  clearCache(): void {
    this.cache.clear();
  }

  clearCacheKey(url: string): void {
    const keys = Array.from(this.cache.keys()).filter((key) =>
      key.startsWith(url),
    );
    keys.forEach((key) => this.cache.delete(key));
  }
}

export default ApiService.getInstance();
