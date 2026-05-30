# Better Stack Integration Guide

GreenPlus has been integrated with Better Stack for comprehensive observability, including logging, uptime monitoring, and alerting.

## Setup Steps

### 1. Create Better Stack Account
1. Go to https://betterstack.com/
2. Sign up for a free account
3. Create a new project

### 2. Set Up HTTP Log Source
1. In Better Stack Dashboard → Settings → Log Sources
2. Click "Create Source"
3. Select "HTTP"
4. Name it "GreenPlus API"
5. Copy the **Source Token** (will look like `eyJ...`)
6. Add to your `.env.local` or CI/CD secrets:
   ```
   BETTER_STACK_SOURCE_TOKEN=eyJ...
   ```

### 3. Configure Uptime Monitoring
1. In Better Stack Dashboard → Uptime Monitors
2. Click "Create Monitor"
3. Set up 3 monitors:
   ```
   Name: GreenPlus Gateway Health
   URL: https://your-domain.com/health
   Check Interval: 60 seconds
   
   Name: Web Admin Service
   URL: https://your-domain.com/admin/api/health
   Check Interval: 60 seconds
   
   Name: Web Client Service
   URL: https://your-domain.com/api/health
   Check Interval: 60 seconds
   ```

### 4. Create Alert Policy
1. In Better Stack Dashboard → Alert Policies
2. Click "Create Policy"
3. Add conditions:
   - **5xx Error Spike**: Trigger when 5xx response count > 10 in 5 min
   - **Downtime Alert**: Trigger when any monitor fails for > 2 minutes
   - **High Response Time**: Trigger when response time > 5000ms
4. Set notification channels (Slack, Email, PagerDuty, etc.)

### 5. Verify Integration

#### Health Endpoints
All services expose `/api/health` endpoints:
- Gateway: `http://localhost:8080/health` (Nginx level)
- Web Client: `http://localhost:8080/api/health`
- Web Admin: `http://localhost:8080/admin/api/health`

**Response Format:**
```json
{
  "status": "ok",
  "service": "web-admin",
  "timestamp": "2026-03-30T12:00:00Z",
  "uptime": 3600.5,
  "environment": "production",
  "version": "1.0.0"
}
```

#### Log Streaming
Logs are automatically sent to Better Stack via:
- **API Request Logging**: All `/api/*` requests logged by middleware
- **Application Logger**: Use `logger` from `@greenplus/supabase-shared` in your code:

```typescript
import { logger } from '@greenplus/supabase-shared';

// Log different severity levels
logger.debug('Debug message', { userId: '123' });
logger.info('User action', { action: 'login', userId: '123' });
logger.warning('Deprecated API used', { endpoint: '/old-api' });
logger.error('Failed to fetch data', { error: 'timeout' }, userId);
logger.critical('Service unavailable', { service: 'database' });
```

## Environment Variables

```bash
# Required for Better Stack
BETTER_STACK_SOURCE_TOKEN=<your-source-token>

# Automatically sent with logs
NODE_ENV=production
```

## Monitoring Dashboard

Once configured, Better Stack provides:
1. **Logs** - Searchable, filterable log stream
2. **Uptime Graph** - 24/7 availability tracking
3. **Alerts** - Instant notifications on anomalies
4. **Dashboards** - Custom metrics and visualizations

## Troubleshooting

### Logs not appearing?
- Check BETTER_STACK_SOURCE_TOKEN is set correctly
- Verify network connectivity in production environment
- Check Better Stack dashboard for source status

### Uptime monitor failing?
- Verify the health endpoints return 200 status
- Check firewall/security group allows inbound from Better Stack IPs
- Increase check interval if hitting rate limits

### Missing logs?
- Logger requires `BETTER_STACK_SOURCE_TOKEN` to be set
- Application must reach `https://in.betterstack.com/api/v1/logs`
- Check for any network proxies blocking external HTTPS requests

## Cost Optimization

Better Stack free tier includes:
- Up to 10 uptime monitors
- 5GB logs/month
- Up to 3 team members

For scale, consider:
- Sampling logs (don't log every request)
- Aggregating similar errors
- Setting retention policies
