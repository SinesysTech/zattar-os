# Docker Containerization Guide

This guide covers the containerization strategy for Sinesys App using Docker.

## Architecture

- **Development**: Docker Compose with local services (Postgres, Redis, Mailhog).
- **Production**: Docker Swarm with Traefik reverse proxy and HA services.

## Development

To start the local environment:

```bash
# Initialize and start services
./scripts/docker/init-dev.sh

# Stop services
./scripts/docker/dev.sh stop

# Restart a service
./scripts/docker/dev.sh restart sinesys_app
```

### Services
- **App**: http://localhost:3000
- **Supabase Studio**: http://localhost:54323
- **Mailhog**: http://localhost:8025

## Production

Deploy to a Docker Swarm cluster:

```bash
./scripts/docker/deploy-swarm.sh
```

### Monitoring
- **Prometheus**: Metrics collection
- **Grafana**: Visual dashboards
- **Loki/Promtail**: Log aggregation

## Troubleshooting

See `docs/deploy/troubleshooting.md` for common issues.
