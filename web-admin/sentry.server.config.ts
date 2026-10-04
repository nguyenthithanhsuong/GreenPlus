import * as Sentry from "@sentry/nextjs";

const dsn =
  process.env.SENTRY_DSN_ADMIN || process.env.NEXT_PUBLIC_SENTRY_DSN_ADMIN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 1.0,
    debug: process.env.SENTRY_DEBUG === "true",
    enabled: true,
    serverName: "web-admin",
    integrations: [Sentry.captureConsoleIntegration({ levels: ["error"] })],
  });
}
