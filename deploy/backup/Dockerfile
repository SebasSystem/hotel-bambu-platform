# Backup job image: pg_dump/pg_restore matching the server major (PostgreSQL 18) + AWS CLI for
# the optional off-site copy (Cloudflare R2 or any S3) and the media bucket mirror.
FROM postgres:18.6-alpine
RUN apk add --no-cache aws-cli tzdata
COPY --chmod=0755 backup.sh restore.sh scheduler.sh /usr/local/bin/
ENTRYPOINT []
CMD ["scheduler.sh"]
