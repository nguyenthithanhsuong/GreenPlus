import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN_CLIENT || process.env.NEXT_PUBLIC_SENTRY_DSN_CLIENT,
  tracesSampleRate: 1.0,
  debug: true,
  enabled: true,
  serverName: "web-client",
  integrations: [
    Sentry.captureConsoleIntegration({ levels: ["error"] }),
  ],
});
