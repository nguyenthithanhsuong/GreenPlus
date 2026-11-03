import * as Sentry from "@sentry/nextjs";

const dsn =
  process.env.SENTRY_DSN_SHIPPER || process.env.NEXT_PUBLIC_SENTRY_DSN_SHIPPER;
if (dsn) Sentry.init({ dsn, enabled: true, tracesSampleRate: 0.1 });
