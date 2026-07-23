# Deploying ruakh to AWS Lightsail

ruakh ships as a single Docker image (SvelteKit / adapter-node) behind nginx,
with PostgreSQL and Let's Encrypt certbot running alongside it via Docker
Compose. The image is built locally and shipped as a tar over SSH; environment
files are generated and synced by GitHub Actions.

```
local:  build.sh ──► ruakh-image.tar ──rsync──► Lightsail ──► docker load ──► compose up
CI:     push to feature/lightsail ──► make_env_files.yml ──► .env.app / .env.db on the server
```

## One-time server setup

1. Create a Lightsail instance (Amazon Linux 2/2023) with a **static IP** and
   an attached block-storage disk mounted at `/mnt/ebs` (Postgres data lives at
   `/mnt/ebs/ruakh/pgdata`).
2. Point DNS `A` record for `ruakh.jpd.nz` at the static IP.
3. Fill in `deploy/connection_variables.sh` (`EC2_HOST`, `EC2_KEY_PATH`,
   `EC2_APP_DIR`).
4. Install Docker + Compose on the instance: `./deploy/install-docker.sh`.

## Deploy (from your machine)

```bash
./deploy/ssh_test.sh          # verify SSH connectivity
./deploy/build_and_deploy.sh  # build image → rsync → (optionally) restart on the server
```

`build_and_deploy.sh` runs `build.sh` (builds `ruakh:latest`, saves
`ruakh-image.tar`), then `rsync.sh` (ships the tar + `docker/compose.yml` +
`docker/nginx/`), then optionally `start.sh` (loads the image and restarts the
stack). Migrations run automatically on container start (`docker/migrate.mjs`).

## Environment files (GitHub Actions)

Pushing to `feature/lightsail` runs `.github/workflows/make_env_files.yml`,
which generates `.env.app` + `.env.db` and rsyncs them to `REMOTE_APP_DIR`.
Configure these under the `lightsail-production` environment:

**Variables**

| Name             | Example                  |
| ---------------- | ------------------------ |
| `APP_HOST`       | `ruakh.jpd.nz`           |
| `VAPID_SUBJECT`  | `mailto:you@example.com` |
| `REMOTE_USER`    | `ec2-user`               |
| `REMOTE_HOST`    | `<static IP>`            |
| `REMOTE_APP_DIR` | `/home/ec2-user/ruakh`   |

**Secrets**

| Name                | Notes                                        |
| ------------------- | -------------------------------------------- |
| `POSTGRES_USER`     | DB user (used in `DATABASE_URL` + DB init)   |
| `POSTGRES_PASSWORD` | DB password                                  |
| `POSTGRES_DB`       | DB name                                      |
| `PUBLIC_VAPID_KEY`  | Web Push public key (leave blank to disable) |
| `PRIVATE_VAPID_KEY` | Web Push private key                         |
| `ADMIN_ACCESS_TOKEN` | Admin pre-auth gate token (blank to disable); unlock with `/admin?token=<value>` |
| `SSH_PRIVATE_KEY`   | Deploy key matching the instance             |

## First-run TLS bootstrap

The `443` block in `docker/nginx/default.conf` references cert files that don't
exist yet, so on the very first deploy:

1. Comment out the `server { listen 443 ssl; ... }` block, `docker compose up -d`
   (nginx serves port 80 + the ACME challenge path).
2. Issue the certificate:
   ```bash
   docker compose run --rm certbot certonly --webroot -w /var/www/certbot -d ruakh.jpd.nz
   ```
3. Uncomment the `443` block and `docker compose restart nginx`.
4. Auto-renewal: see `deploy/spawn_timer.sh` for the systemd timer.

## Seeding

Migrations run automatically, but content is **not** seeded on startup. Seed
once (from a machine with the repo + DB access):

```bash
DATABASE_URL=<prod-url> npm run db:seed
```
