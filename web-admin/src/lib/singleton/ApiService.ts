export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export class ApiService {
  private static instance: ApiService;
  private readonly cache = new Map<string, { data: unknown; timestamp: number }>();
  private readonly cacheDuration = 5 * 60 * 1000;

  private constructor() {}

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }

    return ApiService.instance;
  }

  async get<T>(url: string, useCache = false): Promise<T> {
    const cacheKey = this.getCacheKey(url);
    const cached = this.cache.get(cacheKey);

    if (useCache && cached && this.isCacheValid(cached.timestamp)) {
      return cached.data as T;
    }

    const result = await this.request<T>(url, { cache: "no-store" });

    if (useCache) {
      this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
    }

    return result;
  }

  post<T>(url: string, body: unknown): Promise<T> {
    return this.request<T>(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  put<T>(url: string, body: unknown): Promise<T> {
    return this.request<T>(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  patch<T>(url: string, body: unknown): Promise<T> {
    return this.request<T>(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  delete<T>(url: string): Promise<T> {
    return this.request<T>(url, { method: "DELETE" });
  }

  upload<T>(url: string, body: FormData): Promise<T> {
    return this.request<T>(url, { method: "POST", body });
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

  private async request<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, options);
    const payload = (await response.json().catch(() => ({}))) as unknown;

    if (!response.ok) {
      throw new Error(this.getErrorMessage(payload, `HTTP ${response.status}`));
    }

    return this.unwrapResponse<T>(payload);
  }

  private getCacheKey(url: string): string {
    return url;
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
}

export default ApiService.getInstance();
