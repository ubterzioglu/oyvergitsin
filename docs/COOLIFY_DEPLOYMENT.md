# Coolify Deployment Guide

This guide explains how to deploy the Oyvergitsin application to Coolify.

## Prerequisites

- A Coolify instance running
- Access to a Supabase project (or use Coolify's managed PostgreSQL)
- Git repository with your code

## Environment Variables

Set these environment variables in Coolify's dashboard:

```bash
# Required
NEXT_PUBLIC_SITE_URL=https://oyvergitsin.org
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
SESSION_HASH_SECRET=your_32_plus_byte_secret
ALLOW_REMOTE_TEST_WRITES=false
CRON_SECRET=your_cron_secret

# Optional (if using Coolify's PostgreSQL instead of Supabase)
# DATABASE_URL=postgresql://user:password@host:5432/database
```

## Deployment Methods

### Method 1: Docker Compose (Recommended)

1. In Coolify dashboard, create a new resource
2. Select "Docker Compose" as the source
3. Connect your Git repository
4. Coolify will automatically detect the `docker-compose.yml`
5. Set your environment variables
6. Deploy

### Method 2: Dockerfile

1. In Coolify dashboard, create a new resource
2. Select "Docker" as the source
3. Connect your Git repository
4. Set the Dockerfile location: `./Dockerfile`
5. Set your environment variables
6. Deploy

## Configuration

### Port Configuration

The application runs on port **3000** by default. This is configured in:
- `Dockerfile` - EXPOSE 3000
- `docker-compose.yml` - ports mapping

### Health Check

A health check endpoint is available at `/api/health`. Coolify uses this to monitor the application status.

### Resource Limits

Recommended resource allocation:
- **CPU**: 0.5 - 1 core
- **Memory**: 512MB - 1GB
- **Storage**: 1GB

Adjust based on your traffic and usage.

## Database Setup

### Option A: Use External Supabase (Recommended)

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run migrations: `supabase db push`
3. Seed data: `npm run db:seed`
4. Set environment variables in Coolify

### Option B: Use Coolify's PostgreSQL

This is not a drop-in replacement for the current Supabase contract. The app uses Supabase Auth, anon/service-role API keys, and RLS policies. Treat a move to Coolify PostgreSQL as a separate migration project.

## Continuous Deployment

### Automatic Deployments

1. In Coolify, enable "Auto Deploy" for your resource
2. Every push to your configured branch will trigger a deployment

### Webhook Deployment

1. Get the webhook URL from Coolify dashboard
2. Add it to your Git provider's webhook settings
3. Selective deployments can be configured

## Troubleshooting

### Build Fails

1. Check the build logs in Coolify dashboard
2. Ensure all dependencies are in `package.json`
3. Verify Node.js version compatibility (uses Node 20)

### Application Won't Start

1. Check environment variables are set correctly
2. Verify database connectivity
3. Check health check endpoint: `curl http://your-app:3000/api/health`

### Memory Issues

1. Increase memory allocation in Coolify
2. Check for memory leaks in application code
3. Monitor with Coolify's metrics dashboard

## Useful Commands

### Local Testing

```bash
# Build Docker image locally
docker build -t oyvergitsin .

# Run container locally
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SITE_URL=https://oyvergitsin.org \
  -e NEXT_PUBLIC_SUPABASE_URL=your_url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key \
  -e SUPABASE_SERVICE_KEY=your_service_key \
  -e SESSION_HASH_SECRET=your_32_plus_byte_secret \
  oyvergitsin

# Test health check
curl http://localhost:3000/api/health
```

### Debugging in Coolify

```bash
# Access container shell
docker exec -it oyvergitsin sh

# Check logs
docker logs oyvergitsin

# Check container status
docker ps
```

## Security Recommendations

1. **Never** commit `.env` files to Git
2. Use Coolify's secret management for sensitive data
3. Enable HTTPS (Coolify handles this automatically)
4. Regularly update dependencies
5. Use non-root user in Docker (already configured)
6. Keep `SESSION_HASH_SECRET` distinct from `SUPABASE_SERVICE_KEY`
7. Do not run E2E or smoke tests against production; they create sessions and answers

## Scaling

### Horizontal Scaling

1. In Coolify, increase the replica count
2. Ensure your database can handle connections
3. Replace the current in-memory rate limiter with a shared store before running multiple replicas

The current rate limiter is process-local. Horizontal scaling without a shared limiter will under-limit abusive clients.

### Vertical Scaling

1. Increase CPU/Memory allocation
2. Monitor performance metrics
3. Adjust based on actual usage

## Backup Strategy

1. **Database**: Use Supabase's built-in backups or Coolify's PostgreSQL backups
2. **Code**: Git repository serves as backup
3. **Environment Variables**: Keep a secure copy of all environment variables

## Support

- Coolify Documentation: [coolify.io/docs](https://coolify.io/docs)
- Next.js Documentation: [nextjs.org/docs](https://nextjs.org/docs)
- Supabase Documentation: [supabase.com/docs](https://supabase.com/docs)
