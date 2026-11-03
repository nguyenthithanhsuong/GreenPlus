#!/usr/bin/env bash
set -euo pipefail
# Each Docker image is tested with fake credentials; never hit a real account.
cleanup() {
  for app in admin client shipper; do docker rm -f "greenplus-${app}-ci" >/dev/null 2>&1 || true; done
}
trap cleanup EXIT
for app in admin client shipper; do
  case "$app" in admin) inner=3001; outer=13001;; client) inner=3000; outer=13000;; shipper) inner=3002; outer=13002;; esac
  if docker image inspect --format '{{json .Config.Env}}' "greenplus/web-${app}:ci" \
      | grep -Eq 'SUPABASE_SERVICE_ROLE_KEY=|SENTRY_AUTH_TOKEN=|BETTER_STACK_SOURCE_TOKEN='; then
    echo "ERROR: ${app} image embeds a server-only credential variable; refusing to publish" >&2
    exit 1
  fi
  docker run -d --name "greenplus-${app}-ci" -p "127.0.0.1:${outer}:${inner}" \
    -e NEXT_PUBLIC_SUPABASE_URL=https://ci-placeholder.supabase.co \
    -e NEXT_PUBLIC_SUPABASE_ANON_KEY=ci-placeholder-anon-key \
    -e SUPABASE_SERVICE_ROLE_KEY=ci-placeholder-only \
    -e SHIPPER_SESSION_SECRET=ci-only-session-secret-longer-than-32-bytes \
    "greenplus/web-${app}:ci" >/dev/null
  ready=0
  for attempt in $(seq 1 60); do
    status="$(curl -sS --max-time 5 -o /dev/null -w '%{http_code}' "http://127.0.0.1:${outer}/" 2>/dev/null || true)"
    if [[ "$status" =~ ^(200|301|302|303|307|308)$ ]]; then ready=1; break; fi
    sleep 2
  done
  if [[ $ready -ne 1 ]]; then
    echo "ERROR: ${app} failed HTTP smoke. Last HTTP: ${status}" >&2
    docker logs --tail=100 "greenplus-${app}-ci" >&2 || true
    exit 1
  fi
  echo "PASS web-${app} HTTP root status ${status}"
  if [[ "$app" == shipper ]]; then
    health="$(curl -sS --max-time 10 -o /dev/null -w '%{http_code}' "http://127.0.0.1:${outer}/api/health")"
    auth="$(curl -sS --max-time 10 -o /dev/null -w '%{http_code}' "http://127.0.0.1:${outer}/api/auth/me")"
    deliveries="$(curl -sS --max-time 10 -o /dev/null -w '%{http_code}' "http://127.0.0.1:${outer}/api/shipper/deliveries")"
    [[ "$health" == 200 && "$auth" == 401 && "$deliveries" == 401 ]] || { echo "ERROR: Shipper API boundary health=$health auth=$auth deliveries=$deliveries"; exit 1; }
    echo 'PASS Shipper health and unauthenticated API guards'
  fi
  docker rm -f "greenplus-${app}-ci" >/dev/null
done
