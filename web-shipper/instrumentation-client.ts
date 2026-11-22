import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN_SHIPPER,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN_SHIPPER),
  sendDefaultPii: false,
  beforeSend(event) { delete event.request; delete event.user; delete event.breadcrumbs; return event; },
  tracesSampleRate: 0.1,
});
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
