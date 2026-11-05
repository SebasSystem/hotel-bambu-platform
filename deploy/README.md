# Production deployment (VPS + Cloudflare)

## Inicio rápido (español)

1. VPS Linux con Docker Engine + Compose. Clonar el repositorio en `/srv/hotel-bambu`.
2. Cloudflare: DNS con proxy (nube naranja) para `www` y el dominio raíz; SSL/TLS en **Full (strict)**; crear un **Origin Certificate** y guardarlo en `/etc/hotel-bambu/certs/origin.pem` y `origin.key` (`chmod 600`).
3. Firewall: `sudo sh deploy/scripts/ufw-cloudflare.sh` (solo SSH y 443 desde Cloudflare).
4. `cp deploy/env.production.example deploy/.env.production`, completar los `<...>` (secretos con `openssl rand -hex 32`), `chmod 600`.
5. `make build && make up`, luego `make seed` y `make admin` (crea el administrador; nunca datos demo).
6. Probar `https://www.<dominio>`, iniciar sesión en `/admin`, ejecutar `make backup`.
7. Antes de abrir al público: lista de verificación del final (Search Console, sitemap, `SITE_INDEXABLE`, `LEGAL_APPROVED`).

The rest of this guide is in English, like the other technical documents.

## Architecture

```text
Visitor ─HTTPS─> Cloudflare (DNS proxied, WAF, cache, Full strict)
                    │ HTTPS 443, Origin CA cert, only Cloudflare IPs allowed (ufw + DOCKER-USER)
                    ▼
VPS ── caddy:443 ──> web:3000 (Next.js standalone) ──/api/v1/*──> api:4000 (NestJS)
                                                                   │          │
                          backend network (internal, no internet)  ▼          ▼
                                                             postgres:5432   R2 / S3 (egress)
       migrate (one-shot, prisma migrate deploy) · backup (daily pg_dump, optional off-site)
Media: https://media.<domain> = Cloudflare R2 public bucket (custom domain), not the VPS.
```

- **Ingress (primary): Caddy** (`caddy` profile) terminates TLS with a Cloudflare Origin CA certificate on 443. No ACME, no port 80. Alternative: **Cloudflare Tunnel** (`tunnel` profile), see below. Use one or the other.
- `web` is the only public entry. It proxies `/api/v1/*` to the API (same origin, no CORS).
- PostgreSQL has no published port and lives on an internal network.
- Images: `hotel-bambu-api` (API, migrations and operational scripts), `hotel-bambu-web`, `hotel-bambu-backup`. All built from this repository on the VPS. API and web run as the non-root `node` user with a read-only root filesystem, `no-new-privileges` and no Linux capabilities.
- Decision record: [ADR 0014](../docs/adr/0014-production-deployment.md).

## 1. VPS prerequisites

- Ubuntu 24.04 LTS (or Debian 12). At least 2 vCPU, 4 GB RAM, 40 GB disk. Pick a region close to Colombia (for example Miami, Bogotá or São Paulo).
- Docker Engine and the Compose plugin from the [official repository](https://docs.docker.com/engine/install/ubuntu/), plus `make` and `git`.
- A non-root sudo user with SSH keys. Disable password login (`PasswordAuthentication no`) and enable unattended security upgrades (`unattended-upgrades`).

```bash
sudo mkdir -p /srv/hotel-bambu /etc/hotel-bambu/certs /var/backups/hotel-bambu
sudo chmod 700 /etc/hotel-bambu/certs /var/backups/hotel-bambu
sudo git clone <repository-url> /srv/hotel-bambu && cd /srv/hotel-bambu
```

## 2. Cloudflare

1. **DNS**: add the domain to Cloudflare and point the nameservers. Create `A` (and `AAAA`) records for `@` and `www` to the VPS IP, **Proxied** (orange cloud).
2. **SSL/TLS > Overview**: encryption mode **Full (strict)**. **Edge Certificates**: enable _Always Use HTTPS_, minimum TLS 1.2, _Automatic HTTPS Rewrites_. Enable HSTS here only after the site works over HTTPS (the app already sends `Strict-Transport-Security`).
3. **SSL/TLS > Origin Server > Create Certificate**: RSA, hostnames `<domain>` and `*.<domain>`, 15 years. Save the certificate as `/etc/hotel-bambu/certs/origin.pem` and the private key as `origin.key`, then run `sudo chmod 600 /etc/hotel-bambu/certs/*`.
4. Optional, recommended: **Authenticated Origin Pulls**. Download the Cloudflare origin-pull CA to `/etc/hotel-bambu/certs/origin-pull-ca.pem` and enable the `client_auth` block in `deploy/caddy/Caddyfile`.
5. **Caching > Cache Rules**:
   - Bypass cache: `starts_with(http.request.uri.path, "/admin")` or `starts_with(http.request.uri.path, "/api/")`.
   - Eligible for cache, respect origin headers: `starts_with(http.request.uri.path, "/_next/static/")` (immutable, hashed files).
   - Leave HTML at the default behavior (not cached). Pages carry per-request CSP nonces and must not be cached at the edge.
6. **Security**:
   - Managed WAF rules: on (free plan: _Cloudflare Free Managed Ruleset_). Bot Fight Mode: on.
   - Rate limiting rule: `/api/v1/auth/login`, 10 requests per minute per IP, then block for 10 minutes. The API enforces its own limits as well.
   - Optional: a WAF custom rule that challenges `/admin` from outside Colombia.
7. **Media (Cloudflare R2, recommended)**:
   - R2 > Create bucket `hotel-media`, in a location near the Americas.
   - Settings > _Custom Domains_ > `media.<domain>` (public read through Cloudflare's CDN).
   - _Manage API tokens_ > _Object Read & Write_, restricted to this bucket. This gives `S3_ACCESS_KEY` and `S3_SECRET_KEY`. The endpoint is `https://<account-id>.r2.cloudflarestorage.com`.
   - For off-site backups, create a second, **private** bucket (for example `hotel-backups`) with its own token. Add a lifecycle rule that deletes objects after 90 days.

Self-hosted alternative to R2: add the `storage` profile (RustFS on the VPS), set `S3_ENDPOINT=http://storage:9000`, uncomment the media block in the Caddyfile, and set `MEDIA_HOST` and `S3_PUBLIC_URL=https://media.<domain>/hotel-media`. In that case, back up the media too (`BACKUP_MEDIA=true`).

## 3. Firewall

```bash
sudo sh deploy/scripts/ufw-cloudflare.sh 22      # your SSH port
sudo apt-get install -y iptables-persistent && sudo netfilter-persistent save
```

The script allows only SSH (rate limited) and 443 from Cloudflare's published ranges. Docker-published ports bypass ufw, so the script also filters the `DOCKER-USER` chain. It **resets ufw**: add any other rules you need afterwards. Re-run it when Cloudflare updates its IP list, and update the `trusted_proxies` list in the Caddyfile at the same time. Verify from another machine: `curl -k https://<vps-ip>` must time out.

## 4. Configuration

```bash
cp deploy/env.production.example deploy/.env.production   # git-ignored
chmod 600 deploy/.env.production
openssl rand -hex 32    # once each for SESSION_SECRET, REVALIDATE_SECRET, POSTGRES_PASSWORD
```

Fill in every `<placeholder>`. Every variable is described in [docs/configuration.md](../docs/configuration.md). Notes that are specific to production:

- `SITE_URL=https://www.<domain>`, `SITE_HOST=www.<domain>`, `SITE_REDIRECT_HOST=<domain>`, and `WEB_ORIGINS` lists both origins.
- `TRUST_CLOUDFLARE=true` and `TRUST_PROXY=false`. This is safe only because the firewall (or the tunnel) makes Cloudflare the sole way in.
- `COOKIE_SECURE=true` (the default in production).
- Keep `SITE_INDEXABLE=false` and `LEGAL_APPROVED=false` until the go-live checklist is done.
- `API_INTERNAL_URL` is fixed (`http://api:4000`) and compiled into the web image.

Check the result with `make config`. It is silent when the configuration is valid.

## 5. First deploy

```bash
make build                  # ~5 min on 2 vCPU
make up                     # postgres → migrate (prisma migrate deploy) → api → web → caddy
make ps                     # migrate "Exited (0)", the rest "healthy"
make seed                   # idempotent base data (hotel profile, sections, templates)
make admin                  # interactive: email, name, password typed twice (hidden)
```

- **Never run the demo seed in production.** `db:seed:demo` refuses when `NODE_ENV=production` anyway.
- Optional, once only: import the original photos. Copy them to the VPS, then run `make media-import PHOTOS=/srv/hotel-photos`. This processes them (EXIF removed, AVIF/WebP variants) into the bucket and the gallery. Re-running skips photos that were already imported. Delete the originals from the VPS afterwards if they are not needed there.
- Reset a password: `docker compose -f docker-compose.prod.yml --env-file deploy/.env.production run --rm api node dist/scripts/admin-create.js --reset-password`.

Without `make`, use the same `docker compose -f docker-compose.prod.yml --env-file deploy/.env.production …` commands. From a workstation with pnpm, use `pnpm prod:config|build|up|down|ps|logs|backup`.

## 6. Updates and rollback

```bash
git rev-parse --short HEAD > .last-deploy   # remember the running version
make backup                                   # always back up before an update
make update                                   # git pull --ff-only, build, up (migrations run first)
```

Rollback:

- **Code only** (no new migration in the update): `git checkout $(cat .last-deploy) && make build && make up`.
- **The update included a migration**: Prisma does not roll migrations back automatically. Restore the backup taken before the update (section 7), then rebuild the previous version.

To keep the previous images available for a quick rollback, tag them before building: `docker tag hotel-bambu-web:latest hotel-bambu-web:prev` (same for `api`). You can also set `IMAGE_TAG=<git-sha>` in the env file.

## 7. Backups and restore (requirement 22)

The `backup` service runs every day at `BACKUP_HOUR` (time zone `TZ`). Each run:

- creates a `pg_dump` custom-format archive plus a checksum in `BACKUP_HOST_DIR/db`;
- checks that the archive is readable;
- deletes local files older than `BACKUP_RETENTION_DAYS`;
- copies the dump to `BACKUP_S3_URI` (off-site, recommended);
- optionally mirrors the media bucket (`BACKUP_MEDIA=true`).

Media in R2 is durable storage. For protection against accidental deletion, enable `BACKUP_MEDIA` or R2 object versioning.

```bash
make backup                                   # run a backup now
make logs S=backup                            # history (without -f: docker compose ... logs backup)
ls -lh /var/backups/hotel-bambu/db
```

**Restore** (destructive for the target database):

```bash
make restore FILE=/backups/db/hotel_bambu-<timestamp>.dump   # stops web+api, restores, restarts
```

**Restore drill** (do it every quarter, and record the date). It restores into a scratch database and compares row counts:

```bash
DC="docker compose -f docker-compose.prod.yml --env-file deploy/.env.production"
$DC exec backup restore.sh /backups/db/<file>.dump restore_drill
Q="SELECT string_agg(format('SELECT %L t, count(*) n FROM %I', tablename, tablename), ' UNION ALL ') FROM pg_tables WHERE schemaname='public'"
for db in hotel_bambu restore_drill; do
  $DC exec -T backup sh -c "psql -d $db -tAc \"\$(psql -d $db -tAc \"$Q\") ORDER BY 1\"" > /tmp/$db.txt
done
diff /tmp/hotel_bambu.txt /tmp/restore_drill.txt && echo "restore OK"
$DC exec backup dropdb restore_drill
```

To restore from the off-site copy, download the dump into `BACKUP_HOST_DIR/db` first (for example `aws s3 cp --endpoint-url … s3://hotel-backups/db/<file> /var/backups/hotel-bambu/db/`).

## 8. Logs and monitoring

- Logs: `make logs S=api` (JSON, with request ids). Rotation is 5 × 10 MB per container. Use `docker compose … logs --since 1h api` for a time window.
- Health: `/api/v1/health` (database) through the public site. Set up an external uptime monitor that checks `https://www.<domain>/` and `/api/v1/health` every 5 minutes, for example UptimeRobot or Better Stack with email alerts.
- Security events: failed logins and lockouts appear in the API logs. Admin actions are recorded in the audit log.
- Disk: `df -h` and `docker system df`. Prune old images monthly with `docker image prune -f`.
- If the logs show `429` responses for normal traffic, raise `RATE_LIMIT_DEFAULT_PER_MINUTE`. Server-side page renders from `web` share a single IP.

## 9. Alternative ingress: Cloudflare Tunnel

Use the tunnel when the VPS must not accept any inbound HTTP connections at all, for example behind NAT. The VPS then publishes no ports.

1. Zero Trust > Networks > Tunnels > _Create a tunnel_ (cloudflared). Copy the token into `TUNNEL_TOKEN`.
2. Public hostnames: `www.<domain>` → `http://web:3000`, and `<domain>` → `http://web:3000`. Add a redirect rule from the apex to `www`.
3. Set `COMPOSE_PROFILES=tunnel,backup` (remove `caddy`). Keep `SITE_HOST`/`SITE_REDIRECT_HOST` set (they are unused but validated).
4. Firewall: `ufw default deny incoming` and allow SSH only.

## 10. Go-live checklist (requirement 27)

- [ ] `make ps`: every service is healthy. `https://www.<domain>` serves over HTTPS, and the apex redirects to it.
- [ ] Security headers are present: `curl -sI https://www.<domain>/ | grep -iE 'content-security|strict-transport|x-frame'`.
- [ ] Admin login and logout work. The setup admin account is personal, and the password was changed after handover.
- [ ] Hotel data entered in the admin (WhatsApp number, rates, check-in/out, address, RNT). There are no `TODO(hotel)` values left ([pendientes-hotel.md](../docs/pendientes-hotel.md)).
- [ ] An image upload works, and the image displays from `media.<domain>`.
- [ ] Legal texts approved by the hotel and its lawyer ([legal-checklist.md](../docs/legal-checklist.md)). Then set `LEGAL_APPROVED=true` and `LEGAL_EFFECTIVE_DATE`.
- [ ] Set `SITE_INDEXABLE=true`, then `make up`. Check that `/robots.txt` allows crawling and that `/sitemap.xml` lists the pages.
- [ ] Google Search Console: verify the domain (DNS TXT record in Cloudflare) and submit `https://www.<domain>/sitemap.xml`. Validate the structured data with the Rich Results Test.
- [ ] A backup ran, the off-site copy exists, and the restore drill passed.
- [ ] The uptime monitor and alerts are configured. Cloudflare WAF and rate limiting rules are active.
- [ ] The firewall was verified from outside (the origin IP does not answer directly).
