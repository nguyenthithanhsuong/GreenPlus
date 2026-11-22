import * as Sentry from "@sentry/nextjs";

const dsn =
  process.env.SENTRY_DSN_SHIPPER || process.env.NEXT_PUBLIC_SENTRY_DSN_SHIPPER;
if (dsn) {
  Sentry.init({
    dsn,
    enabled: true,
    sendDefaultPii: false,
    beforeSend(event) { delete event.request; delete event.user; delete event.breadcrumbs; return event; },
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV,
    serverName: "web-shipper",
  });
}
