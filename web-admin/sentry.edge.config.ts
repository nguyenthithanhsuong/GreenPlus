import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN_ADMIN,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
  sendDefaultPii: false,
  beforeSend(event) {
    // Do not forward request bodies, query strings, cookies, user data or breadcrumbs.
    delete event.request;
    delete event.user;
    delete event.breadcrumbs;
    return event;
  },
});
