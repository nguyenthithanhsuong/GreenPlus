import * as Sentry from "@sentry/nextjs";

const dsn =
  process.env.SENTRY_DSN_CLIENT || process.env.NEXT_PUBLIC_SENTRY_DSN_CLIENT;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
    sendDefaultPii: false,
    beforeSend(event) {
      delete event.request;
      delete event.user;
      delete event.breadcrumbs;
      return event;
    },
    debug: process.env.SENTRY_DEBUG === "true",
    enabled: true,
    serverName: "web-client",
  });
}
