import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN_ADMIN,
  tracesSampleRate: 1.0,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN_ADMIN),
  environment: process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_GITHUB_SHA,
});