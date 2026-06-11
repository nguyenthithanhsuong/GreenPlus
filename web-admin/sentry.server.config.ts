import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN_ADMIN || process.env.NEXT_PUBLIC_SENTRY_DSN_ADMIN,
  tracesSampleRate: 1.0,
  debug: true,
  enabled: true,
  serverName: "web-admin",
  integrations: [
    Sentry.captureConsoleIntegration({ levels: ["error"] }),
  ],
});
