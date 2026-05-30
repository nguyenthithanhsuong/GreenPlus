/**
 * Better Stack Logger Utility
 * Sends logs to Better Stack via HTTP source
 */

interface BetterStackLogPayload {
  message: string;
  level: 'debug' | 'info' | 'warning' | 'error' | 'critical';
  source?: string;
  context?: Record<string, any>;
  userId?: string;
  traceId?: string;
}

class BetterStackLogger {
  private sourceToken: string | null = null;
  private sourceUrl: string;

  constructor() {
    this.sourceToken = process.env.BETTER_STACK_SOURCE_TOKEN || null;
    this.sourceUrl = 'https://in.betterstack.com/api/v1/logs';
  }

  /**
   * Check if Better Stack is configured
   */
  isEnabled(): boolean {
    return !!this.sourceToken;
  }

  /**
   * Send log to Better Stack
   */
  private async send(payload: BetterStackLogPayload): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    try {
      const response = await fetch(this.sourceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.sourceToken}`,
        },
        body: JSON.stringify({
          dt: new Date().toISOString(),
          level: payload.level.toUpperCase(),
          message: payload.message,
          source: payload.source || 'app',
          context: payload.context || {},
          user_id: payload.userId,
          trace_id: payload.traceId,
        }),
      });

      if (!response.ok) {
        console.error(`[BetterStack] Failed to send log: ${response.status}`);
      }
    } catch (error) {
      // Silently fail to prevent logging from crashing the app
      console.error('[BetterStack] Error sending log:', error);
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    this.send({ message, level: 'debug', context });
  }

  info(message: string, context?: Record<string, any>): void {
    this.send({ message, level: 'info', context });
  }

  warning(message: string, context?: Record<string, any>): void {
    this.send({ message, level: 'warning', context });
  }

  error(message: string, context?: Record<string, any>, userId?: string): void {
    this.send({ message, level: 'error', context, userId });
  }

  critical(message: string, context?: Record<string, any>): void {
    this.send({ message, level: 'critical', context });
  }
}

// Export singleton instance
export const logger = new BetterStackLogger();
