#!/bin/sh
# One backup run (requirement 22): PostgreSQL custom-format dump + local retention, then the
# optional off-site copy and media bucket mirror. Safe to run by hand:
#   docker compose -f docker-compose.prod.yml --env-file deploy/.env.production run --rm backup backup.sh
set -eu

: "${PGHOST:=postgres}"
: "${PGUSER:?PGUSER is required}"
: "${PGPASSWORD:?PGPASSWORD is required}"
: "${PGDATABASE:?PGDATABASE is required}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
export PGHOST PGUSER PGPASSWORD PGDATABASE

mkdir -p "$BACKUP_DIR/db"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
file="$BACKUP_DIR/db/${PGDATABASE}-${stamp}.dump"

echo "[backup] dumping ${PGDATABASE} -> ${file}"
# Custom format: compressed, restorable selectively with pg_restore. Written to a temp name first
# so a failed dump never looks like a valid backup.
pg_dump --format=custom --no-owner --no-privileges --file="${file}.partial"
pg_restore --list "${file}.partial" > /dev/null   # sanity check: the archive is readable
mv "${file}.partial" "$file"
sha256sum "$file" > "${file}.sha256"
echo "[backup] ok ($(du -h "$file" | cut -f1))"

# Local retention.
find "$BACKUP_DIR/db" -type f \( -name '*.dump' -o -name '*.sha256' \) -mtime "+${RETENTION_DAYS}" -print -delete \
  | sed 's/^/[backup] pruned /'

# Optional off-site copy (recommended): BACKUP_S3_URI=s3://bucket/prefix with its own keys.
if [ -n "${BACKUP_S3_URI:-}" ]; then
  echo "[backup] uploading to ${BACKUP_S3_URI}"
  AWS_ACCESS_KEY_ID="${BACKUP_S3_ACCESS_KEY:?BACKUP_S3_ACCESS_KEY is required}" \
  AWS_SECRET_ACCESS_KEY="${BACKUP_S3_SECRET_KEY:?BACKUP_S3_SECRET_KEY is required}" \
  AWS_DEFAULT_REGION="${BACKUP_S3_REGION:-auto}" \
    aws ${BACKUP_S3_ENDPOINT:+--endpoint-url "$BACKUP_S3_ENDPOINT"} s3 cp --only-show-errors \
      "$file" "${BACKUP_S3_URI%/}/db/$(basename "$file")"
  # Off-site retention is a bucket lifecycle rule (see deploy/README.md), not deleted from here.
fi

# Optional media mirror: incremental copy of the media bucket into the backup volume.
if [ "${BACKUP_MEDIA:-false}" = "true" ]; then
  echo "[backup] mirroring media bucket ${S3_BUCKET:?S3_BUCKET is required}"
  AWS_ACCESS_KEY_ID="${S3_ACCESS_KEY:?S3_ACCESS_KEY is required}" \
  AWS_SECRET_ACCESS_KEY="${S3_SECRET_KEY:?S3_SECRET_KEY is required}" \
  AWS_DEFAULT_REGION="${S3_REGION:-auto}" \
    aws --endpoint-url "${S3_ENDPOINT:?S3_ENDPOINT is required}" s3 sync --only-show-errors \
      "s3://${S3_BUCKET}" "$BACKUP_DIR/media"
  echo "[backup] media ok"
fi
